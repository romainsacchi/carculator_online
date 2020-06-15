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

        self.d_impact_en = {
            "Occupation of arable land": "agricultural land occupation",
            "Climate change": "climate change",
            "Depletion of fossil energy resources": "fossil depletion",
            "Toxicity of non-marine aquatic environments": "freshwater ecotoxicity",
            "Eutrophication of non-marine aquatic environments": "freshwater eutrophication",
            "Human toxicity": "human toxicity",
            "Ionizing radiation": "ionising radiation",
            "Toxicity of marine aquatic environments": "marine ecotoxicity",
            "Eutrophication of non-marine aquatic environments": "marine eutrophication",
            "Depletion of metal resources": "metal depletion",
            "Natural land transformation": "natural land transformation",
            "Deterioration of the ozone layer": "ozone depletion",
            "Formation of fine particles": "particulate matter formation",
            "Smog formation": "photochemical oxidant formation",
            "Terrestrial acidification": "terrestrial acidification",
            "Terrestrial toxicity": "terrestrial ecotoxicity",
            "Land occupation in an urban environment": "urban land occupation",
            "Depletion of fresh water reserves": "water depletion",
            "Noise emissions": "human noise",
            "Primary energy, renewable": "primary energy, renewable",
            "Primary energy, non-renewable": "primary energy, non-renewable"
        }

        self.d_impact_it = {
            "Occupazione di terreni agricoli [m2 / anno]": "agricultural land occupation",
            "Cambiamenti climatici [kg CO2-eq.]": "climate change",
            "Esaurimento delle risorse energetiche fossili [kg di petrolio eq.]": "fossil depletion",
            "Tossicità per gli ambienti acquatici non marini [kg 1,4-DC-eq.]": "freshwater ecotoxicity",
            "Eutrofizzazione di ambienti acquatici non marini [kg P-eq.]": "freshwater eutrophication",
            "Tossicità per l'uomo [kg 1,4-DC-eq.]": "human toxicity",
            "Radiazione ionizzante [kg U235-eq.]": "ionising radiation",
            "Tossicità per gli ambienti acquatici marini [kg 1,4-DC-eq.]": "marine ecotoxicity",
            "Eutrofizzazione di ambienti acquatici non marini [kg N-eq.]": "marine eutrophication",
            "Esaurimento delle risorse metalliche [kg ferro-eq.]": "metal depletion",
            "Trasformazione del terreno naturale [m2]": "natural land transformation",
            "Deterioramento dello strato di ozono [kg CFC-11-eq.]": "ozone depletion",
            "Formazione di particolato [kg PM10-eq.]": "particulate matter formation",
            "Formazione di smog [kg NMVOC-eq.]": "photochemical oxidant formation",
            "Acidificazione terrestre [kg SO2-Eq-eq.]": "terrestrial acidification",
            "Tossicità terrestre [kg 1,4-DC.-eq.]": "terrestrial ecotoxicity",
            "Occupazione di terreno urbano [m2/anno]": "urban land occupation",
            "Esaurimento delle riserve di acqua dolce [m3]": "water depletion",
            "Inquinamento acustico [Person-Pascal / secondo]": "human noise",
            "Energia primaria, rinnovabile [Megajoule]": "primary energy, renewable",
            "Energia primaria, non rinnovabile [Megajoule]": "primary energy, non-renewable"
        }

        self.d_impact_fr = {
            "Occupation de terre arable [m2/an]": "agricultural land occupation",
            "Changement climatique [kg CO2-eq.]": "climate change",
            "Epuisement des ressources d'énergie fossile [kg pétrole-eq.]": "fossil depletion",
            "Toxicité des milieux aquatiques non-marins [kg 1,4-DC-eq.]": "freshwater ecotoxicity",
            "Eutrophisation des milieux aquatiques non-marins [kg P-eq.]": "freshwater eutrophication",
            "Toxicité humaine [kg 1,4-DC-eq.]": "human toxicity",
            "Rayonnement ionisant [kg U235-Eq]": "ionising radiation",
            "Toxicité des milieux aquatiques marins [kg 1,4-DC-eq.]": "marine ecotoxicity",
            "Eutrophisation des milieux aquatiques marins [kg N-eq.]": "marine eutrophication",
            "Epuisement des ressources en métaux [kg fer-eq.]": "metal depletion",
            "Transformation de terre naturelle [m2]": "natural land transformation",
            "Détérioration de la couche d'ozone [kg CFC-11-eq.]": "ozone depletion",
            "Formation de particules fines [kg PM10-eq.]": "particulate matter formation",
            "Formation de brouillard de pollution [kg NMVOC-eq.]": "photochemical oxidant formation",
            "Acidification terrestre [kg SO2-eq.]": "terrestrial acidification",
            "Toxicité des milieux terrestres [kg 1,4-DC.-eq.]": "terrestrial ecotoxicity",
            "Occupation de terre en milieu urbain [m2/an]": "urban land occupation",
            "Epuisement des réserves d'eau douce [m3]": "water depletion",
            "Emissions de bruit [Person-Pascal/seconde]": "human noise",
            "Energie primaire, renouvelable [Mégajoule]": "primary energy, renewable",
            "Energi primaire, non renouvelable [Mégajoule]": "primary energy, non-renewable"
        }

        self.d_impact_de = {
            "Ackerlandnutzung [m2 / Jahr]": "agricultural land occupation",
            "Klimawandel [kg CO2-Äq.]": "climate change",
            "Erschöpfung fossiler Energieressourcen [kg Öläquivalent]": "fossil depletion",
            "Toxizität in Gewässern ausserhalb des Meeres [kg 1,4-DC-Äq.]": "freshwater ecotoxicity",
            "Eutrophierung von Gewässern ausserhalb des Meeres [kg P-Äq.]": "freshwater eutrophication",
            "Humantoxizität [kg 1,4-DC-Äq.]": "human toxicity",
            "Ionisierende Strahlung [kg U235-Eq]": "ionising radiation",
            "Toxizität in Gewässern des Meeres [kg 1,4-DC-Äq.]": "marine ecotoxicity",
            "Eutrophierung von Gewässern im Meer [kg N-Äq.]": "marine eutrophication",
            "Erschöpfung der Metallressourcen [kg Eisenäquivalent]": "metal depletion",
            "Natürliche Landumwandlung [m2]": "natural land transformation",
            "Zerstörung der Ozonschicht [kg FCKW-11-Äq.]": "ozone depletion",
            "Bildung von Feinstaub [kg PM10-Äq.]": "particulate matter formation",
            "Smogbildung [kg NMVOC-Äq.]": "photochemical oxidant formation",
            "Terrestrische Versauerung [kg SO2-Äq.]": "terrestrial acidification",
            "Terrestrische Toxizität [kg 1,4-DC.-Äq.]": "terrestrial ecotoxicity",
            "Flächennutzung in städtischen Gebieten [m2/Jahr]": "urban land occupation",
            "Erschöpfung der Süsswasservorräte [m3]": "water depletion",
            "Geräuschemission [Person-Pascal / Sekunde]": "human noise",
            "Primärenergie, erneuerbar [Megajoule]": "primary energy, renewable",
            "Primärenergie, nicht erneuerbar [Megajoule]": "primary energy, non-renewable"
        }

        self.d_cat_en = {
            "Direct emissions": "direct",
            "Fuel supply": "energy chain",
            "Energy storage": "energy storage",
            "Chassis": "glider",
            "Maintenance": "maintenance",
            "End of Life": "EoL",
            "Powertrain": "powertrain",
            "Road": "road",
        }

        self.d_cat_de = {
            "Direkte Emissionen": "direct",
            "Kraftstoffherstellung": "energy chain",
            "Energiespeicher": "energy storage",
            "Fahrwerk": "glider",
            "Wartungsarbeiten": "maintenance",
            "Entsorgung": "EoL",
            "Antriebsstrang": "powertrain",
            "Straße": "road",
        }

        self.d_cat_fr = {
            "Emissions directes": "direct",
            "Fabrication du carburant": "energy chain",
            "Stockage du carburant": "energy storage",
            "Chassis": "glider",
            "Maintenance": "maintenance",
            "Fin de vie": "EoL",
            "Motorisation": "powertrain",
            "Route": "road",
        }
        self.d_cat_it = {
            "Emissioni dirette": "direct",
            "Produzione di carburante": "energy chain",
            "Accumulo di energia": "energy storage",
            "Telaio": "glider",
            "Manutenzione": "maintenance",
            "Fine della vita": "EoL",
            "Motore": "powertrain",
            "Strada": "road",
        }
        self.d_cost_fr = {
            "Achat": "purchase",
            "Remplacement de composants": "component replacement",
            "Carburant": "energy",
            "Maintenance": "maintenance",
            "total": "total",
        }

        self.d_cost_de = {
            "Kauf": "purchase",
            "Komponententausch": "component replacement",
            "Treibstoff": "energy",
            "Wartung": "maintenance",
            "total": "total",
        }
        self.d_cost_it = {
            "Acquisto": "purchase",
            "Sostituzione dei componenti": "component replacement",
            "Carburante": "energy",
            "Manutenzione": "maintenance",
            "total": "total",
        }
        self.d_rev_pt_en = {v: k for k, v, in self.d_pt_en.items()}
        self.d_rev_pt_fr = {v: k for k, v, in self.d_pt_fr.items()}
        self.d_rev_pt_it = {v: k for k, v, in self.d_pt_it.items()}
        self.d_rev_pt_de = {v: k for k, v, in self.d_pt_de.items()}

        self.d_rev_size_en = {v: k for k, v, in self.d_size_en.items()}
        self.d_rev_size_fr = {v: k for k, v, in self.d_size_fr.items()}
        self.d_rev_size_it = {v: k for k, v, in self.d_size_it.items()}
        self.d_rev_size_de = {v: k for k, v, in self.d_size_de.items()}

        self.d_rev_cost_fr = {v: k for k, v, in self.d_cost_fr.items()}
        self.d_rev_cost_it = {v: k for k, v, in self.d_cost_it.items()}
        self.d_rev_cost_de = {v: k for k, v, in self.d_cost_de.items()}

        self.d_rev_impact_en = {v: k for k, v, in self.d_impact_en.items()}
        self.d_rev_impact_fr = {v: k for k, v, in self.d_impact_fr.items()}
        self.d_rev_impact_it = {v: k for k, v, in self.d_impact_it.items()}
        self.d_rev_impact_de = {v: k for k, v, in self.d_impact_de.items()}

        self.d_rev_cat_en = {v: k for k, v, in self.d_cat_en.items()}
        self.d_rev_cat_fr = {v: k for k, v, in self.d_cat_fr.items()}
        self.d_rev_cat_it = {v: k for k, v, in self.d_cat_it.items()}
        self.d_rev_cat_de = {v: k for k, v, in self.d_cat_de.items()}
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

    def process_results(self, d, lang, job_id):
        """ Calculate LCIA and store results in an array of arrays """

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 50
        db.session.commit()

        arr = self.interpolate_array(d[("Functional unit",)]["year"])
        modify_xarray_from_custom_parameters(d[("Foreground",)], arr)
        cm = CarModel(arr, cycle=d[("Driving cycle",)])
        cm.set_all()
        cost = cm.calculate_cost_impacts(scope=d[("Functional unit",)])
        data_cost = cost.values
        year = cost.coords["year"].values.tolist()

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
                            dict_scatter[k].append(data_cost[s, pt, cat, y, 0])
                        else:
                            list_res_costs.append(
                                [
                                    "ownership cost",
                                    size[s],
                                    powertrain[pt],
                                    year[y],
                                    cost_category[cat],
                                    data_cost[s, pt, cat, y, 0],
                                    data_cost[s, pt, :, y, 0].sum()
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

        results = self.ic.calculate_impacts()


        lifetime = int(cm.array.sel(parameter="lifetime kilometers").mean().values)
        results_acc = results * lifetime

        self.export = ExportInventory(self.ic.A, self.ic.rev_inputs)

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 90
        db.session.commit()

        data = np.float64(results.values)
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
                        if imp == 2:
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
                        if imp == 3:
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
                        intercept = data_acc[imp, s, pt, y, 3:-1, 0].sum()

                        # For accumulated impacts, we get the slope (energy chain + road + maintenance)
                        slope = data[imp, s, pt, y, :2, 0].sum()
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

        arr = cm.array.sel(
            powertrain=d[("Functional unit",)]["powertrain"],
            size=d[("Functional unit",)]["size"],
            year=d[("Functional unit",)]["year"],
        )

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 95
        db.session.commit()


        TtW_energy = cm.ecm.motive_energy_per_km(
            driving_mass=arr.sel(parameter="driving mass"),
            rr_coef=arr.sel(parameter="rolling resistance coefficient"),
            drag_coef=arr.sel(parameter="aerodynamic drag coefficient"),
            frontal_area=arr.sel(parameter="frontal area"),
            ttw_efficiency=arr.sel(parameter="TtW efficiency"),
            recuperation_efficiency=arr.sel(parameter="recuperation efficiency"),
            motor_power=arr.sel(parameter="electric power"),
        ).reshape(len(powertrain) * len(size) * len(year), -1)

        TtW_energy = TtW_energy.cumsum(axis=1).tolist()

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 90
        db.session.commit()

        list_names = [
            [s, p, y]
            for s in size
            for p in powertrain
            for y in year
        ]

        TtW_list = list(zip(list_names, TtW_energy))

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
                    TtW_list,
                    dict_scatter,
                    list_res_acc,
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
            }

        f_d = {}
        new_dict[("Driving cycle",)] = raw_dict["driving_cycle"]
        new_dict[("Background",)] = {
            k: v for k, v in raw_dict["background params"].items() if k not in ("energy storage", "efficiency")
        }

        # Ensure that the electricity mix is present
        if "custom electricity mix" not in new_dict[("Background",)]:
            years= new_dict[("Functional unit",)]["year"]
            country= new_dict[("Background",)]["country"]
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
