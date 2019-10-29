"""Flask App Project."""

from flask import Flask, render_template, request, jsonify, make_response, json
from flask_mail import Mail, Message
from flask_babel import Babel, _
import logging
from logging.handlers import SMTPHandler
from carculator import *
import csv
from rq import Queue
from rq.job import Job
from worker import conn


# Instantiate Flask app
app = Flask(__name__)

# Attach configuration file located in "/instance"
app.config.from_pyfile('config.py')

# Create a connection to the Redis server
q = Queue(connection=conn)

# Setup logger to log errors by email
auth = (app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
secure = ()
mail_handler = SMTPHandler(
    mailhost=(app.config['MAIL_SERVER'], app.config['MAIL_PORT']),
    fromaddr='no-reply@' + app.config['ADMINS'],
    toaddrs=app.config['ADMINS'], subject='Error on carculator_online',
    credentials=auth, secure=secure)
mail_handler.setLevel(logging.ERROR)
app.logger.addHandler(mail_handler)

# Setup flask-mail
mail = Mail(app)

# Setup flask-babel
babel = Babel(app)

def load_map_file():
    with open('data/car_to_class_map.csv', 'r', encoding='ISO-8859-1') as f:
        data = [tuple(line) for line in csv.reader(f, delimiter=';')]
    return data

# Pre-load stuff
car_to_class_map = load_map_file()
electricity_mix = BackgroundSystemModel().electricity_mix
cip = CarInputParameters()
cip.static()
dcts, array = fill_xarray_from_input_parameters(cip)

@app.route('/')
def index():
    """Return homepage."""
    return render_template('index.html')

@app.route('/tool')
def tool_page():
    """Return tool page"""
    powertrains = ["Petrol", 'Diesel', 'Natural gas', 'Electric', 'Fuel cell', 'Hybrid-petrol', '(Plugin) Hybrid-petrol']
    sizes = cip.sizes
    years = cip.years
    driving_cycles = ['WLTC','WLTC 3.1','WLTC 3.2','WLTC 3.3','WLTC 3.4','CADC Urban','CADC Road','CADC Motorway',
                      'CADC Motorway 130','CADC','NEDC']
    return render_template('tool.html', powertrains=powertrains, sizes=sizes, years=years, driving_cycles=driving_cycles)


@app.route('/search_car_model/<search_item>')
def search_car_model(search_item):
    """ Return a list of cars if cars contain `search item`"""
    cars = [car for car in car_to_class_map if any(search_item.lower() in x.lower() for x in car)]
    return jsonify(cars[:5])

@app.route('/get_driving_cycle/<driving_cycle>')
def get_driving_cycle(driving_cycle):
    """ Return a driving cycle"""
    dc = get_standard_driving_cycle(driving_cycle)
    return jsonify(dc.to_dict())

if __name__ == '__main__':
    app.run(debug=True)

@app.route('/send_email', methods=['POST'])
def send_email():
    """
    Sends an email after submission of the contact form.
    :return:
    """
    name = request.form["name_input"]
    email = request.form["email_input"]
    message = request.form["message_input"]

    msg = Message(subject="",
                  sender=app.config['ADMINS'],
                  recipients=[app.config['ADMINS']],  # replace with your email for testing
                  body=message + " email: {}, name: {}".format(email, name))
    mail.send(msg)
    return _("Email sent!")

@app.route('/get_electricity_mix/<ISO>')
def get_electricity_mix(ISO):
    """ Return the electricity mix for the ISO country code and the year(s) given """
    response = electricity_mix.loc[dict(country=ISO, value=0)].interp(year=[2017, 2040])
    return jsonify(response.to_dict())

def process_results(d):
    """ Calculate LCIA and store results in an array of arrays """
    modify_xarray_from_custom_parameters(d, array)
    cm = CarModel(array, cycle=d[('Driving cycle', )])
    cm.set_all()
    ic = InventoryCalculation(cm.array)

    results = ic.calculate_impacts(d[('Functional unit',)])
    data = results.values
    year = results.coords['year'].values.tolist()
    powertrain = results.coords['powertrain'].values.tolist()
    impact = results.coords['impact'].values.tolist()
    size = results.coords['size'].values.tolist()
    impact_category = results.coords['impact_category'].values.tolist()
    list_res = []
    list_res.append(['impact category', 'size', 'powertrain', 'year', 'category', 'value'])
    for imp in range(0, len(impact_category)):
        for s in range(0, len(size)):
            for pt in range(0, len(powertrain)):
                for y in range(0, len(year)):
                    for cat in range(0, len(impact)):
                        list_res.append([impact_category[imp], size[s], powertrain[pt], year[y], impact[cat],
                                         data[imp, s, pt, y, cat, 0]])

    return json.dumps(list_res)

def format_dictionary(raw_dict):
    """ Format the dictionary sent by the user so that it can be understood by `carculator` """

    d_pt = {
        'Petrol':'ICEV-p',
        'Diesel':'ICEV-d',
        'Natural gas':'ICEV-g',
        'Electric':'BEV',
        'Fuel cell':'FCEV',
        'Hybrid-petrol':'HEV-p',
        '(Plugin) Hybrid-petrol':'PHEV'
    }

    new_dict = {}
    new_dict[('Functional unit',)] = {'powertrain':
                                          [raw_dict[k]['value'] for k in range(0, len(raw_dict))
                                                   if raw_dict[k]['key'] == 'type'][0],
                                       'year':[raw_dict[k]['value'] for k in range(0, len(raw_dict))
                                               if raw_dict[k]['key'] == 'year'][0],
                                       'size':[raw_dict[k]['value'] for k in range(0, len(raw_dict))
                                               if raw_dict[k]['key'] == 'size'][0]}

    new_dict[('Functional unit',)]['powertrain'] = [d_pt[pt] for pt in new_dict[('Functional unit',)]['powertrain']]
    new_dict[('Driving cycle',)] = [raw_dict[k]['value'] for k in range(0, len(raw_dict))
                                    if raw_dict[k]['key'] == 'driving_cycle'][0]

    new_dict[('Background',)] = [{raw_dict[k]['key']:raw_dict[k]['value']} for k in range(0, len(raw_dict))
                                    if raw_dict[k]['key'].startswith('background')]

    map_dict = {
        'electric_cell_density':
            {('Energy Storage', 'BEV', 'all', 'battery cell energy density', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'electric_battery_cost':
            {('Costs', 'BEV', 'all', 'energy battery cost per kWh', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Electric_energy_cost':
            {('Costs', 'BEV', 'all', 'energy cost per kWh', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'fuel_cell_cost':
            {('Costs', 'FCEV', 'all', 'fuel cell cost per kW', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Fuel_cell_hydrogen_cost':
            {('Costs', 'FCEV', 'all', 'energy cost per kWh', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Petrol_drivetrain_eff':
            {('Powertrain', 'ICEV-p', 'all', 'drivetrain efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Petrol_engine_eff': {
            ('Powertrain', 'ICEV-p', 'all', 'engine efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Petrol_combustion_share': {
            ('Powertrain', 'ICEV-p', 'all', 'combustion power share', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Petrol_fuel_cost': {
            ('Costs', 'ICEV-p', 'all', 'energy cost per kWh', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Diesel_drivetrain_eff': {
            ('Powertrain', 'ICEV-d', 'all', 'drivetrain efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Diesel_engine_eff': {
            ('Powertrain', 'ICEV-d', 'all', 'engine efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Diesel_combustion_share': {
            ('Powertrain', 'ICEV-d', 'all', 'combustion power share', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Diesel_fuel_cost': {
            ('Costs', 'ICEV-d', 'all', 'energy cost per kWh', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Natural gas_drivetrain_eff': {
            ('Powertrain', 'ICEV-g', 'all', 'drivetrain efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Natural gas_engine_eff': {
            ('Powertrain', 'ICEV-g',  'all','engine efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Natural gas_combustion_share': {
            ('Powertrain', 'ICEV-g', 'all', 'combustion power share', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Natural gas_fuel_cost': {
            ('Costs', 'ICEV-g', 'all', 'energy cost per kWh', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Hybrid-petrol_drivetrain_eff': {
            ('Powertrain', 'HEV-p', 'all', 'drivetrain efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Hybrid-petrol_engine_eff': {
            ('Powertrain', 'HEV-p', 'all', 'engine efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Hybrid-petrol_combustion_share': {
            ('Powertrain', 'HEV-p', 'all', 'combustion power share', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        'Hybrid-petrol_fuel_cost': {
            ('Costs', 'HEV-p',  'all','energy cost per kWh', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        '(Plugin) Hybrid-petrol_drivetrain_eff': {
            ('Powertrain', 'PHEV-e',  'all','drivetrain efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0},
            ('Powertrain', 'PHEV-c', 'all', 'drivetrain efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        '(Plugin) Hybrid-petrol_engine_eff': {
            ('Powertrain', 'PHEV-e', 'all', 'engine efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0},
            ('Powertrain', 'PHEV-c',  'all','engine efficiency', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        '(Plugin) Hybrid-petrol_combustion_share': {
            ('Powertrain', 'PHEV-e', 'all', 'combustion power share', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0},
            ('Powertrain', 'PHEV-c', 'all', 'combustion power share', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
        '(Plugin) Hybrid-petrol_fuel_cost': {
            ('Costs', 'PHEV-e', 'all', 'energy cost per kWh', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0},
            ('Costs', 'PHEV-c', 'all', 'energy cost per kWh', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},

        'mileage-slider': {
            ('Driving', 'all', 'all', 'kilometers per year', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
            'lifetime-slider': {
                ('Driving', 'all', 'all', 'lifetime kilometers', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
                'cargo-slider': {
                    ('Glider', 'all', 'all', 'cargo mass', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
                    'passenger-slider': {
                        ('Glider', 'all', 'all', 'average passengers', 'none'): {(2017, 'loc'): 0, (2040, 'loc'): 0}},
                    }

    for i in range(0, len(raw_dict)):
        if raw_dict[i]['key'] in map_dict:
            k = list(map_dict[raw_dict[i]['key']].keys())[0]
            key = raw_dict[i]['key']
            vals = raw_dict[i]['value']
            if isinstance(vals, list):
                if key in ('fuel_cell_cost', 'Fuel_cell_hydrogen_cost', 'electric_battery_cost', 'Electric_energy_cost'):
                    v = {
                        (2017,'loc'): float(vals[1]),
                        (2040, 'loc'): float(vals[0])
                         }
                else:
                    v = {
                        (2017, 'loc'): float(vals[0]),
                        (2040, 'loc'): float(vals[1])
                    }
            else:
                v = {(int(new_dict[('Functional unit',)]['year'][0]),'loc'): float(vals.replace(' ', ''))}
            new_dict[k] = v
    return new_dict


@app.route('/get_results/', methods = ['POST'])
def get_results():
    """ Receive LCA calculation request and dispatch the job to the Redis server """
    d = format_dictionary(request.get_json())
    print(d)
    job = q.enqueue_call(
        func=process_results, args=(d,), result_ttl=5000
    )
    res = make_response(jsonify({"job id": job.get_id()}), 200)
    return res

@app.route('/display_result/<job_key>', methods=['GET'])
def display_result(job_key):
    """ If the job is finished, render `result.html` along with the results """
    job = Job.fetch(job_key, connection=conn)
    if job.is_finished:
        return render_template('result.html', data = job.result)

    
@app.route('/check_status/<job_key>')
def get_job_status(job_key):
    """ Check the status of the job for the given `job_id` """
    job = Job.fetch(job_key, connection=conn)
    response = jsonify({"job status": job.get_status()})
    return make_response(response, 200)

@babel.localeselector
def get_locale():
    """
    Retrieve the favorite language of the browser and display text in the corresponding language.
    :return:
    """
    return request.accept_languages.best_match(app.config['LANGUAGES'])

