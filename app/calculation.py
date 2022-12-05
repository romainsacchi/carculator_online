import csv
import itertools
import json
import pprint

pp = pprint.PrettyPrinter(indent=4)

import numpy as np
from carculator import (
    CarInputParameters,
    fill_xarray_from_input_parameters,
    modify_xarray_from_custom_parameters,
    get_standard_driving_cycle,
    CarModel,
    InventoryCalculation,
    BackgroundSystemModel,
    ExportInventory,
)

from . import app
from app import db
from app.models import Task


class Calculation:
    def __init__(self):

        bs = BackgroundSystemModel()
        self.electricity_mix = bs.electricity_mix
        self.biogasoline = bs.biogasoline
        self.biodiesel = bs.biodiesel
        self.biomethane = bs.biomethane
        self.region_map = bs.region_map
        self.cip = CarInputParameters()
        self.cip.static()
        self.export = None
        self.ic = None
        self.d_categories = {
            v["name"]: v["category"] for _, v in self.cip.metadata.items()
        }
        self.dcts, self.arr = fill_xarray_from_input_parameters(self.cip)
        self.d_pt_en = {
            "Petrol": "ICEV-p",
            "Diesel": "ICEV-d",
            "CNG": "ICEV-g",
            "Electric": "BEV",
            "Fuel cell": "FCEV",
            "Hybrid-petrol": "HEV-p",
            "Hybrid-diesel": "HEV-d",
            "(Plugin) Hybrid-petrol": "PHEV-p",
            "(Plugin) Hybrid-diesel": "PHEV-d",
        }
        self.d_pt_it = {
            "Benzina": "ICEV-p",
            "Diesel": "ICEV-d",
            "Gas compresso": "ICEV-g",
            "Elettrica": "BEV",
            "Cella a combustibile": "FCEV",
            "Ibrido benzina": "HEV-p",
            "Ibrido diesel": "HEV-d",
            "Ibrido-benzina (Plugin)": "PHEV-p",
            "Ibrido-diesel (Plugin)": "PHEV-d",
        }
        self.d_pt_de = {
            "Benzin": "ICEV-p",
            "Diesel": "ICEV-d",
            "Komprimiertes Gas": "ICEV-g",
            "Elektrisch": "BEV",
            "Brennstoffzelle": "FCEV",
            "Hybrid-Benzin": "HEV-p",
            "Hybrid-Diesel": "HEV-d",
            "(Plugin) Hybrid-Benzin": "PHEV-p",
            "(Plugin) Hybrid-Diesel": "PHEV-d",
        }
        self.d_pt_fr = {
            "Essence": "ICEV-p",
            "Diesel": "ICEV-d",
            "Gaz comprimé": "ICEV-g",
            "Electrique": "BEV",
            "Pile à combustible": "FCEV",
            "Hybride-essence": "HEV-p",
            "Hybride-diesel": "HEV-d",
            "Hybride-essence rechargeable": "PHEV-p",
            "Hybride-diesel rechargeable": "PHEV-d",
        }
        self.d_pt_all = {**self.d_pt_en, **self.d_pt_fr, **self.d_pt_it, **self.d_pt_de}

        self.d_size_en = {
            "Micro": "Micro",
            "Minicompact": "Mini",
            "Subcompact": "Small",
            "Compact": "Lower medium",
            "Mid-size": "Medium",
            "SUV (Mid-size)": "Medium SUV",
            "Large": "Large",
            "SUV (Large)": "Large SUV",
            "Van": "Van",
        }
        self.d_size_fr = {
            "Micro": "Micro",
            "Mini-citadine": "Mini",
            "Citadine": "Small",
            "Berline compacte": "Lower medium",
            "Berline familiale": "Medium",
            "Grande routière": "Large",
            "SUV (compact)": "Medium SUV",
            "SUV (grand)": "Large SUV",
            "Van": "Van",
        }
        self.d_size_it = {
            "Micro": "Micro",
            "Mini citycar": "Mini",
            "Citycar": "Small",
            "Berlina compatta": "Lower medium",
            "Berlina medio-grande": "Medium",
            "Berlina tre volumi": "Large",
            "SUV (compatto)": "Medium SUV",
            "SUV (grande)": "Large SUV",
            "Van": "Van",
        }
        self.d_size_de = {
            "Mikroauto": "Micro",
            "Kleinstwagen": "Mini",
            "Kleinwagen": "Small",
            "Kompaktklasse": "Lower medium",
            "Mittelklasse": "Medium",
            "Oberklasse": "Large",
            "Geländewagen(groß)": "Large SUV",
            "Geländewagen(kompakt)": "Medium SUV",
            "Van": "Van",
        }
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
        return get_standard_driving_cycle(dc)

    def create_config_array(self, dict_params, array, mix):

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

        for powertrain in array.coords["powertrain"].values:
            for size in array.coords["size"].values:
                for iy, year in enumerate(array.coords["year"].values.astype(int)):

                    electricity_mix = mix[iy].tolist()

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
                        array.sel(
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
                                "drivetrain efficiency",
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

                    if powertrain in ("BEV"):
                        battery_chem = dict_params[("Background",)]["energy storage"][
                            "electric"
                        ]["type"]
                        battery_origin = dict_params[("Background",)]["energy storage"]["origin"]
                        (
                            primary_fuel_type,
                            primary_fuel_share,
                            secondary_fuel_type,
                            secondary_fuel_share,
                        ) = ["", "", "", ""]
                    else:
                        battery_chem, battery_origin = ["", ""]

                    if powertrain in ("ICEV-p", "PHEV-p", "HEV-p"):
                        if "fuel blend" in dict_params[("Background",)]:
                            if "petrol" in dict_params[("Background",)]["fuel blend"]:
                                primary_fuel_type = dict_params[("Background",)][
                                    "fuel blend"
                                ]["petrol"]["primary fuel"]["type"]
                                primary_fuel_share = dict_params[("Background",)][
                                    "fuel blend"
                                ]["petrol"]["primary fuel"]["share"][iy]
                                secondary_fuel_type = dict_params[("Background",)][
                                    "fuel blend"
                                ]["petrol"]["secondary fuel"]["type"]
                                secondary_fuel_share = dict_params[("Background",)][
                                    "fuel blend"
                                ]["petrol"]["secondary fuel"]["share"][iy]
                            else:
                                if country in self.biogasoline.country.values:
                                    share_biogasoline = np.squeeze(
                                        np.clip(
                                            self.biogasoline.sel(country=country)
                                            .interp(
                                                year=year,
                                                kwargs={"fill_value": "extrapolate"},
                                            )
                                            .values,
                                            0,
                                            1,
                                        )
                                    ).tolist()
                                else:
                                    share_biogasoline = 0
                                (
                                    primary_fuel_type,
                                    primary_fuel_share,
                                    secondary_fuel_type,
                                    secondary_fuel_share,
                                ) = [
                                    "petrol",
                                    1 - share_biogasoline,
                                    "bioethanol - wheat straw",
                                    share_biogasoline,
                                ]

                        else:
                            if country in self.biogasoline.country.values:
                                share_biogasoline = np.squeeze(
                                    np.clip(
                                        self.biogasoline.sel(country=country)
                                        .interp(
                                            year=year,
                                            kwargs={"fill_value": "extrapolate"},
                                        )
                                        .values,
                                        0,
                                        1,
                                    )
                                ).tolist()
                            else:
                                share_biogasoline = 0
                            (
                                primary_fuel_type,
                                primary_fuel_share,
                                secondary_fuel_type,
                                secondary_fuel_share,
                            ) = [
                                "petrol",
                                1 - share_biogasoline,
                                "bioethanol - wheat straw",
                                share_biogasoline,
                            ]

                    if powertrain in ("ICEV-d", "PHEV-d", "HEV-d"):
                        if "fuel blend" in dict_params[("Background",)]:
                            if "diesel" in dict_params[("Background",)]["fuel blend"]:
                                primary_fuel_type = dict_params[("Background",)][
                                    "fuel blend"
                                ]["diesel"]["primary fuel"]["type"]
                                primary_fuel_share = dict_params[("Background",)][
                                    "fuel blend"
                                ]["diesel"]["primary fuel"]["share"][iy]
                                secondary_fuel_type = dict_params[("Background",)][
                                    "fuel blend"
                                ]["diesel"]["secondary fuel"]["type"]
                                secondary_fuel_share = dict_params[("Background",)][
                                    "fuel blend"
                                ]["diesel"]["secondary fuel"]["share"][iy]
                            else:
                                if country in self.biodiesel.country.values:
                                    share_biodiesel = np.squeeze(
                                        np.clip(
                                            self.biodiesel.sel(country=country)
                                            .interp(
                                                year=year,
                                                kwargs={"fill_value": "extrapolate"},
                                            )
                                            .values,
                                            0,
                                            1,
                                        )
                                    ).tolist()
                                else:
                                    share_biodiesel = 0
                                (
                                    primary_fuel_type,
                                    primary_fuel_share,
                                    secondary_fuel_type,
                                    secondary_fuel_share,
                                ) = [
                                    "diesel",
                                    1 - share_biodiesel,
                                    "biodiesel - cooking oil",
                                    share_biodiesel,
                                ]

                        else:
                            if country in self.biodiesel.country.values:
                                share_biodiesel = np.squeeze(
                                    np.clip(
                                        self.biodiesel.sel(country=country)
                                        .interp(
                                            year=year,
                                            kwargs={"fill_value": "extrapolate"},
                                        )
                                        .values,
                                        0,
                                        1,
                                    )
                                ).tolist()
                            else:
                                share_biodiesel = 0
                            (
                                primary_fuel_type,
                                primary_fuel_share,
                                secondary_fuel_type,
                                secondary_fuel_share,
                            ) = [
                                "diesel",
                                1 - share_biodiesel,
                                "biodiesel - cooking oil",
                                share_biodiesel,
                            ]

                    if powertrain in ("ICEV-g"):
                        if "fuel blend" in dict_params[("Background",)]:
                            if "cng" in dict_params[("Background",)]["fuel blend"]:
                                primary_fuel_type = dict_params[("Background",)][
                                    "fuel blend"
                                ]["cng"]["primary fuel"]["type"]
                                primary_fuel_share = dict_params[("Background",)][
                                    "fuel blend"
                                ]["cng"]["primary fuel"]["share"][iy]
                                secondary_fuel_type = dict_params[("Background",)][
                                    "fuel blend"
                                ]["cng"]["secondary fuel"]["type"]
                                secondary_fuel_share = dict_params[("Background",)][
                                    "fuel blend"
                                ]["cng"]["secondary fuel"]["share"][iy]
                            else:
                                if country in self.biomethane.country.values:
                                    share_biomethane = np.squeeze(
                                        np.clip(
                                            self.biomethane.sel(country=country)
                                            .interp(
                                                year=year,
                                                kwargs={"fill_value": "extrapolate"},
                                            )
                                            .values,
                                            0,
                                            1,
                                        )
                                    ).tolist()
                                else:
                                    share_biomethane = 0
                                (
                                    primary_fuel_type,
                                    primary_fuel_share,
                                    secondary_fuel_type,
                                    secondary_fuel_share,
                                ) = [
                                    "cng",
                                    1 - share_biomethane,
                                    "biogas - sewage sludge",
                                    share_biomethane,
                                ]

                        else:
                            if country in self.biomethane.country.values:
                                share_biomethane = np.squeeze(
                                    np.clip(
                                        self.biomethane.sel(country=country)
                                        .interp(
                                            year=year,
                                            kwargs={"fill_value": "extrapolate"},
                                        )
                                        .values,
                                        0,
                                        1,
                                    )
                                ).tolist()
                            else:
                                share_biomethane = 0
                            (
                                primary_fuel_type,
                                primary_fuel_share,
                                secondary_fuel_type,
                                secondary_fuel_share,
                            ) = [
                                "cng",
                                1 - share_biomethane,
                                "biogas - sewage sludge",
                                share_biomethane,
                            ]

                    if powertrain in ("FCEV"):
                        if "fuel blend" in dict_params[("Background",)]:
                            if "hydrogen" in dict_params[("Background",)]["fuel blend"]:
                                primary_fuel_type = dict_params[("Background",)][
                                    "fuel blend"
                                ]["hydrogen"]["primary fuel"]["type"]
                                primary_fuel_share = dict_params[("Background",)][
                                    "fuel blend"
                                ]["hydrogen"]["primary fuel"]["share"][iy]
                                secondary_fuel_type = dict_params[("Background",)][
                                    "fuel blend"
                                ]["hydrogen"]["secondary fuel"]["type"]
                                secondary_fuel_share = dict_params[("Background",)][
                                    "fuel blend"
                                ]["hydrogen"]["secondary fuel"]["share"][iy]
                            else:
                                (
                                    primary_fuel_type,
                                    primary_fuel_share,
                                    secondary_fuel_type,
                                    secondary_fuel_share,
                                ) = ["electrolysis", 1, "", ""]
                        else:
                            (
                                primary_fuel_type,
                                primary_fuel_share,
                                secondary_fuel_type,
                                secondary_fuel_share,
                            ) = ["electrolysis", 1, "", ""]

                    params.extend(
                        [
                            battery_chem,
                            battery_origin,
                            primary_fuel_type,
                            primary_fuel_share,
                            secondary_fuel_type,
                            secondary_fuel_share,
                        ]
                    )

                    arr.append(params)

        return arr

    def process_results(self, d, lang, job_id):
        """ Calculate LCIA and store results in an array of arrays """

        # Update task progress to db
        with app.app_context():
            task = Task.query.filter_by(id=job_id).first()
            task.progress = 50
            db.session.commit()

        scope = {
            "powertrain": d[("Functional unit",)]["powertrain"],
            "size": d[("Functional unit",)]["size"],
        }

        self.dcts, self.arr = fill_xarray_from_input_parameters(self.cip, scope=scope)
        arr = self.interpolate_array(d[("Functional unit",)]["year"])
        modify_xarray_from_custom_parameters(d[("Foreground",)], arr)

        # remove hybridization for vehicles before 2030
        pwt = list(
            {"ICEV-param", "ICEV-d", "ICEV-g"}.intersection(set(scope["powertrain"]))
        )
        years_before_2030 = [y for y in arr["year"].values if y < 2030]

        if pwt and years_before_2030:
            arr.loc[
                dict(
                    powertrain=pwt,
                    year=years_before_2030,
                    parameter="combustion power share",
                )
            ] = 1

        batt_type, batt_origin = ({}, "CN")

        if "energy storage" in d[("Background",)]:
            if "electric" in d[("Background",)]["energy storage"]:
                en_stor = d[("Background",)]["energy storage"]["electric"]
                for key, val in en_stor.items():
                    for year in d[("Functional unit",)]["year"]:
                        batt_type[("BEV", key, year)] = val["type"]
                        batt_origin = val.get("origin", "CN")

        uf=None
        if "electric utility factor" in d[("Background",)]:
            uf = d[("Background",)]["electric utility factor"]
            uf = {int(x): y for x, y in uf.items()}

        carmodel = CarModel(
            arr,
            cycle=d[("Driving cycle",)],
            energy_storage=batt_type,
            electric_utility_factor=uf,
        )

        # adjust the electricity density of the battery cells
        for param in d[("Foreground",)]:
            if param[3] in ("battery cell energy density", "battery cell mass share"):
                for year in d[("Foreground",)][param]:
                    carmodel.array.loc[
                        dict(parameter=param[3], year=year[0])
                    ] = d[("Foreground",)][param][year]


        carmodel.set_all()

        powertrain = carmodel.array.powertrain.values
        size = d[("Functional unit",)]["size"]
        year = d[("Functional unit",)]["year"]
        all_lists = [powertrain] + [size] + [year]
        l = list(itertools.product(*all_lists))
        l = [i[0] + " - " + i[1] + " - " + str(i[2]) for i in l]

        cumsum = (
            carmodel.energy.sel(
                powertrain=powertrain,
                size=size,
                year=year,
                value=0,
                parameter=["motive energy", "auxiliary energy", "recuperated energy"],
            )
            .cumsum(dim="second")
            .sum(dim="parameter")
            .transpose("powertrain", "size", "year", "second")
            .values.reshape(len(l), -1)
            .astype("float64")
        )

        # Format the data so that it can be consumed directly
        # by nvd3.js
        tank_to_wheel_energy = []
        for i, vehicle in enumerate(l):
            tank_to_wheel_energy.append(
                {
                    "key": vehicle,
                    "values": list(
                        map(lambda e: {"x": e[0], "y": e[1]}, enumerate(cumsum[i]))
                    ),
                }
            )

        # Functional unit
        fu_unit = d[("Functional unit",)]["fu"]["unit"]
        fu_qty = float(d[("Functional unit",)]["fu"]["quantity"])

        if fu_unit == "vkm":
            load_factor = 1
        else:
            load_factor = carmodel["average passengers"].mean().values

        # Update task progress to db
        with app.app_context():
            task = Task.query.filter_by(id=job_id).first()
            task.progress = 60
            db.session.commit()

        scope = {"powertrain": powertrain, "size": size, "year": year}
        total_cost = (
            carmodel.calculate_cost_impacts(scope=scope)
            .transpose("powertrain", "size", "year", "value", "parameter")
            .astype("float64")
        )

        cost_benchmark = total_cost.sel(parameter="total", value=0).values.reshape(
            len(l)
        )

        cost_types = [c for c in total_cost.parameter.values if c != "total"]

        arr_benchmark = list(
            map(
                lambda x: [
                    "cost",
                    x[0].split(" - ")[0],
                    x[0].split(" - ")[1],
                    x[0].split(" - ")[2],
                    1 / x[1] if x[1] != 0 else 0,
                ],
                zip(l, cost_benchmark),
            )
        )

        l_scatter = [x.replace(" - ", ", ") for x in l]

        dict_scatter = {
            x[0]: [x[1]] for x in zip(l_scatter, cost_benchmark / load_factor * fu_qty)
        }

        detailed_cost = (
            total_cost.sel(value=0, parameter=cost_types).values.reshape(
                len(l), len(cost_types)
            )
            / load_factor
            * fu_qty
        )

        all_lists = [powertrain] + [size] + [year]
        l_cost = list(itertools.product(*all_lists))

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
                zip(l_cost, detailed_cost),
            )
        )

        list_res_costs = list(itertools.chain.from_iterable(list_res_costs))


        if "energy storage" in d[("Background",)]:
            if "electric" in d[("Background",)]["energy storage"]:
                d[("Background",)]["energy storage"] = {
                    "electric": {
                        "type": list(batt_type.values())[0],
                    },
                    "origin": batt_origin
                }
            else:
                d[("Background",)]["energy storage"] = {
                    "electric": {
                        "type": list(batt_type.values())[0],
                    },
                    "origin": batt_origin,
                }


        self.ic = InventoryCalculation(
            carmodel,
            scope=d[("Functional unit",)]["fu"],
            background_configuration=d[("Background",)],
        )
        # Update task progress to db
        with app.app_context():
            task = Task.query.filter_by(id=job_id).first()
            task.progress = 70
            db.session.commit()

        results = (
            self.ic.calculate_impacts()
            .sel(value=0)
            .transpose("impact_category", "size", "powertrain", "year", "impact")
        ).astype("float64")

        res_benchmark = (
            self.ic.calculate_impacts()
            .sel(value=0)
            .transpose("impact_category", "powertrain", "size", "year", "impact")
        ).astype("float64")

        lifetime = int(
            carmodel.array.sel(parameter="lifetime kilometers").mean().values
        )

        # Update task progress to db
        with app.app_context():
            task = Task.query.filter_by(id=job_id).first()
            task.progress = 80
            db.session.commit()

        impact = results.coords["impact"].values.tolist()
        impact_category = results.coords["impact_category"].values

        arr_benchmark.extend(
            list(
                map(
                    lambda x: [
                        "climate change",
                        x[0].split(" - ")[0],
                        x[0].split(" - ")[1],
                        x[0].split(" - ")[2],
                        1 / x[1] if x[1] != 0 else 0,
                    ],
                    zip(
                        l,
                        res_benchmark.sel(impact_category="climate change")
                        .sum(dim="impact")
                        .values.reshape(len(l)),
                    ),
                )
            )
        )

        arr_benchmark.extend(
            list(
                map(
                    lambda x: [
                        "fossil depletion",
                        x[0].split(" - ")[0],
                        x[0].split(" - ")[1],
                        x[0].split(" - ")[2],
                        1 / x[1] * 0.755 if x[1] != 0 else 0,  # 0.755 kg/L gasoline
                    ],
                    zip(
                        l,
                        res_benchmark.sel(impact_category="fossil depletion")
                        .sum(dim="impact")
                        .values.reshape(len(l)),
                    ),
                )
            )
        )

        for x in zip(
            l_scatter,
            results.sel(impact_category="climate change")
            .sum(dim="impact")
            .values.reshape(len(l))
            / load_factor
            * fu_qty,
        ):
            existing_list = dict_scatter[x[0]]
            existing_list.append(x[1])
            dict_scatter[x[0]] = existing_list

        a_wo_impact = [impact_category] + [size] + [powertrain] + [year]
        l_impacts_wo_impact = list(itertools.product(*a_wo_impact))

        list_res = list(
            map(
                lambda x: [
                    [x[0][0], x[0][1], x[0][2], x[0][3], impact[y], z, np.sum(x[1])]
                    for y, z in enumerate(x[1])
                ],
                zip(
                    l_impacts_wo_impact,
                    (
                        results.values.reshape(len(l_impacts_wo_impact), len(impact))
                        / load_factor
                        * fu_qty
                    ),
                ),
            )
        )

        list_res = list(itertools.chain.from_iterable(list_res))

        list_res_acc = list(
            map(
                lambda x: [
                    x[0][0],
                    x[0][1],
                    x[0][2],
                    x[0][3],
                    np.sum(x[1][4:-1]) * lifetime,
                    np.sum(x[1][[0, 1, 2, 3, -1]]),
                    lifetime,
                ],
                zip(
                    l_impacts_wo_impact,
                    (
                        results.values.reshape(len(l_impacts_wo_impact), len(impact),)
                        / load_factor
                        * fu_qty
                    ),
                ),
            )
        )

        # Update task progress to db
        with app.app_context():
            task = Task.query.filter_by(id=job_id).first()
            task.progress = 90
            db.session.commit()

        self.ic = InventoryCalculation(
            carmodel,
            scope=d[("Functional unit",)]["fu"],
            background_configuration=d[("Background",)],
            method="ilcd",
        )
        results = self.ic.calculate_impacts().astype("float64")

        nf = np.array(
            [
                1.18e4,
                4.75e-4,
                3.85e-5,
                6.36e-2,
                8.4e3,
                8.4e3,
                8.4e3,
                8.4e3,
                5.55e1,
                7.34e-1,
                2.83e1,
                1.77e2,
                4.22e3,
                2.34e-2,
                4.06e1,
                7.18e-4,
                1.18e4,
                6.53e4,
                1.4e6,
            ]
        )

        nf_impact = (results / nf[:, None, None, None, None, None]).sum(dim="impact")
        impact_category = nf_impact.coords["impact_category"].values

        all_lists = [impact_category] + [size] + [powertrain] + [year]
        l_norm = list(itertools.product(*all_lists))

        list_normalized_results = list(
            map(
                lambda x: [x[0][0], x[0][1], x[0][2], x[0][3], x[1]],
                zip(
                    l_norm,
                    (nf_impact.values.reshape(len(l_norm)) / load_factor * fu_qty),
                ),
            )
        )

        # Update task progress to db
        with app.app_context():
            task = Task.query.filter_by(id=job_id).first()
            task.progress = 85
            db.session.commit()

        # reformat A for export
        self.ic.inputs = self.ic.get_dict_input()
        # self.ic.bs = BackgroundSystemModel()
        self.ic.country = self.ic.get_country_of_use()
        self.ic.add_additional_activities()
        self.ic.rev_inputs = self.ic.get_rev_dict_input()
        self.ic.A = self.ic.get_A_matrix()

        # add vehicles datasets
        self.ic.add_additional_activities_for_export()

        # Update dictionary
        self.ic.rev_inputs = self.ic.get_rev_dict_input()

        # resize A matrix
        self.ic.A = self.ic.get_A_matrix()

        # Create electricity and fuel market datasets
        self.ic.create_electricity_market_for_fuel_prep()

        # Create fuel markets
        self.ic.fuel_blends = {}
        self.ic.fuel_dictionary = self.ic.create_fuel_dictionary()
        self.ic.define_fuel_blends()
        self.ic.set_actual_range()

        # Create electricity market dataset for battery production
        self.ic.create_electricity_market_for_battery_production()
        self.ic.set_inputs_in_A_matrix_for_export(self.ic.array.values)

        self.export = ExportInventory(self.ic.A, self.ic.rev_inputs)

        # Update task progress to db
        with app.app_context():
            task = Task.query.filter_by(id=job_id).first()
            task.progress = 100
            db.session.commit()

        list_res.extend(list_res_costs)

        list_res = self.remove_micro_petrols_from_list(list_res)
        arr_benchmark = self.remove_micro_petrols_from_list(arr_benchmark)
        tank_to_wheel_energy = self.remove_micro_petrols_from_list_of_dicts(
            tank_to_wheel_energy
        )
        dict_scatter = self.remove_micro_petrols_from_dicts(dict_scatter)
        list_res_acc = self.remove_micro_petrols_from_list(list_res_acc)

        config_array = self.create_config_array(d, carmodel.array, self.ic.mix)
        config_array = self.remove_micro_petrols_from_list(config_array)

        list_normalized_results = self.remove_micro_petrols_from_list(
            list_normalized_results
        )

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
                    d[("Background",)]["country"],
                    d[("Functional unit",)]["fu"]["quantity"],
                    d[("Functional unit",)]["fu"]["unit"],
                    list_normalized_results,
                ]
            ),
            self.export,
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
        """ Format the dictionary sent by the user so that it can be understood by `carculator` """

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

        # Ensure that the electricity mix is present
        if "custom electricity mix" not in new_dict[("Background",)]:
            years = new_dict[("Functional unit",)]["year"]
            country = new_dict[("Background",)]["country"]
            try:
                response = (
                    self.electricity_mix.loc[
                        dict(
                            country=country,
                            variable=[
                                "Hydro",
                                "Nuclear",
                                "Gas",
                                "Solar",
                                "Wind",
                                "Biomass",
                                "Coal",
                                "Oil",
                                "Geothermal",
                                "Waste",
                            ],
                        )
                    ]
                    .interp(year=years)
                    .values
                )
            except KeyError:
                response = (
                    self.electricity_mix.loc[
                        dict(
                            country="RER",
                            variable=[
                                "Hydro",
                                "Nuclear",
                                "Gas",
                                "Solar",
                                "Wind",
                                "Biomass",
                                "Coal",
                                "Oil",
                                "Geothermal",
                                "Waste",
                            ],
                        )
                    ]
                    .interp(year=years)
                    .values
                )

            new_dict[("Background",)]["custom electricity mix"] = response

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