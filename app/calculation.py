from app import db
from carculator import *
import json

import csv
from collections import defaultdict
from app.models import Task
import numpy as np

class Calculation:
    def __init__(self):

        bs = BackgroundSystemModel()
        self.electricity_mix = bs.electricity_mix
        self.biofuel = bs.biofuel
        self.region_map = bs.region_map
        self.cip = CarInputParameters()
        self.cip.static()
        self.d_categories = {
            self.cip.metadata[a]["name"]: self.cip.metadata[a]["category"]
            for a in self.cip.metadata
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
        self.d_pt_all={
            "Petrol": "ICEV-p",
            "Diesel": "ICEV-d",
            "CNG": "ICEV-g",
            "Electric": "BEV",
            "Fuel cell": "FCEV",
            "Hybrid-petrol": "HEV-p",
            "Hybrid-diesel": "HEV-d",
            "(Plugin) Hybrid-petrol": "PHEV-p",
            "(Plugin) Hybrid-diesel": "PHEV-d",
            "Benzina": "ICEV-p",
            "Gas compresso": "ICEV-g",
            "Elettrica": "BEV",
            "Cella a combustibile": "FCEV",
            "Ibrido benzina": "HEV-p",
            "Ibrido diesel": "HEV-d",
            "Ibrido-benzina (Plugin)": "PHEV-p",
            "Ibrido-diesel (Plugin)": "PHEV-d",
            "Benzin": "ICEV-p",
            "Komprimiertes Gas": "ICEV-g",
            "Elektrisch": "BEV",
            "Brennstoffzelle": "FCEV",
            "Hybrid-Benzin": "HEV-p",
            "Hybrid-Diesel": "HEV-d",
            "(Plugin) Hybrid-Benzin": "PHEV-p",
            "(Plugin) Hybrid-Diesel": "PHEV-d",
            "Essence": "ICEV-p",
            "Gaz comprimé": "ICEV-g",
            "Electrique": "BEV",
            "Pile à combustible": "FCEV",
            "Hybride-essence": "HEV-p",
            "Hybride-diesel": "HEV-d",
            "Hybride-essence rechargeable": "PHEV-p",
            "Hybride-diesel rechargeable": "PHEV-d"
        }
        self.d_size_en = {
            "Minicompact": "Mini",
            "Subcompact": "Small",
            "Compact": "Lower medium",
            "Mid-size": "Medium",
            "Large": "Large",
            "SUV": "SUV",
            "Van": "Van",
        }
        self.d_size_fr = {
            "Mini-citadine": "Mini",
            "Citadine": "Small",
            "Berline compacte": "Lower medium",
            "Berline familiale": "Medium",
            "Grande routière": "Large",
            "SUV": "SUV",
            "Van": "Van",
        }
        self.d_size_it = {
            "Mini citycar": "Mini",
            "Citycar": "Small",
            "Berlina compatta": "Lower medium",
            "Berlina medio-grande": "Medium",
            "Berlina tre volumi": "Large",
            "SUV": "SUV",
            "Van": "Van",
        }
        self.d_size_de = {
            "Kleinstwagen": "Mini",
            "Kleinwagen": "Small",
            "Kompaktklasse": "Lower medium",
            "Mittelklasse": "Medium",
            "Oberklasse": "Large",
            "Geländewagen": "SUV",
            "Van": "Van",
        }
        self.d_size_all={
            "Minicompact": "Mini",
            "Subcompact": "Small",
            "Compact": "Lower medium",
            "Mid-size": "Medium",
            "Large": "Large",
            "SUV": "SUV",
            "Van": "Van",
            "Mini-citadine": "Mini",
            "Citadine": "Small",
            "Berline compacte": "Lower medium",
            "Berline familiale": "Medium",
            "Grande routière": "Large",
            "Mini citycar": "Mini",
            "Citycar": "Small",
            "Berlina compatta": "Lower medium",
            "Berlina medio-grande": "Medium",
            "Berlina tre volumi": "Large",
            "Kleinstwagen": "Mini",
            "Kleinwagen": "Small",
            "Kompaktklasse": "Lower medium",
            "Mittelklasse": "Medium",
            "Oberklasse": "Large",
            "Geländewagen": "SUV"
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
        with open("data/parameters definition.txt", "r") as f:
            data = [line for line in csv.reader(f, delimiter="\t")]
        return data

    def interpolate_array(self, years):
        return self.arr.interp(year=years, kwargs={"fill_value": "extrapolate"})

    def get_dc(self, dc):
        return get_standard_driving_cycle(dc)

    def create_config_array(self, dict_params, array):

        arr = []
        powertrain = [pt for pt in dict_params[('Functional unit',)]['powertrain']]
        size = [s for s in dict_params[('Functional unit',)]['size']]
        year = [y for y in dict_params[('Functional unit',)]['year']]
        driving_cycle = dict_params[('Driving cycle',)]
        country = dict_params[('Background',)]['country']
        passengers = dict_params[('Foreground',)][('Glider', 'all', 'all', 'average passengers', 'none')][(year[0], 'loc')]
        cargo_mass = dict_params[('Foreground',)][('Glider', 'all', 'all', 'cargo mass', 'none')][(year[0], 'loc')]
        lifetime = dict_params[('Foreground',)][('Driving', 'all', 'all', 'lifetime kilometers', 'none')][(year[0], 'loc')]
        km_per_year = dict_params[('Foreground',)][('Driving', 'all', 'all', 'kilometers per year', 'none')][(year[0], 'loc')]

        for pt in powertrain:
            for s in size:
                for y in year:
                    electricity_mix = self.electricity_mix.loc[
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
                                        ].interp(year=y).values.tolist()
                    params = [pt, s, y, lifetime, km_per_year, passengers, cargo_mass, driving_cycle, country, electricity_mix]
                    other_params = array.sel(powertrain=pt, size=s, year=y, value=0, parameter=[
                        'TtW energy',
                        'driving mass',
                        'combustion power',
                        'electric power',
                        'range',
                        'engine efficiency',
                        'drivetrain efficiency',
                        'TtW efficiency',
                        'battery discharge efficiency',
                        'energy battery mass',
                        'battery cell energy density',
                        'electric energy stored',
                        'battery lifetime kilometers',
                    ]).values.tolist()
                    params.extend(other_params)

                    if pt in ('BEV'):
                        battery_chem = dict_params[('Background',)]["energy storage"]["electric"]["type"]
                        battery_origin = dict_params[('Background',)]["energy storage"]["electric"]["origin"]
                        primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share = ["", "", "", ""]
                    else:
                        battery_chem, battery_origin = ["", ""]

                    if pt in ('ICEV-p', 'PHEV-p', 'HEV-p'):
                        if "fuel blend" in dict_params[('Background',)]:
                            if "petrol" in dict_params[('Background',)]["fuel blend"]:
                                primary_fuel_type = dict_params[('Background',)]["fuel blend"]["petrol"]["primary fuel"]["type"]
                                primary_fuel_share = dict_params[('Background',)]["fuel blend"]["petrol"]["primary fuel"]["share"][year.index(y)]
                                secondary_fuel_type = dict_params[('Background',)]["fuel blend"]["petrol"]["secondary fuel"]["type"]
                                secondary_fuel_share = dict_params[('Background',)]["fuel blend"]["petrol"]["secondary fuel"]["share"][year.index(y)]
                            else:
                                region = self.region_map[country]["RegionCode"]
                                share_biofuel = self.biofuel.sel(
                                    region=region, value=0, fuel_type="Biomass fuel", scenario="SSP2-Base",
                                ).interp(year=y, kwargs={"fill_value": "extrapolate"}).values
                                share_biofuel = float(share_biofuel)
                                primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share = ["petrol", 1-share_biofuel, "bioethanol - wheat straw", share_biofuel]

                        else:
                            region = self.region_map[country]["RegionCode"]
                            share_biofuel = self.biofuel.sel(
                                    region=region, value=0, fuel_type="Biomass fuel", scenario="SSP2-Base",
                                ).interp(year=y, kwargs={"fill_value": "extrapolate"}).values
                            share_biofuel = float(share_biofuel)
                            primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share = ["petrol", 1-share_biofuel, "bioethanol - wheat straw", share_biofuel]


                    if pt in ('ICEV-d', 'PHEV-d', 'HEV-d'):
                        if "fuel blend" in dict_params[('Background',)]:
                            if "diesel" in dict_params[('Background',)]["fuel blend"]:
                                primary_fuel_type = dict_params[('Background',)]["fuel blend"]["diesel"]["primary fuel"]["type"]
                                primary_fuel_share = dict_params[('Background',)]["fuel blend"]["diesel"]["primary fuel"]["share"][year.index(y)]
                                secondary_fuel_type = dict_params[('Background',)]["fuel blend"]["diesel"]["secondary fuel"]["type"]
                                secondary_fuel_share = dict_params[('Background',)]["fuel blend"]["diesel"]["secondary fuel"]["share"][year.index(y)]
                            else:
                                region = self.region_map[country]["RegionCode"]
                                share_biofuel = self.biofuel.sel(
                                    region=region, value=0, fuel_type="Biomass fuel", scenario="SSP2-Base",
                                ).interp(year=y, kwargs={"fill_value": "extrapolate"}).values
                                share_biofuel = float(share_biofuel)
                                primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share = ["diesel", 1-share_biofuel, "biodiesel - algae", share_biofuel]
                        else:
                            region = self.region_map[country]["RegionCode"]
                            share_biofuel = self.biofuel.sel(
                                    region=region, value=0, fuel_type="Biomass fuel", scenario="SSP2-Base",
                                ).interp(year=y, kwargs={"fill_value": "extrapolate"}).values
                            share_biofuel = float(share_biofuel)
                            primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share = ["diesel", 1-share_biofuel, "biodiesel - algae", share_biofuel]

                    if pt in ('ICEV-g'):
                        if "fuel blend" in dict_params[('Background',)]:
                            if "cng" in dict_params[('Background',)]["fuel blend"]:
                                primary_fuel_type = dict_params[('Background',)]["fuel blend"]["cng"]["primary fuel"]["type"]
                                primary_fuel_share = dict_params[('Background',)]["fuel blend"]["cng"]["primary fuel"]["share"][year.index(y)]
                                secondary_fuel_type = dict_params[('Background',)]["fuel blend"]["cng"]["secondary fuel"]["type"]
                                secondary_fuel_share = dict_params[('Background',)]["fuel blend"]["cng"]["secondary fuel"]["share"][year.index(y)]
                            else:
                                region = self.region_map[country]["RegionCode"]
                                share_biofuel = self.biofuel.sel(
                                    region=region, value=0, fuel_type="Biomass fuel", scenario="SSP2-Base",
                                ).interp(year=y, kwargs={"fill_value": "extrapolate"}).values
                                share_biofuel = float(share_biofuel)
                                primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share = ["cng", 1-share_biofuel, "biogas - sewage sludge", share_biofuel]
                        else:
                            region = self.region_map[country]["RegionCode"]
                            share_biofuel = self.biofuel.sel(
                                    region=region, value=0, fuel_type="Biomass fuel", scenario="SSP2-Base",
                                ).interp(year=y, kwargs={"fill_value": "extrapolate"}).values
                            share_biofuel = float(share_biofuel)
                            primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share = ["cng", 1-share_biofuel, "biogas - sewage sludge", share_biofuel]

                    if pt in ('FCEV'):
                        if "fuel blend" in dict_params[('Background',)]:
                            if "hydrogen" in dict_params[('Background',)]["fuel blend"]:
                                primary_fuel_type = dict_params[('Background',)]["fuel blend"]["hydrogen"]["primary fuel"]["type"]
                                primary_fuel_share = dict_params[('Background',)]["fuel blend"]["hydrogen"]["primary fuel"]["share"][year.index(y)]
                                secondary_fuel_type = dict_params[('Background',)]["fuel blend"]["hydrogen"]["secondary fuel"]["type"]
                                secondary_fuel_share = dict_params[('Background',)]["fuel blend"]["hydrogen"]["secondary fuel"]["share"][year.index(y)]
                            else:
                                primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share = ["electrolysis", 1, "", ""]
                        else:
                            primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share = ["electrolysis", 1, "", ""]


                    params.extend([battery_chem, battery_origin, primary_fuel_type, primary_fuel_share, secondary_fuel_type, secondary_fuel_share])


                    arr.append(params)

        return arr

    def process_results(self, d, lang, job_id):
        """ Calculate LCIA and store results in an array of arrays """

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 50
        db.session.commit()

        scope = {
            "powertrain": d[("Functional unit",)]["powertrain"],
            "size": d[("Functional unit",)]["size"]
        }

        print(scope)

        self.dcts, self.arr = fill_xarray_from_input_parameters(self.cip, scope=scope)
        arr = self.interpolate_array(d[("Functional unit",)]["year"])
        modify_xarray_from_custom_parameters(d[("Foreground",)], arr)
        cm = CarModel(arr, cycle=d[("Driving cycle",)])

        if "electric utility factor" in d[("Background",)]:
            uf = list(d[("Background",)]["electric utility factor"].values())
            cm.set_all(electric_utility_factor=uf)
        else:
            cm.set_all()

        cumsum = cm.energy.sel(
            powertrain=d[("Functional unit",)]["powertrain"],
            size=d[("Functional unit",)]["size"],
            year=d[("Functional unit",)]["year"],
            value=0,
            parameter=["motive energy", "auxiliary energy", "recuperated energy"]) \
            .cumsum(dim="second").sum(dim="parameter")

        TtW_energy = []

        for pt in cumsum.coords["powertrain"].values.tolist():
            for s in cumsum.coords["size"].values.tolist():
                for y in cumsum.coords["year"].values.tolist():
                    ttw_dic = {"values": [], "key": pt + " - " + s + " - " + str(y)}
                    ttw_dic["values"] = [{"x": str(i), "y": str(j)}
                                         for i, j in enumerate(cumsum.sel(powertrain=pt, size=s, year=y).values)]
                    TtW_energy.append(ttw_dic)


        cost = cm.calculate_cost_impacts(scope=d[("Functional unit",)])
        data_cost = cost.values
        year = cost.coords["year"].values.tolist()

        # Functional unit
        fu_unit = d[("Functional unit", )]["fu"]["unit"]
        fu_qty = d[("Functional unit", )]["fu"]["quantity"]

        if fu_unit == "vkm":
            load_factor = 1
        else:
            load_factor = cm["average passengers"].mean().values

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 70
        db.session.commit()

        powertrain = cost.coords["powertrain"].values.tolist()
        size = cost.coords["size"].values.tolist()
        cost_category = cost.coords["cost_type"].values.tolist()

        arr_benchmark = []
        dict_scatter = defaultdict(list)

        list_res_costs = []

        for s in range(0, len(size)):
            for pt in range(0, len(powertrain)):
                for y in range(0, len(year)):
                    for cat in range(0, len(cost_category)):
                        if cost_category[cat] == "total":
                            arr_benchmark.append(
                                [
                                    "cost",
                                    size[s],
                                    powertrain[pt],
                                    year[y],
                                    1 / data_cost[s, pt, cat, y, 0],
                                ]
                            )
                            k = powertrain[pt] + ", " + str(year[y]) + ", " + size[s]
                            cost_val = data_cost[s, pt, cat, y, 0] / load_factor * float(fu_qty)
                            dict_scatter[k].append(cost_val)
                        else:

                            cost_val = data_cost[s, pt, cat, y, 0] / load_factor * float(fu_qty)
                            cost_sum = data_cost[s, pt, :, y, 0].sum() / load_factor * float(fu_qty)
                            list_res_costs.append(
                                [
                                    "ownership cost",
                                    size[s],
                                    powertrain[pt],
                                    year[y],
                                    cost_category[cat],
                                    cost_val,
                                    cost_sum
                                ]
                            )

        self.ic = InventoryCalculation(
            cm.array,
            scope=d[("Functional unit",)],
            background_configuration=d[("Background",)],
        )
        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 80
        db.session.commit()

        results = self.ic.calculate_impacts().astype("float64")

        lifetime = int(cm.array.sel(parameter="lifetime kilometers").mean().values)
        results_acc = results * lifetime

        self.export = ExportInventory(self.ic.A, self.ic.rev_inputs)

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 90
        db.session.commit()

        data = results.values
        data_acc = results_acc.values

        powertrain = results.coords["powertrain"].values.tolist()
        size = results.coords["size"].values.tolist()
        impact = results.coords["impact"].values.tolist()
        impact_category = results.coords["impact_category"].values.tolist()

        list_res = []

        list_res_acc = []
        for imp in range(0, len(impact_category)):
            for s in range(0, len(size)):
                for pt in range(0, len(powertrain)):
                    for y in range(0, len(year)):
                        if imp == 6:
                            arr_benchmark.append(
                                [
                                    "climate change",
                                    size[s],
                                    powertrain[pt],
                                    year[y],
                                    1 / data[imp, s, pt, y, :, 0].sum(),
                                ]
                            )
                            k = powertrain[pt] + ", " + str(year[y]) + ", " + size[s]
                            dict_scatter[k].append(data[imp, s, pt, y, :, 0].sum())
                        if imp == 7:
                            arr_benchmark.append(
                                [
                                    "fossil depletion",
                                    size[s],
                                    powertrain[pt],
                                    year[y],
                                    1 / (data[imp, s, pt, y, :, 0].sum() * 0.755),
                                ]
                            )  # 0.755 kg/L gasoline
                        for cat in range(0, len(impact)):
                            list_res.append(
                                [
                                    impact_category[imp],
                                    size[s],
                                    powertrain[pt],
                                    year[y],
                                    impact[cat],
                                    data[imp, s, pt, y, cat, 0],
                                    data[imp, s, pt, y, :, 0].sum()
                                ]
                            )

                        # For accumulated impacts, we get the intercept (powertrain + glider + energy storage + EoL)
                        intercept = data_acc[imp, s, pt, y, 4:-1, 0].sum()

                        # For accumulated impacts, we get the slope (energy chain + road + maintenance)
                        slope = data[imp, s, pt, y, :4, 0].sum()
                        slope += data[imp, s, pt, y, -1, 0].sum()

                        list_res_acc.append(
                            [
                                impact_category[imp],
                                size[s],
                                powertrain[pt],
                                year[y],
                                impact[cat],
                                intercept,
                                slope,
                                lifetime,
                            ]
                        )

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 95
        db.session.commit()




        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 90
        db.session.commit()

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 100
        db.session.commit()

        list_res.extend(list_res_costs)

        return (
            json.dumps(
                [
                    lang,
                    list_res,
                    arr_benchmark,
                    TtW_energy,
                    dict_scatter,
                    list_res_acc,
                    self.create_config_array(d, cm.array),
                    d[("Background",)]["country"],
                    d[("Functional unit",)]["fu"]["quantity"],
                    d[("Functional unit",)]["fu"]["unit"]
                ]
            ),
            self.export,
        )

    def format_dictionary(self, raw_dict, lang, job_id):
        """ Format the dictionary sent by the user so that it can be understood by `carculator` """

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 10
        db.session.commit()

        d_sliders = {
            "mileage-slider": "kilometers per year",
            "lifetime-slider": "lifetime kilometers",
            "passenger-slider": "average passengers",
            "cargo-slider": "cargo mass",
        }
        new_dict = {}

        new_dict[("Functional unit",)] = {
                "powertrain": [x for x in raw_dict["type"]],
                "year": [int(x) for x in raw_dict["year"]],
                "size": [s for s in raw_dict["size"]],
                "fu": raw_dict["fu"]
            }

        f_d = {}
        new_dict[("Driving cycle",)] = raw_dict["driving_cycle"]
        new_dict[("Background",)] = {
            k: v for k, v in raw_dict["background params"].items() if k not in ("energy storage", "efficiency")
        }

        # Ensure that the electricity mix is present
        if "custom electricity mix" not in new_dict[("Background",)]:
            years = new_dict[("Functional unit",)]["year"]
            country = new_dict[("Background",)]["country"]
            try:
                response = (
                    self.electricity_mix.loc[dict(country=country,
                variable=["Hydro","Nuclear","Gas","Solar","Wind","Biomass","Coal","Oil","Geothermal","Waste"])]
                    .interp(year=years)
                    .values
                )
            except KeyError:
                response = (
                    self.electricity_mix.loc[dict(country='RER',
                variable=["Hydro","Nuclear","Gas","Solar","Wind","Biomass","Coal","Oil","Geothermal","Waste"])]
                    .interp(year=years)
                    .values
                )

            new_dict[("Background",)]["custom electricity mix"] = response

        # Ensure that the electricity mix split equals 1
        for el in new_dict[("Background",)]["custom electricity mix"]:
            el /= np.sum(np.array(el))

        if "energy storage" in raw_dict["background params"]:
            if "electric" in raw_dict["background params"]["energy storage"]:
                if len(raw_dict["background params"]["energy storage"]["electric"])>0:
                    energy_storage = raw_dict["background params"]["energy storage"]["electric"]
                    new_dict[("Background",)]["energy storage"] = {'electric':{}}

                    for e in energy_storage:
                        for p in energy_storage[e]:
                            if p in ('type', 'origin'):
                                new_dict[("Background",)]["energy storage"]["electric"][p] = energy_storage[e][p]

        for k, v in raw_dict["foreground params"].items():
            if k in d_sliders:
                name = d_sliders[k]
                cat = self.d_categories[name]
                powertrain = "all"
                size = "all"
                val = [float(v.replace(" ", ""))] * len(new_dict[("Functional unit",)]["year"])
            else:
                k = tuple(k.split(","))
                name = k[0]
                cat = self.d_categories[name]
                powertrain = k[1]
                size = k[2]
                val = [float(n) for n in v] * len(new_dict[("Functional unit",)]["year"])

            d_val = {
                (k, "loc"): v
                for k, v in list(zip(new_dict[("Functional unit",)]["year"], val))
            }

            f_d[(cat, powertrain, size, name, "none")] = d_val

        if "energy storage" in raw_dict["background params"]:
            if "electric" in raw_dict["background params"]["energy storage"]:
                energy_storage = raw_dict["background params"]["energy storage"]["electric"]

                for e in energy_storage:
                    size = e
                    for p in energy_storage[e]:
                        if p not in ('type', 'origin'):
                            name = p
                            cat = self.d_categories[name]
                            powertrain = "BEV"
                            val = energy_storage[e][p]

                            d_val = {
                                (k, "loc"): v
                                for k, v in list(zip(new_dict[("Functional unit",)]["year"], val))
                            }

                            f_d[(cat, powertrain, size, name, "none")] = d_val

        if "efficiency" in raw_dict["background params"]:
            efficiency = raw_dict["background params"]["efficiency"]

            for eff in efficiency:
                powertrain = eff
                for s in efficiency[eff]:
                    size = s
                    for c in efficiency[eff][s]:
                        name = c
                        cat = self.d_categories[name]

                        if np.sum(efficiency[eff][s][c]) != 0:
                            val = efficiency[eff][s][c]
                            d_val = {
                                (k, "loc"): v
                                for k, v in list(zip(new_dict[("Functional unit",)]["year"], val))
                            }
                            f_d[(cat, powertrain, size, name, "none")] = d_val

        new_dict[("Foreground",)] = f_d

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 20
        db.session.commit()

        return new_dict


