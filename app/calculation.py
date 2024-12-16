import csv
import itertools
import json
import pprint

pp = pprint.PrettyPrinter(indent=4)

import numpy as np
from carculator import (
    CarInputParameters,
    fill_xarray_from_input_parameters,
    get_standard_driving_cycle_and_gradient,
    CarModel,
    InventoryCar,
)

from carculator_utils import BackgroundSystemModel, ExportInventory

from . import app
from app import db
from app.models import Task
import yaml
from pathlib import Path


MAP_FUEL_BLEND = {
    "ICEV-p": "petrol",
    "ICEV-d": "diesel",
    "ICEV-g": "methane",
    "PHEV-p": "petrol",
    "PHEV-d": "diesel",
    "HEV-p": "petrol",
    "HEV-d": "diesel",
    "FCEV": "hydrogen",
}

NORMALIZATION_FACTORS = Path("./data/normalization factors.yaml")


def np_encoder(object):
    if isinstance(object, np.generic):
        return object.item()


def load_yaml_file(filepath):
    """
    Load a yaml file
    :param filepath: path to the yaml file
    :return: dictionary
    """
    with open(filepath, "r") as f:
        return yaml.load(f, Loader=yaml.FullLoader)


def extract_efficiency(variable, lst):
    efficiency_dict = {}
    for k, v in lst.items():
        if k[3] == variable:  # check if this item refers to engine efficiency
            for year, val in v.items():
                efficiency_dict[(k[1], k[2], year[0])] = val  # add the entry to the dictionary
    return efficiency_dict

class Calculation:
    def __init__(self):

        self.scope = None
        bs = BackgroundSystemModel()
        self.bs = bs
        self.cip = CarInputParameters()
        self.cip.static()
        self.export = None
        self.ic = None
        self.d_categories = {
            v["name"]: v["category"] for _, v in self.cip.metadata.items()
        }
        self.dcts, self.arr = fill_xarray_from_input_parameters(self.cip)
        self.d_pt_en = load_yaml_file("./data/translation_pwt_EN.yaml")
        self.d_pt_it = load_yaml_file("./data/translation_pwt_IT.yaml")
        self.d_pt_de = load_yaml_file("./data/translation_pwt_DE.yaml")
        self.d_pt_fr = load_yaml_file("./data/translation_pwt_FR.yaml")
        self.d_pt_all = {**self.d_pt_en, **self.d_pt_fr, **self.d_pt_it, **self.d_pt_de}

        self.d_size_en = load_yaml_file("./data/translation_size_EN.yaml")
        self.d_size_fr = load_yaml_file("./data/translation_size_FR.yaml")
        self.d_size_it = load_yaml_file("./data/translation_size_IT.yaml")
        self.d_size_de = load_yaml_file("./data/translation_size_DE.yaml")

        self.d_size_all = {
            **self.d_size_en,
            **self.d_size_fr,
            **self.d_size_it,
            **self.d_size_de,
        }

        self.d_rev_pt_en = {v: k for k, v, in self.d_pt_en.items()}
        self.d_rev_pt_fr = {v: k for k, v, in self.d_pt_fr.items()}
        self.d_rev_pt_it = {v: k for k, v, in self.d_pt_it.items()}
        self.d_rev_pt_de = {v: k for k, v, in self.d_pt_de.items()}

        self.d_rev_size_en = {v: k for k, v, in self.d_size_en.items()}
        self.d_rev_size_fr = {v: k for k, v, in self.d_size_fr.items()}
        self.d_rev_size_it = {v: k for k, v, in self.d_size_it.items()}
        self.d_rev_size_de = {v: k for k, v, in self.d_size_de.items()}

        self.excel = ""
        self.cm = None

    def load_map_file(self, lang):
        with open("data/car_to_class_map.csv", "r", encoding="ISO-8859-1") as f:
            data = [list(line) for line in csv.reader(f, delimiter=";")]

            if lang == "en":
                for d in data:
                    d[4] = self.d_rev_pt_en[d[4]]
                    d[5] = self.d_rev_size_en[d[5]]

            if lang == "fr":
                for d in data:
                    d[4] = self.d_rev_pt_fr[d[4]]
                    d[5] = self.d_rev_size_fr[d[5]]

            if lang == "de":
                for d in data:
                    d[4] = self.d_rev_pt_de[d[4]]
                    d[5] = self.d_rev_size_de[d[5]]

            if lang == "it":
                for d in data:
                    d[4] = self.d_rev_pt_it[d[4]]
                    d[5] = self.d_rev_size_it[d[5]]

        return data

    def load_params_file(self):
        with open("data/parameters definition.txt", "r", encoding="utf-8") as f:
            data = list(csv.reader(f, delimiter="\t"))
        return data

    def interpolate_array(self, years):
        return self.arr.interp(year=years, kwargs={"fill_value": "extrapolate"})

    def get_dc(self, dc):
        return get_standard_driving_cycle_and_gradient(
            name=dc,
            vehicle_type="car",
            vehicle_sizes=["Small"]
        )[0]


    def create_config_array(self, dict_params):

        arr = []
        year = [int(y) for y in dict_params[("Functional unit",)]["year"]]
        driving_cycle = dict_params[("Driving cycle",)]
        country = dict_params[("Background",)]["country"]
        passengers = dict_params[("Foreground",)][
            ("Glider", "all", "all", "average passengers", "none")
        ][(year[0], "loc")]
        cargo_mass = dict_params[("Foreground",)][
            ("Glider", "all", "all", "cargo mass", "none")
        ][(year[0], "loc")]
        lifetime = dict_params[("Foreground",)][
            ("Driving", "all", "all", "lifetime kilometers", "none")
        ][(year[0], "loc")]
        km_per_year = dict_params[("Foreground",)][
            ("Driving", "all", "all", "kilometers per year", "none")
        ][(year[0], "loc")]

        for powertrain in self.cm.array.coords["powertrain"].values:
            for size in self.cm.array.coords["size"].values:
                for iy, year in enumerate(
                        self.cm.array.coords["year"].values.astype(int)
                ):

                    electricity_mix = self.ic.mix[iy].tolist()

                    params = [
                        powertrain,
                        size,
                        int(year),
                        lifetime,
                        km_per_year,
                        passengers,
                        cargo_mass,
                        driving_cycle,
                        country,
                        electricity_mix,
                    ]
                    other_params = (
                        self.cm.array.sel(
                            powertrain=powertrain,
                            size=size,
                            year=year,
                            value=0,
                            parameter=[
                                "TtW energy",
                                "driving mass",
                                "combustion power",
                                "electric power",
                                "range",
                                "engine efficiency",
                                "transmission efficiency",
                                "TtW efficiency",
                                "battery discharge efficiency",
                                "energy battery mass",
                                "battery cell energy density",
                                "electric energy stored",
                                "battery lifetime kilometers",
                            ],
                        )
                        .values.astype(float)
                        .tolist()
                    )
                    params.extend(other_params)

                    battery_chem = self.cm.energy_storage["electric"].get(
                        (powertrain, size, year), ""
                    )
                    battery_origin = (
                        self.cm.energy_storage["origin"]
                        if powertrain in ("BEV",)
                        else ""
                    )

                    params.extend([battery_chem, battery_origin])

                    print(MAP_FUEL_BLEND)
                    print()
                    print(self.cm.fuel_blend)
                    print()


                    if MAP_FUEL_BLEND.get(powertrain) in self.cm.fuel_blend:
                        primary_fuel_type = self.cm.fuel_blend[
                            MAP_FUEL_BLEND[powertrain]].get("primary", {}).get("type", "")
                        primary_fuel_share = self.cm.fuel_blend[
                            MAP_FUEL_BLEND[powertrain]].get("primary", {}).get("share", np.zeros(iy).tolist())

                        secondary_fuel_type = self.cm.fuel_blend[
                            MAP_FUEL_BLEND[powertrain]].get("secondary", {}).get("type", "")
                        secondary_fuel_share = self.cm.fuel_blend[
                            MAP_FUEL_BLEND[powertrain]].get("secondary", {}).get("share", np.zeros(iy).tolist())
                    else:
                        primary_fuel_type = ""
                        primary_fuel_share = np.zeros(iy)
                        secondary_fuel_type = ""
                        secondary_fuel_share = np.zeros(iy)

                    params.extend(
                        [
                            primary_fuel_type,
                            primary_fuel_share.tolist(),
                            secondary_fuel_type,
                            secondary_fuel_share.tolist(),
                        ]
                    )

                    arr.append(params)

        return arr

    def remove_hybridization(self, arr):
        # remove hybridization for vehicles before 2030
        pwt = list({"ICEV-p", "ICEV-d", "ICEV-g"}.intersection(arr.powertrain.values))
        years_before_2030 = [y for y in arr["year"].values if y < 2030]

        if pwt and years_before_2030:
            arr.loc[
                dict(
                    powertrain=pwt,
                    year=years_before_2030,
                    parameter="combustion power share",
                )
            ] = 1

        return arr

    def adjust_input_parameters(self, arr, d):

        # adjust input parameters
        for key, val in d[("Foreground",)].items():
            pwt = key[1]
            if pwt == "all":
                pwt = arr.powertrain.values

            size = key[2]
            if size == "all":
                size = arr.coords["size"].values

            param = key[3]

            for year, year_val in val.items():
                arr.loc[
                    dict(
                        powertrain=pwt,
                        size=size,
                        year=year[0],
                        parameter=param,
                        value=0,
                    )
                ] = year_val

        return arr

    def get_cumulative_ttw_energy(self, list_vehicles):

        ttw = self.cm.energy.sel(
                powertrain=self.scope["powertrain"],
                size=self.scope["size"],
                year=self.scope["year"],
                value=0,
                parameter=["motive energy", "auxiliary energy", "recuperated energy"],
            ).sum(dim="parameter")

        # remove trailing zeros
        ttw = ttw.where(ttw != 0, drop=True)


        cumsum = (
            ttw
            .cumsum(dim="second")
            .transpose("powertrain", "size", "year", "second")
        )

        # Format the data so that it can be consumed directly
        # by nvd3.js
        list_vehicles = [f"{v[0]} - {v[1]} - {v[2]}" for v in list_vehicles]
        tank_to_wheel_energy = []
        for i, vehicle in enumerate(list_vehicles):
            pwt, size, year = vehicle.split(" - ")
            tank_to_wheel_energy.append(
                {
                    "key": vehicle,
                    "values": list(
                        map(lambda e: {"x": e[0], "y": e[1]}, enumerate(
                            cumsum.sel(
                                powertrain=pwt,
                                size=size,
                                year=int(year),
                            ).values
                        )
                    )
                    )
                }
            )

        return tank_to_wheel_energy

    def calculate_costs(self, list_vehicles, load_factor, fu):

        total_cost = self.cm.calculate_cost_impacts().transpose(
            "powertrain", "size", "year", "value", "parameter"
        )

        cost_benchmark = total_cost.sel(parameter="total", value=0).values.reshape(
            len(list_vehicles)
        )

        cost_types = [c for c in total_cost.parameter.values if c != "total"]

        arr_benchmark = list(
            map(
                lambda x: [
                    "cost",
                    x[0][0],
                    x[0][1],
                    x[0][2],
                    1 / x[1] if x[1] != 0 else 0,
                ],
                zip(list_vehicles, cost_benchmark),
            )
        )

        formatted_list_vehicles = [f"{v[0]}, {v[1]}, {v[2]}" for v in list_vehicles]

        dict_scatter = {
            x[0]: [x[1]] for x in zip(formatted_list_vehicles, cost_benchmark / load_factor * fu)
        }

        detailed_cost = (
                total_cost.sel(value=0, parameter=cost_types).values.reshape(
                    len(formatted_list_vehicles), len(cost_types)
                )
                / load_factor
                * fu
        )

        list_res_costs = list(
            map(
                lambda x: [
                    [
                        "ownership cost",
                        x[0][1],
                        x[0][0],
                        x[0][2],
                        cost_types[y],
                        z,
                        np.sum(x[1]),
                    ]
                    for y, z in enumerate(x[1])
                ],
                zip(list_vehicles, detailed_cost),
            )
        )

        list_res_costs = list(itertools.chain.from_iterable(list_res_costs))

        return arr_benchmark, list_res_costs, dict_scatter

    def generate_results_for_benchmark(self, array, results, list_vehicles):

        res_benchmark = results.transpose(
            "impact_category", "powertrain", "size", "year", "impact"
        )

        print(res_benchmark.coords["impact_category"].values.tolist())

        for i in ["climate change", "energy resources: non-renewable"]:
            array.extend(
                list(
                    map(
                        lambda x: [
                            i,
                            x[0][0],
                            x[0][1],
                            x[0][2],
                            1 / x[1]
                            if x[1] != 0
                            else 0 * 0.755
                            if i == "energy resources: non-renewable"
                            else 1,
                        ],
                        zip(
                            list_vehicles,
                            res_benchmark.sel(impact_category=i)
                            .sum(dim="impact")
                            .values
                            .reshape(len(list_vehicles)),
                        ),
                    )
                )
            )

        return array

    def add_environmental_results_for_scatter(
            self, list_vehicles, results, dict_scatter
    ):

        for vehicle in list_vehicles:
            dict_scatter[', '.join(vehicle)].append(
                results.sel(
                    powertrain=vehicle[0],
                    size=vehicle[1],
                    year=int(vehicle[2]),
                    impact_category="climate change",
                )
                .sum(dim="impact")
                .values
                .item(0)
            )

        return dict_scatter

    def generate_normalized_results(self, results):

        normalization_factors = load_yaml_file(NORMALIZATION_FACTORS)
        factors = np.fromiter(normalization_factors.values(), dtype=float)

        nf_impact = (
                results.sel(
                    impact_category=list(normalization_factors.keys()),
                    value=0,
                ).sum(
                    dim="impact"
                )
                / factors[:, None, None, None]
        )

        list_normalized_results = []
        for impact in nf_impact.coords["impact_category"].values:
            for s in nf_impact.coords["size"].values:
                for p in nf_impact.coords["powertrain"].values:
                    for y in nf_impact.coords["year"].values:
                        list_normalized_results.append(
                            [
                                impact,
                                s,
                                p,
                                y,
                                np.sum(
                                    nf_impact.sel(
                                        impact_category=impact,
                                        size=s,
                                        powertrain=p,
                                        year=y,
                                    ).values.item(0)
                                )
                            ]
                        )

        return list_normalized_results

    def update_task_progress(self, progress, job_id):
        with app.app_context():
            task = Task.query.filter_by(id=job_id).first()
            task.progress = progress
            db.session.commit()

    def process_results(self, d, lang, job_id):
        """Calculate LCIA and store results in an array of arrays"""

        # Update task progress to db
        self.update_task_progress(50, job_id)

        self.scope = {
            "powertrain": d[("Functional unit",)]["powertrain"],
            "size": d[("Functional unit",)]["size"],
        }

        self.dcts, self.arr = fill_xarray_from_input_parameters(
            self.cip, scope=self.scope
        )
        arr = self.interpolate_array(d[("Functional unit",)]["year"])
        self.scope.update({"year": arr.coords["year"].values})

        # remove PHEV-e, PHEV-c-p and PHEV-c-d from self.scope["powertrain"]

        self.scope["powertrain"] = [x for x in self.scope["powertrain"] if x not in ["PHEV-e", "PHEV-c-p", "PHEV-c-d"]]

        arr = self.remove_hybridization(arr)

        # adjust input parameters
        arr = self.adjust_input_parameters(arr, d)

        # battery manufacture origin
        batteries = d[("Background",)].get("energy storage", {"electric": {}})[
            "electric"
        ]
        batt_origin = "CN"
        for size, val in batteries.items():
            if "origin" in val:
                batt_origin = val["origin"]
                break

        uf = None
        if "electric utility factor" in d[("Background",)]:
            uf = d[("Background",)]["electric utility factor"]
            uf = {int(x): y for x, y in uf.items()}

        # extract fuel blends from d[("Background",)]["fuel blend"]
        # and pass it to the CarModel constructor
        fuel_blends = d[("Background",)].get("fuel blend", {})

        try:
            engine_eff = extract_efficiency("engine efficiency", d[("Foreground",)])
        except IndexError:
            engine_eff = None
        try:
            transmission_eff = extract_efficiency("transmission efficiency", d[("Foreground",)])
        except IndexError:
            transmission_eff = None

        print(engine_eff)
        print(transmission_eff)
        print(fuel_blends)
        self.cm = CarModel(
            arr,
            cycle=d[("Driving cycle",)],
            energy_storage={
                "origin": batt_origin,
            },
            electric_utility_factor=uf,
            country=d[("Background",)]["country"],
            fuel_blend=fuel_blends,
            engine_efficiency=engine_eff,
            transmission_efficiency=transmission_eff,
        )
        print(self.cm.fuel_blend)

        # adjust the electricity density of the battery cells
        for size, val in batteries.items():
            if "battery cell energy density" in val:
                self.cm.array.loc[
                    dict(
                        size=size,
                        parameter="battery cell energy density",
                        value=0,
                        powertrain="BEV"
                    )
                ] = val["battery cell energy density"]

            if "energy battery mass" in val:
                self.cm.array.loc[
                    dict(
                        size=size,
                        parameter="energy battery mass",
                        value=0,
                        powertrain="BEV"
                    )
                ] = val["energy battery mass"]

            if "battery lifetime kilometers" in val:
                self.cm.array.loc[
                    dict(
                        size=size,
                        parameter="battery lifetime kilometers",
                        value=0,
                        powertrain="BEV"
                    )
                ] = val["battery lifetime kilometers"]

        self.cm.set_all()

        # set battery type
        battery_types = {}
        for size, val in batteries.items():
            if "type" in val:
                for y in self.scope["year"]:
                    battery_types[("BEV", size, y)] = val["type"]

        self.cm.energy_storage.update({"electric": battery_types})

        list_vehicles = list(
            itertools.product(
                self.scope["powertrain"],
                self.scope["size"],
                [str(y) for y in self.scope["year"]]
            )
        )


        # fetch cumulative ttw energy
        tank_to_wheel_energy = self.get_cumulative_ttw_energy(list_vehicles)

        # Functional unit
        fu_unit = d[("Functional unit",)]["fu"]["unit"]
        fu_qty = float(d[("Functional unit",)]["fu"]["quantity"])

        if fu_unit == "vkm":
            load_factor = 1.0
        else:
            load_factor = float(self.cm["average passengers"].mean().values)

        # Update task progress to db
        self.update_task_progress(60, job_id)

        arr_benchmark, list_res_costs, dict_scatter = self.calculate_costs(
            fu=fu_qty, list_vehicles=list_vehicles, load_factor=load_factor
        )

        back_config = None
        if "custom electricity mix" in d[("Background",)]:
            back_config = {"custom electricity mix": d[("Background",)]["custom electricity mix"]}

        self.ic = InventoryCar(
            self.cm,
            functional_unit=fu_unit,
            background_configuration=back_config,
        )

        # Update task progress to db
        self.update_task_progress(70, job_id)

        results = (
            self.ic.calculate_impacts()
            .sel(value=0)
            .transpose("impact_category", "size", "powertrain", "year", "impact")
        )

        lifetime = int(self.cm.array.sel(parameter="lifetime kilometers").mean().values)
        impact_category = results.coords["impact_category"].values.tolist()

        # Update task progress to db
        self.update_task_progress(80, job_id)

        # add other benchmark numbers
        arr_benchmark = self.generate_results_for_benchmark(
            arr_benchmark, results, list_vehicles
        )

        # add environmental impacts to scatter plot
        dict_scatter = self.add_environmental_results_for_scatter(
            dict_scatter=dict_scatter,
            results=results,
            list_vehicles=list_vehicles,
        )

        a_wo_impact = [
            impact_category,
            self.scope["size"],
            self.scope["powertrain"],
            [str(y) for y in self.scope["year"]]
        ]

        l_impacts_wo_impact = list(itertools.product(*a_wo_impact))

        list_res = []
        for vehicle in l_impacts_wo_impact:
            impact_cat, size, powertrain, year = vehicle
            year = int(year)
            for impact in results.impact.values:
                list_res.append(
                    [
                        impact_cat,
                        size,
                        powertrain,
                        year,
                        impact,
                        results.sel(
                            impact_category=impact_cat,
                            size=size,
                            powertrain=powertrain,
                            year=year,
                            impact=impact,
                        ).values.item(0),
                        results.sel(
                            impact_category=impact_cat,
                            size=size,
                            powertrain=powertrain,
                            year=year,
                        ).sum().values.item(0),
                    ]
                )

        list_res.extend(list_res_costs)

        list_res_acc = []

        for vehicle in l_impacts_wo_impact:
            impact_cat, size, powertrain, year = vehicle
            year = int(year)
            fix_burden = results.sel(
                impact_category=impact_cat,
                size=size,
                powertrain=powertrain,
                year=year,
                impact=[
                    "powertrain",
                    "energy storage",
                    "glider",
                    "EoL"
                ]
            ).sum(dim="impact").values.item(0) * lifetime
            var_burden = results.sel(
                impact_category=impact_cat,
                size=size,
                powertrain=powertrain,
                year=year,
                impact=[
                    "energy chain",
                    "direct - exhaust",
                    "direct - non-exhaust",
                    "maintenance",
                    "road"
                ]
            ).sum(dim="impact").values.item(0)

            list_res_acc.append(
                [
                    impact_cat,
                    size,
                    powertrain,
                    year,
                    fix_burden,
                    var_burden,
                    lifetime,
                ]
            )

        # Update task progress to db
        self.update_task_progress(80, job_id)

        self.ic = InventoryCar(
            self.cm,
            functional_unit=fu_unit,
            background_configuration=back_config,
            method="ilcd",
        )

        results = self.ic.calculate_impacts()

        # generate normalized results
        normalized_results = self.generate_normalized_results(
            results
        )

        # Update task progress to db
        self.update_task_progress(85, job_id)

        # Update task progress to db
        self.update_task_progress(100, job_id)

        list_res = self.remove_micro_petrols_from_list(list_res)
        arr_benchmark = self.remove_micro_petrols_from_list(arr_benchmark)
        tank_to_wheel_energy = self.remove_micro_petrols_from_list_of_dicts(
            tank_to_wheel_energy
        )
        dict_scatter = self.remove_micro_petrols_from_dicts(dict_scatter)
        list_res_acc = self.remove_micro_petrols_from_list(list_res_acc)

        config_array = self.create_config_array(d)
        config_array = self.remove_micro_petrols_from_list(config_array)

        normalized_results = self.remove_micro_petrols_from_list(normalized_results)

        return (
            json.dumps(
                [
                    lang,
                    list_res,
                    arr_benchmark,
                    tank_to_wheel_energy,
                    dict_scatter,
                    list_res_acc,
                    config_array,
                    self.cm.country,
                    float(fu_qty),
                    fu_unit,
                    normalized_results,
                ],
                default=np_encoder
            ),
            self.ic,
        )

    def remove_micro_petrols_from_list_of_dicts(self, list_of_dicts):

        forbidden_vehicles = [
            "ICEV-p",
            "ICEV-d",
            "ICEV-g",
            "HEV-p",
            "HEV-d",
            "FCEV",
            "PHEV-p",
            "PHEV-d",
        ]

        for i in list_of_dicts:
            if "Micro" in i["key"]:
                if any(pt in i["key"] for pt in forbidden_vehicles):
                    list_of_dicts.remove(i)

        return list_of_dicts

    def remove_micro_petrols_from_list(self, res):

        forbidden_vehicles = [
            "ICEV-p",
            "ICEV-d",
            "ICEV-g",
            "HEV-p",
            "HEV-d",
            "FCEV",
            "PHEV-p",
            "PHEV-d",
        ]
        new_res = []
        for r in res:
            if "Micro" not in r:
                new_res.append(r)
            else:
                if not any(pt in r for pt in forbidden_vehicles):
                    new_res.append(r)

        return new_res

    def remove_micro_petrols_from_dicts(self, dicts):

        forbidden_vehicles = [
            "ICEV-p",
            "ICEV-d",
            "ICEV-g",
            "HEV-p",
            "HEV-d",
            "FCEV",
            "PHEV-p",
            "PHEV-d",
        ]

        list_keys_to_keep = [
            k
            for k in dicts
            if "Micro" not in k
               or ("Micro" in k and not any(pt in k for pt in forbidden_vehicles))
        ]
        dicts = {k: v for k, v in dicts.items() if k in list_keys_to_keep}

        return dicts

    def format_dictionary(self, raw_dict):
        """Format the dictionary sent by the user so that it can be understood by `carculator`"""

        d_sliders = {
            "mileage-slider": "kilometers per year",
            "lifetime-slider": "lifetime kilometers",
            "passenger-slider": "average passengers",
            "cargo-slider": "cargo mass",
        }
        new_dict = {}

        new_dict[("Functional unit",)] = {
            "powertrain": raw_dict["type"],
            "year": [int(x) for x in raw_dict["year"]],
            "size": raw_dict["size"],
            "fu": raw_dict["fu"],
        }

        f_d = {}
        new_dict[("Driving cycle",)] = raw_dict["driving_cycle"]
        new_dict[("Background",)] = {
            k: v
            for k, v in raw_dict["background params"].items()
            if k not in ("energy storage", "efficiency")
        }

        # Ensure that the electricity mix split equals 1
        for el in new_dict[("Background",)]["custom electricity mix"]:
            el /= np.sum(np.array(el))

        if "energy storage" in raw_dict["background params"]:
            if "electric" in raw_dict["background params"]["energy storage"]:
                if len(raw_dict["background params"]["energy storage"]["electric"]) > 0:
                    energy_storage = raw_dict["background params"]["energy storage"]
                    new_dict[("Background",)]["energy storage"] = energy_storage

        for k, v in raw_dict["foreground params"].items():
            if k in d_sliders:
                name = d_sliders[k]
                cat = self.d_categories.get(name, "Calculated")
                powertrain = "all"
                size = "all"

                if isinstance(v, str):
                    val = [float(v.replace(" ", ""))] * len(
                        new_dict[("Functional unit",)]["year"]
                    )
                else:
                    val = [float(v)] * len(new_dict[("Functional unit",)]["year"])
            else:

                k = tuple(k.split(","))
                name = k[0]

                cat = self.d_categories.get(name, "Calculated")
                powertrain = k[1]
                size = k[2]
                val = [float(n) for n in v] * len(
                    new_dict[("Functional unit",)]["year"]
                )

            d_val = {
                (k, "loc"): v
                for k, v in list(zip(new_dict[("Functional unit",)]["year"], val))
            }

            f_d[(cat, powertrain, size, name, "none")] = d_val

        if "energy storage" in raw_dict["background params"]:
            if "electric" in raw_dict["background params"]["energy storage"]:
                energy_storage = raw_dict["background params"]["energy storage"][
                    "electric"
                ]
                for e in energy_storage:
                    size = e
                    for p in energy_storage[e]:
                        if p not in ("type", "origin"):
                            cat = self.d_categories.get(name, "Calculated")
                            powertrain = "BEV"
                            val = energy_storage[e][p]

                            d_val = {
                                (k, "loc"): v
                                for k, v in list(
                                    zip(new_dict[("Functional unit",)]["year"], val)
                                )
                            }

                            f_d[(cat, powertrain, size, p, "none")] = d_val

        if "efficiency" in raw_dict["background params"]:
            efficiency = raw_dict["background params"]["efficiency"]
            efficiency = {
                k: v for k, v in efficiency.items() if len(list(v.keys())) > 0
            }

            for eff in efficiency:
                powertrain = eff
                for s in efficiency[eff]:
                    size = s
                    for c in efficiency[eff][s]:
                        name = c
                        cat = self.d_categories.get(name, "Calculated")

                        if np.sum(efficiency[eff][s][c]) != 0:
                            val = efficiency[eff][s][c]
                            d_val = {
                                (k, "loc"): v
                                for k, v in list(
                                    zip(new_dict[("Functional unit",)]["year"], val)
                                )
                            }
                            f_d[(cat, powertrain, size, name, "none")] = d_val

        new_dict[("Foreground",)] = f_d

        return new_dict
