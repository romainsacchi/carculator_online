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
from rq import Queue
from rq.job import Job, NoSuchJobError
from worker import conn


# Instantiate Flask app
app = Flask(__name__)
session_token = secrets.token_urlsafe(16)
app.config["SECRET_KEY"] = session_token
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
d_categories = {cip.metadata[a]['name']:cip.metadata[a]['category'] for a in cip.metadata}
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

def interpolate_array(years):
    global arr
    return arr.interp(year=years,  kwargs={'fill_value': 'extrapolate'})

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

    pt = pt.split(',')
    pt = [d_pt[p] for p in pt]
    s = s.split(',')
    y = y.split(',')
    y = [int(a) for a in y]
    arr = interpolate_array(y)
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
    response = np.true_divide(response.T, response.sum(axis=1)).T
    response = np.round(response, 2)
    return jsonify(response.tolist())

def process_results(d):
    """ Calculate LCIA and store results in an array of arrays """
    arr = interpolate_array(d[('Functional unit',)]['year'])
    modify_xarray_from_custom_parameters(d[('Foreground',)], arr)
    cm = CarModel(arr, cycle=d[('Driving cycle', )])
    cm.set_all()
    cost = cm.calculate_cost_impacts(scope=d[('Functional unit',)])
    data_cost = cost.values
    year = cost.coords['year'].values.tolist()
    powertrain = [d_rev_pt[pt] for pt in cost.coords['powertrain'].values.tolist()]
    size = cost.coords['size'].values.tolist()
    cost_category = cost.coords['cost_type'].values.tolist()
    list_res_costs = [['value', 'size', 'powertrain', 'year', 'cost category']]

    for s in range(0, len(size)):
        for pt in range(0, len(powertrain)):
            for y in range(0, len(year)):
                for cat in range(0, len(cost_category)):
                    list_res_costs.append([data_cost[0, s, pt, y, cat], size[s], powertrain[pt], year[y], cost_category[cat]])

    ic = InventoryCalculation(cm.array)
    results = ic.calculate_impacts(scope = d[('Functional unit',)], background_configuration = d[('Background',)])
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


    return json.dumps([list_res, list_res_costs])

def format_dictionary(raw_dict):
    """ Format the dictionary sent by the user so that it can be understood by `carculator` """

    dictionary = {}
    for x in raw_dict:
        dictionary[x['key']] = x['value']

    d_sliders =  {
        'mileage-slider':'kilometers per year',
        'lifetime-slider':'lifetime kilometers',
        'passenger-slider':'average passengers',
        'cargo-slider':'cargo mass'
    }


    new_dict = {}
    new_dict[('Functional unit',)] = {'powertrain': [d_pt[x] for x in dictionary['type']],
                                      'year': [int(x) for x in dictionary['year']],
                                      'size': dictionary['size']}

    f_d={}
    for x in dictionary['foreground params']:
        if x['key'] == 'parameters':
            for y in x['value']:
                name = [a['value'] for a in y if a['key'] == 'parameter name'][0]
                cat = d_categories[name]
                powertrain = [d_pt[a['value']] for a in y if a['key'] == 'powertrain'][0]
                size = [a['value'] for a in y if a['key'] == 'size'][0]
                vals = [a['value'] for a in y if a['key'] == 'values'][0]
                d_val = {(k,'loc'):float(v) for k,v in list(zip(new_dict[('Functional unit',)]['year'], vals))}
                f_d[(cat, powertrain, size, name, 'none')] = d_val

        if x['key'] in d_sliders:
            k = d_sliders[x['key']]
            cat = d_categories[k]
            val = [float(x['value'].replace(' ',''))]
            d_val = {(k,'loc'):v for k,v in list(zip(new_dict[('Functional unit',)]['year'], val))}
            f_d[(cat, 'all', 'all', k, 'none')] = d_val

        if x['key'] == 'driving_cycle':
            new_dict[('Driving cycle',)] = x['value']
    new_dict[('Foreground',)] = f_d
    b_d={}
    for x in dictionary['background params']:
        k = x['key']
        v = x['value']
        b_d[k] = v
    dictionary['background params'] = b_d

    new_dict[('Background',)] = dictionary['background params']
    return new_dict


@app.route('/get_results/', methods = ['POST'])
def get_results():
    """ Receive LCA calculation request and dispatch the job to the Redis server """
    d = format_dictionary(request.get_json())
    job = q.enqueue_call(
        func=process_results, args=(d,), result_ttl=2500000
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
    try:
        job = Job.fetch(job_key, connection=conn)
    except NoSuchJobError:
        response = jsonify({"job status": 'job not found'})
        return make_response(response, 404)


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
