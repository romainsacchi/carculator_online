from app import db
from carculator import *
import json
import io
import xlsxwriter
import csv
from collections import defaultdict
from app.models import Task


class Calculation:
    def __init__(self):

        self.electricity_mix = BackgroundSystemModel().electricity_mix
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
            "Natural gas": "ICEV-g",
            "Electric": "BEV",
            "H2 Fuel cell": "FCEV",
            "Hybrid-petrol": "HEV-p",
            "(Plugin) Hybrid-petrol": "PHEV",
        }
        self.d_pt_it = {
            "Benzina": "ICEV-p",
            "Diesel": "ICEV-d",
            "Gas naturale": "ICEV-g",
            "Elettrica": "BEV",
            "Cella a combustibile H2": "FCEV",
            "Ibrido benzina": "HEV-p",
            "Ibrido-benzina (Plugin)": "PHEV",
        }
        self.d_pt_de = {
            "Benzin": "ICEV-p",
            "Diesel": "ICEV-d",
            "Erdgas": "ICEV-g",
            "Elektrisch": "BEV",
            "H2 Brennstoffzelle": "FCEV",
            "Hybrid-Benzin": "HEV-p",
            "(Plugin) Hybrid-Benzin": "PHEV",
        }
        self.d_pt_fr = {
            "Essence": "ICEV-p",
            "Diesel": "ICEV-d",
            "GPL": "ICEV-g",
            "Electrique": "BEV",
            "H2 Pile à combustible": "FCEV",
            "Hybride-essence": "HEV-p",
            "Hybride-essence rechargeable": "PHEV",
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

        self.d_impact_en = {
            "Occupation of arable land [m2/year]": "agricultural land occupation",
            "Climate change [kg CO2-eq.]": "climate change",
            "Depletion of fossil energy resources [kg oil-eq.]": "fossil depletion",
            "Toxicity of non-marine aquatic environments [kg 1,4-DC-eq.]": "freshwater ecotoxicity",
            "Eutrophication of non-marine aquatic environments [kg P-eq.]": "freshwater eutrophication",
            "Human toxicity [kg 1,4-DC-eq.]": "human toxicity",
            "Ionizing radiation [kg U235-Eq]": "ionising radiation",
            "Toxicity of marine aquatic environments [kg 1,4-DC-eq.]": "marine ecotoxicity",
            "Eutrophication of non-marine aquatic environments [kg N-eq.]": "marine eutrophication",
            "Depletion of metal resources [kg iron-eq.]": "metal depletion",
            "Natural land transformation [m2]": "natural land transformation",
            "Deterioration of the ozone layer [kg CFC-11-eq.]": "ozone depletion",
            "Formation of fine particles [kg PM10-eq.]": "particulate matter formation",
            "Smog formation [kg NMVOC-eq.]": "photochemical oxidant formation",
            "Terrestrial acidification [kg SO2-Eq-eq.]": "terrestrial acidification",
            "Terrestrial toxicity [kg 1,4-DC.-eq.]": "terrestrial ecotoxicity",
            "Land occupation in an urban environment [m2 / year]": "urban land occupation",
            "Depletion of fresh water reserves [m3]": "water depletion",
            "Noise emissions [Person-Pascal/second]": "human noise",
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
            "Verschlechterung der Ozonschicht [kg FCKW-11-Äq.]": "ozone depletion",
            "Bildung feiner Partikel [kg PM10-Äq.]": "particulate matter formation",
            "Smogbildung [kg NMVOC-Äq.]": "photochemical oxidant formation",
            "Terrestrische Versauerung [kg SO2-Äq.]": "terrestrial acidification",
            "Terrestrische Toxizität [kg 1,4-DC.-Äq.]": "terrestrial ecotoxicity",
            "Flächennutzung in städtischen Gebieten [m2/Jahr]": "urban land occupation",
            "Erschöpfung der Süsswasservorräte [m3]": "water depletion",
            "Geräuschemission [Person-Pascal / Sekunde]": "human noise",
        }

        self.d_cat_en = {
            "Direct emissions": "direct",
            "Fuel manufacture": "energy chain",
            "Energy storage": "energy storage",
            "Chassis": "glider",
            "Maintenance": "maintenance",
            "Other": "other",
            "Powertrain": "powertrain",
            "Road": "road",
        }

        self.d_cat_de = {
            "Direkte Emissionen": "direct",
            "Kraftstoffherstellung": "energy chain",
            "Energiespeicher": "energy storage",
            "Fahrwerk": "glider",
            "Wartungsarbeiten": "maintenance",
            "Andere": "other",
            "Antriebsstrang": "powertrain",
            "Straße": "road",
        }

        self.d_cat_fr = {
            "Emissions directes": "direct",
            "Fabrication du carburant": "energy chain",
            "Stockage du carburant": "energy storage",
            "Chassis": "glider",
            "Maintenance": "maintenance",
            "Autre": "other",
            "Motorisation": "powertrain",
            "Route": "road",
        }
        self.d_cat_it = {
            "Emissioni dirette": "direct",
            "Produzione di carburante": "energy chain",
            "Accumulo di energia": "energy storage",
            "Telaio": "glider",
            "Manutenzione": "maintenance",
            "Altro": "other",
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
            "Totale": "total",
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
        self.excel_lci = ""


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

    def load_params_file(self, lang):
        with open("data/parameters definition.txt", "r") as f:
            data = [line for line in csv.reader(f, delimiter="\t")]

            if lang == "en":
                for d in data:
                    d[5] = [self.d_rev_pt_en[pt] for pt in d[5]]
                    d[6] = [self.d_rev_size_en[s] for s in d[6]]

            if lang == "fr":
                for d in data:
                    d[5] = [self.d_rev_pt_fr[pt] for pt in d[5]]
                    d[6] = [self.d_rev_size_fr[s] for s in d[6]]

            if lang == "de":
                for d in data:
                    d[5] = [self.d_rev_pt_de[pt] for pt in d[5]]
                    d[6] = [self.d_rev_size_de[s] for s in d[6]]

            if lang == "it":
                for d in data:
                    d[5] = [self.d_rev_pt_it[pt] for pt in d[5]]
                    d[6] = [self.d_rev_size_it[s] for s in d[6]]

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

        if lang == "en":
            powertrain = [
                self.d_rev_pt_en[pt] for pt in cost.coords["powertrain"].values.tolist()
            ]
            size = [self.d_rev_size_en[s] for s in cost.coords["size"].values.tolist()]
            cost_category = cost.coords["cost_type"].values.tolist()

        if lang == "fr":
            powertrain = [
                self.d_rev_pt_fr[pt] for pt in cost.coords["powertrain"].values.tolist()
            ]
            size = [self.d_rev_size_fr[s] for s in cost.coords["size"].values.tolist()]
            cost_category = [
                self.d_rev_cost_fr[c] for c in cost.coords["cost_type"].values.tolist()
            ]

        if lang == "it":
            powertrain = [
                self.d_rev_pt_it[pt] for pt in cost.coords["powertrain"].values.tolist()
            ]
            size = [self.d_rev_size_it[s] for s in cost.coords["size"].values.tolist()]
            cost_category = [
                self.d_rev_cost_it[c] for c in cost.coords["cost_type"].values.tolist()
            ]

        if lang == "de":
            powertrain = [
                self.d_rev_pt_de[pt] for pt in cost.coords["powertrain"].values.tolist()
            ]
            size = [self.d_rev_size_de[s] for s in cost.coords["size"].values.tolist()]
            cost_category = [
                self.d_rev_cost_de[c] for c in cost.coords["cost_type"].values.tolist()
            ]

        arr_benchmark = []
        dict_scatter = defaultdict(list)

        list_res_costs = [["value", "size", "powertrain", "year", "cost category"]]

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
                                    1 / data_cost[0, s, pt, y, cat],
                                ]
                            )
                            k = powertrain[pt] + ", " + str(year[y]) + ", " + size[s]
                            dict_scatter[k].append(data_cost[0, s, pt, y, cat])

                        list_res_costs.append(
                            [
                                data_cost[0, s, pt, y, cat],
                                size[s],
                                powertrain[pt],
                                year[y],
                                cost_category[cat],
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

        lci = self.ic.export_lci(presamples=False)
        self.excel_lci = self.write_lci_to_excel(lci, "test").read()
        print(self.excel_lci)

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 90
        db.session.commit()

        data = results.values
        data_acc = results_acc.values

        if lang == "fr":
            impact = [
                self.d_rev_cat_fr[f] for f in results.coords["impact"].values.tolist()
            ]
            impact_category = [
                self.d_rev_impact_fr[i]
                for i in results.coords["impact_category"].values.tolist()
            ]

        if lang == "de":
            impact = [
                self.d_rev_cat_de[f] for f in results.coords["impact"].values.tolist()
            ]
            impact_category = [
                self.d_rev_impact_de[i]
                for i in results.coords["impact_category"].values.tolist()
            ]

        if lang == "it":
            impact = [
                self.d_rev_cat_it[f] for f in results.coords["impact"].values.tolist()
            ]
            impact_category = [
                self.d_rev_impact_it[i]
                for i in results.coords["impact_category"].values.tolist()
            ]

        if lang == "en":
            impact = [
                self.d_rev_cat_en[f] for f in results.coords["impact"].values.tolist()
            ]
            impact_category = [
                self.d_rev_impact_en[i]
                for i in results.coords["impact_category"].values.tolist()
            ]

        list_res = [
            ["impact category", "size", "powertrain", "year", "category", "value"]
        ]
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
                                ]
                            )
                        intercept = data_acc[imp, s, pt, y, 2:, 0].sum()
                        slope = data[imp, s, pt, y, :2, 0].sum()
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

        if lang == "en":
            list_names = [
                [s, self.d_rev_pt_en[p], y]
                for s in arr.coords["size"].values.tolist()
                for p in arr.coords["powertrain"].values.tolist()
                for y in arr.coords["year"].values.tolist()
            ]
        if lang == "it":
            list_names = [
                [self.d_rev_size_it[s], self.d_rev_pt_it[p], y]
                for s in arr.coords["size"].values.tolist()
                for p in arr.coords["powertrain"].values.tolist()
                for y in arr.coords["year"].values.tolist()
            ]
        if lang == "de":
            list_names = [
                [self.d_rev_size_de[s], self.d_rev_pt_de[p], y]
                for s in arr.coords["size"].values.tolist()
                for p in arr.coords["powertrain"].values.tolist()
                for y in arr.coords["year"].values.tolist()
            ]
        if lang == "fr":
            list_names = [
                [self.d_rev_size_fr[s], self.d_rev_pt_fr[p], y]
                for s in arr.coords["size"].values.tolist()
                for p in arr.coords["powertrain"].values.tolist()
                for y in arr.coords["year"].values.tolist()
            ]

        TtW_list = list(zip(list_names, TtW_energy))

        # Update task progress to db
        task = Task.query.filter_by(id=job_id).first()
        task.progress = 100
        db.session.commit()

        return (
            json.dumps(
                [
                    lang,
                    list_res,
                    list_res_costs,
                    arr_benchmark,
                    TtW_list,
                    dict_scatter,
                    list_res_acc,
                ]
            ),
            self.excel_lci,
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

        if lang == "en":
            new_dict[("Functional unit",)] = {
                "powertrain": [self.d_pt_en[x] for x in raw_dict["type"]],
                "year": [int(x) for x in raw_dict["year"]],
                "size": [self.d_size_en[s] for s in raw_dict["size"]],
            }
        if lang == "fr":
            new_dict[("Functional unit",)] = {
                "powertrain": [self.d_pt_fr[x] for x in raw_dict["type"]],
                "year": [int(x) for x in raw_dict["year"]],
                "size": [self.d_size_fr[s] for s in raw_dict["size"]],
            }

        if lang == "it":
            new_dict[("Functional unit",)] = {
                "powertrain": [self.d_pt_it[x] for x in raw_dict["type"]],
                "year": [int(x) for x in raw_dict["year"]],
                "size": [self.d_size_it[s] for s in raw_dict["size"]],
            }

        if lang == "de":
            new_dict[("Functional unit",)] = {
                "powertrain": [self.d_pt_de[x] for x in raw_dict["type"]],
                "year": [int(x) for x in raw_dict["year"]],
                "size": [self.d_size_de[s] for s in raw_dict["size"]],
            }

        f_d = {}
        new_dict[("Driving cycle",)] = raw_dict["driving_cycle"]
        new_dict[("Background",)] = {
            k: v for k, v in raw_dict["background params"].items()
        }

        for k, v in raw_dict["foreground params"].items():
            if k in d_sliders:
                name = d_sliders[k]
                cat = self.d_categories[name]
                powertrain = "all"
                size = "all"
                val = [float(v.replace(" ", ""))]
            else:
                k = tuple(k.split(","))
                name = k[0]
                cat = self.d_categories[name]
                if lang == "en":
                    powertrain = self.d_pt_en[k[1]]
                    size = self.d_size_en[k[2]]
                if lang == "de":
                    powertrain = self.d_pt_de[k[1]]
                    size = self.d_size_de[k[2]]
                if lang == "fr":
                    powertrain = self.d_pt_fr[k[1]]
                    size = self.d_size_fr[k[2]]
                if lang == "it":
                    powertrain = self.d_pt_it[k[1]]
                    size = self.d_size_it[k[2]]
                val = [float(n) for n in v]

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

    def write_lci_to_excel(self, lci, name):
        """
        Export an Excel file that can be consumed by Brightway2.

        :returns: returns the file path of the exported inventory.
        :rtype: str.
        """

        list_act = lci
        data = []

        data.extend((["Database", name], ("format", "Excel spreadsheet")))
        data.append([])

        for k in list_act:
            if k.get("exchanges"):
                data.extend(
                    (
                        ["Activity", k["name"]],
                        ("location", k["location"]),
                        ("production amount", float(k["production amount"])),
                        ("reference product", k.get("reference product")),
                        ("type", "process"),
                        ("unit", k["unit"]),
                        ("worksheet name", "None"),
                        ["Exchanges"],
                        [
                            "name",
                            "amount",
                            "database",
                            "location",
                            "unit",
                            "categories",
                            "type",
                            "reference product",
                        ],
                    )
                )

                for e in k["exchanges"]:
                    data.append(
                        [
                            e["name"],
                            float(e["amount"]),
                            e["database"],
                            e.get("location", "None"),
                            e["unit"],
                            "::".join(e.get("categories", ())),
                            e["type"],
                            e.get("reference product"),
                        ]
                    )
            else:
                data.extend(
                    (
                        ["Activity", k["name"]],
                        ("type", "biosphere"),
                        ("unit", k["unit"]),
                        ("worksheet name", "None"),
                    )
                )
            data.append([])

        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        bold = workbook.add_format({"bold": True})
        bold.set_font_size(12)
        highlighted = {
            "Activity",
            "Database",
            "Exchanges",
            "Parameters",
            "Database parameters",
            "Project parameters",
        }
        frmt = lambda x: bold if row[0] in highlighted else None

        sheet = workbook.add_worksheet(name)

        for row_index, row in enumerate(data):
            for col_index, value in enumerate(row):
                if value is None:
                    continue
                elif isinstance(value, float):
                    sheet.write_number(row_index, col_index, value, frmt(value))
                else:
                    sheet.write_string(row_index, col_index, value, frmt(value))

        workbook.close()
        output.seek(0)

        return output
