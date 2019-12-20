from carculator import *
import json
import io
import xlsxwriter
import csv

class Calculation():

    def __init__(self):
        self.car_to_class_map = self.load_map_file()
        self.params = self.load_params_file()
        self.electricity_mix = BackgroundSystemModel().electricity_mix
        self.cip = CarInputParameters()
        self.cip.static()
        self.d_categories = {self.cip.metadata[a]['name']: self.cip.metadata[a]['category'] for a in self.cip.metadata}
        self.dcts, self.arr = fill_xarray_from_input_parameters(self.cip)
        self.d_pt = {
                    'Petrol':'ICEV-p',
                    'Diesel':'ICEV-d',
                    'Natural gas':'ICEV-g',
                    'Electric':'BEV',
                    'Fuel cell':'FCEV',
                    'Hybrid-petrol':'HEV-p',
                    '(Plugin) Hybrid-petrol':'PHEV',
                    '(Plugin) Hybrid-petrol - combustion':'PHEV-c',
                    '(Plugin) Hybrid-petrol - electric':'PHEV-e',
                }
        self.d_rev_pt = {v:k for k, v, in self.d_pt.items()}
        self.excel_lci = ""

    def load_map_file(self):
        with open('data/car_to_class_map.csv', 'r', encoding='ISO-8859-1') as f:
            data = [tuple(line) for line in csv.reader(f, delimiter=';')]
        return data

    def load_params_file(self):
        with open('data/parameters definition.txt', 'r') as f:
            data = [line for line in csv.reader(f, delimiter='\t')]
        return data


    def interpolate_array(self, years):
        return self.arr.interp(year=years,  kwargs={'fill_value': 'extrapolate'})

    def get_dc(self, dc):
        return get_standard_driving_cycle(dc)


    def process_results(self, d):
        """ Calculate LCIA and store results in an array of arrays """
        arr = self.interpolate_array(d[('Functional unit',)]['year'])
        modify_xarray_from_custom_parameters(d[('Foreground',)], arr)
        cm = CarModel(arr, cycle=d[('Driving cycle', )])
        cm.set_all()
        cost = cm.calculate_cost_impacts(scope=d[('Functional unit',)])
        data_cost = cost.values
        year = cost.coords['year'].values.tolist()
        powertrain = [self.d_rev_pt[pt] for pt in cost.coords['powertrain'].values.tolist()]
        size = cost.coords['size'].values.tolist()
        cost_category = cost.coords['cost_type'].values.tolist()
        list_res_costs = [['value', 'size', 'powertrain', 'year', 'cost category']]

        for s in range(0, len(size)):
            for pt in range(0, len(powertrain)):
                for y in range(0, len(year)):
                    for cat in range(0, len(cost_category)):
                        list_res_costs.append([data_cost[0, s, pt, y, cat], size[s], powertrain[pt], year[y], cost_category[cat]])

        self.ic = InventoryCalculation(cm.array, scope = d[('Functional unit',)], background_configuration = d[('Background',)])
        results = self.ic.calculate_impacts()

        lci = self.ic.export_lci(presamples = False)
        self.excel_lci = self.write_lci_to_excel(lci, "test").read()

        #s3 = boto3.resource('s3')
        #s3.Bucket('carculator-bucket').put_object(Key='test.xlsx', Body=excel_lci.read())

        data = results.values
        impact = results.coords['impact'].values.tolist()
        impact_category = results.coords['impact_category'].values.tolist()
        list_res = [['impact category', 'size', 'powertrain', 'year', 'category', 'value']]
        for imp in range(0, len(impact_category)):
            for s in range(0, len(size)):
                for pt in range(0, len(powertrain)):
                    for y in range(0, len(year)):
                        for cat in range(0, len(impact)):
                            list_res.append([impact_category[imp], size[s], powertrain[pt], year[y], impact[cat],
                                             data[imp, s, pt, y, cat, 0]])


        return (json.dumps([list_res, list_res_costs]), self.excel_lci)

    def format_dictionary(self, raw_dict):
        """ Format the dictionary sent by the user so that it can be understood by `carculator` """

        d_sliders =  {
            'mileage-slider':'kilometers per year',
            'lifetime-slider':'lifetime kilometers',
            'passenger-slider':'average passengers',
            'cargo-slider':'cargo mass'
        }
        new_dict = {}
        new_dict[('Functional unit',)] = {'powertrain': [self.d_pt[x] for x in raw_dict['type']],
                                          'year': [int(x) for x in raw_dict['year']],
                                          'size': raw_dict['size']}
        f_d = {}
        new_dict[('Driving cycle',)] = raw_dict['driving_cycle']
        new_dict[('Background',)] = {k: v for k, v in raw_dict['background params'].items()}

        for k, v in raw_dict['foreground params'].items():
            if k in d_sliders:
                name = d_sliders[k]
                cat = self.d_categories[name]
                powertrain = 'all'
                size = 'all'
                val = [float(v.replace(' ',''))]
            else:
                k = tuple(k.split(","))
                name = k[0]
                cat = self.d_categories[name]
                powertrain = self.d_pt[k[1]]
                size = k[2]
                val = [float(n) for n in v]

            d_val = {(k,'loc'): v for k, v in list(zip(new_dict[('Functional unit',)]['year'], val))}
            f_d[(cat, powertrain, size, name, 'none')] = d_val

        new_dict[('Foreground',)] = f_d

        return new_dict


    def write_lci_to_excel(self, lci, name):
        """
        Export an Excel file that can be consumed by Brightway2.

        :returns: returns the file path of the exported inventory.
        :rtype: str.
        """

        list_act = lci
        data = []

        data.extend((["Database", 'test'], ("format", "Excel spreadsheet")))
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

        filepath = "lci-" + name + ".xlsx"
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
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

        sheet = workbook.add_worksheet('test')

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