"""Flask App Project."""

from flask import Flask, render_template, request, jsonify, make_response, json, session, redirect, url_for
from flask_mail import Mail, Message
from flask_babel import Babel, _
import logging
from logging.handlers import SMTPHandler
from carculator import *
import csv
import secrets
import numpy as np
#from rq import Queue
#from rq.job import Job
#from worker import conn


# Instantiate Flask app
app = Flask(__name__)
session_token = secrets.token_urlsafe(16)
app.config["SECRET_KEY"] = session_token
# Attach configuration file located in "/instance"
app.config.from_pyfile('config.py')

# Create a connection to the Redis server
#q = Queue(connection=conn)

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

def load_params_file():
    with open('data/parameters definition.txt', 'r') as f:
        data = [line for line in csv.reader(f, delimiter='\t')]
    return data

# Pre-load stuff
car_to_class_map = load_map_file()
params = load_params_file()
electricity_mix = BackgroundSystemModel().electricity_mix
cip = CarInputParameters()
cip.static()
dcts, arr = fill_xarray_from_input_parameters(cip)

d_pt = {
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

d_rev_pt = {v:k for k, v, in d_pt.items()}

@app.route('/')
def index():
    """Return homepage."""
    return render_template('index.html')

@app.route('/tool')
def tool_page():
    """Return tool page"""
    powertrains = ["Petrol", 'Diesel', 'Natural gas', 'Electric', 'Fuel cell', 'Hybrid-petrol', '(Plugin) Hybrid-petrol']
    sizes = cip.sizes
    years = [i for i in range(2015, 2051)]
    driving_cycles = ['WLTC','WLTC 3.1','WLTC 3.2','WLTC 3.3','WLTC 3.4','CADC Urban','CADC Road','CADC Motorway',
                      'CADC Motorway 130','CADC','NEDC']
    return render_template('tool.html', powertrains=powertrains, sizes=sizes, years=years, driving_cycles=driving_cycles)


@app.route('/search_car_model/<search_item>')
def search_car_model(search_item):
    """ Return a list of cars if cars contain `search item`"""
    cars = [car for car in car_to_class_map if any(search_item.lower() in x.lower() for x in car)]
    return jsonify(cars[:5])

@app.route('/interpolate_array/<years>')
def interpolate_array(years):

    years = years.split(',')
    years = [int(y) for y in years]
    global arr
    arr = arr.interp(year=years,  kwargs={'fill_value': 'extrapolate'})
    response = jsonify({"array interpolation": 'OK'})
    return make_response(response, 200)

@app.route('/search_params/<param_item>/<powertrain_filter>/<size_filter>')
def search_params(param_item, powertrain_filter, size_filter):
    """ Return a list of params if param contain `search?item`"""
    parameters = [param for param in load_params_file() if any(param_item.lower() in x.lower() for x in param)]
    powertrain_filter = powertrain_filter.split(',')
    size_filter = size_filter.split(',')
    response = []
    for a in parameters:
        if isinstance(a[4], str):
            a[4] = [p.strip() for p in a[4].split(',')]
        if isinstance(a[5], str):
            a[5] = [d_rev_pt[p.strip()] for p in a[5].split(',')]
        if isinstance(a[6], str):
            a[6] = [s.strip() for s in a[6].split(',')]
        if (list(set(a[5]).intersection(powertrain_filter)) and list(set(a[6]).intersection(size_filter))):
            response.append(a)

    return jsonify(response[:7])

@app.route('/get_param_value/<name>/<pt>/<s>/<y>')
def get_param_value(name, pt, s, y):
    global arr
    pt = pt.split(',')
    pt = [d_pt[p] for p in pt]
    s = s.split(',')
    y = y.split(',')
    y = [int(a) for a in y]
    print(y)
    val = arr.sel(powertrain=pt, size=s, year=y, parameter=name, value=0).values.round(2).tolist()
    return jsonify(val)

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

@app.route('/get_electricity_mix/<ISO>/<years>')
def get_electricity_mix(ISO, years):
    """ Return the electricity mix for the ISO country code and the year(s) given """
    years = [int(y) for y in years.split(',')]
    response = electricity_mix.loc[dict(country=ISO, value=0)].interp(year=years).values
    response = np.round(response, 2)
    response[np.isnan(response)] = 0
    return jsonify(response.round(2).tolist())




def process_results(d):
    """ Calculate LCIA and store results in an array of arrays """
    global arr
    #modify_xarray_from_custom_parameters(d, array)
    cm = CarModel(arr, cycle=d[('Driving cycle', )])
    cm.set_all()
    ic = InventoryCalculation(cm.array)
    results = ic.calculate_impacts(scope = d[('Functional unit',)], background_configuration = d[('Background',)])
    data = results.values
    year = results.coords['year'].values.tolist()
    powertrain = [d_rev_pt[pt] for pt in results.coords['powertrain'].values.tolist()]
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
    print('filling')


    return json.dumps(list_res)

def format_dictionary(raw_dict):
    """ Format the dictionary sent by the user so that it can be understood by `carculator` """
    dictionary = {}
    for x in request.get_json():
        dictionary[x['key']] = x['value']

    f_d={}
    for x in dictionary['foreground params']:
        k = x['key']
        v = x['value']
        f_d[k] = v
    dictionary['foreground params'] = f_d

    b_d={}
    for x in dictionary['background params']:
        k = x['key']
        v = x['value']
        b_d[k] = v
    dictionary['background params'] = b_d

    new_dict = {}
    new_dict[('Functional unit',)] = {'powertrain': [d_pt[x] for x in dictionary['type']],
                                       'year': [int(x) for x in dictionary['year']],
                                       'size':dictionary['size']}

    new_dict[('Driving cycle',)] = dictionary['foreground params']['driving_cycle']

    new_dict[('Background',)] = dictionary['background params']


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
                if key in ('fuel_cell_cost', 'Fuel_cell_hydrogen_cost', 'electric_battery_cost', 'Electric_energy_cost',
                           'Petrol_combustion_share', 'Diesel_combustion_share', 'Natural gas_combustion_share',
                           'Hybrid-petrol_combustion_share', '(Plugin) Hybrid-petrol_combustion_share'):
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
    job = q.enqueue_call(
        func=process_results, args=(d,), result_ttl=500
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
    try:
        language = session['language']
    except KeyError:
        language = None
    if language is not None:
        return language
    return request.accept_languages.best_match(app.config['LANGUAGES'])

@app.context_processor
def inject_conf_var():
    return dict(
                AVAILABLE_LANGUAGES=app.config['LANGUAGES'],
                CURRENT_LANGUAGE=session.get('language',request.accept_languages.best_match(app.config['LANGUAGES'].keys())))

@app.route('/language/<language>')
def set_language(language=None):
    session['language'] = language
    return redirect(url_for('index'))
