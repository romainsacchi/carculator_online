"""Flask App Project."""

from app import app
from flask import render_template, jsonify, request, make_response, session, redirect, url_for, json, send_file
from flask_babel import Babel, _
from .email import email_out
import numpy as np
import os
from rq import Queue
from rq.job import Job, NoSuchJobError
from worker import conn

@app.route('/')
def index():
    """Return homepage."""
    return render_template('index.html')

@app.route('/tool')
def tool_page():
    """Return tool page"""
    powertrains = ["Petrol", 'Diesel', 'Natural gas', 'Electric', 'Fuel cell', 'Hybrid-petrol', '(Plugin) Hybrid-petrol']
    sizes = app.calc.cip.sizes
    years = [i for i in range(2015, 2051)]
    driving_cycles = ['WLTC','WLTC 3.1','WLTC 3.2','WLTC 3.3','WLTC 3.4','CADC Urban','CADC Road','CADC Motorway',
                      'CADC Motorway 130','CADC','NEDC']
    return render_template('tool.html', powertrains=powertrains, sizes=sizes, years=years, driving_cycles=driving_cycles)

@app.route('/search_car_model/<search_item>')
def search_car_model(search_item):
    """ Return a list of cars if cars contain `search item`"""
    cars = [car for car in app.calc.car_to_class_map if any(search_item.lower() in x.lower() for x in car)]
    return jsonify(cars[:5])

@app.route('/search_params/<param_item>/<powertrain_filter>/<size_filter>')
def search_params(param_item, powertrain_filter, size_filter):
    """ Return a list of params if param contain `search?item`"""
    parameters = [param for param in app.calc.load_params_file() if any(param_item.lower() in x.lower() for x in param)]
    powertrain_filter = powertrain_filter.split(',')
    size_filter = size_filter.split(',')
    response = []
    for a in parameters:
        if isinstance(a[4], str):
            a[4] = [p.strip() for p in a[4].split(',')]
        if isinstance(a[5], str):
            a[5] = [app.calc.d_rev_pt[p.strip()] for p in a[5].split(',')]
        if isinstance(a[6], str):
            a[6] = [s.strip() for s in a[6].split(',')]
        if (list(set(a[5]).intersection(powertrain_filter)) and list(set(a[6]).intersection(size_filter))):
            response.append(a)

    return jsonify(response[:7])

@app.route('/get_param_value/<name>/<pt>/<s>/<y>')
def get_param_value(name, pt, s, y):

    pt = pt.split(',')
    pt = [app.calc.d_pt[p] for p in pt]
    s = s.split(',')
    y = y.split(',')
    y = [int(a) for a in y]
    arr = app.calc.interpolate_array(y)
    val = arr.sel(powertrain=pt, size=s, year=y, parameter=name, value=0).values.round(2).tolist()
    return jsonify(val)

@app.route('/get_driving_cycle/<driving_cycle>')
def get_driving_cycle(driving_cycle):
    """ Return a driving cycle"""
    dc = app.calc.get_dc(driving_cycle)
    return jsonify(dc.tolist())


@app.route('/send_email', methods=['POST'])
def send_email():
    """
    Sends an email after submission of the contact form.
    :return:
    """
    name = request.form["name_input"]
    email = request.form["email_input"]
    message = request.form["message_input"]
    body = message + " email: {}, name: {}".format(email, name)
    sender = app.config['ADMINS']
    recipients = [app.config['RECIPIENT']]
    email_out("Question", sender, recipients, body)
    return _("Email sent!")

@app.route('/get_electricity_mix/<ISO>/<years>')
def get_electricity_mix(ISO, years):
    """ Return the electricity mix for the ISO country code and the year(s) given """
    years = [int(y) for y in years.split(',')]
    response = app.calc.electricity_mix.loc[dict(country=ISO, value=0)].interp(year=years).values
    response = np.true_divide(response.T, response.sum(axis=1)).T
    response = np.round(response, 2)
    return jsonify(response.tolist())

@app.route('/get_results/', methods = ['POST'])
def get_results():
    """ Receive LCA calculation request and dispatch the job to the Redis server """
    d = app.calc.format_dictionary(request.get_json())

    job = q.enqueue_call(
        func=app.calc.process_results, args=(d,), result_ttl=2500000
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



@app.context_processor
def inject_conf_var():
    return dict(
                AVAILABLE_LANGUAGES=app.config['LANGUAGES'],
                CURRENT_LANGUAGE=session.get('language',request.accept_languages.best_match(app.config['LANGUAGES'].keys())))

@app.route('/language/<language>')
def set_language(language=None):
    session['language'] = language
    return redirect(url_for('index'))

@app.route('/get_language')
def get_language():

    lang = session["language"]

    if lang == "en":
        json_url = os.path.join(app.static_folder, "translation", "translation_en.json")
    if lang == "de":
        json_url = os.path.join(app.static_folder, "translation", "translation_de.json")
    if lang == "fr":
        json_url = os.path.join(app.static_folder, "translation", "translation_fr.json")
    if lang == "it":
        json_url = os.path.join(app.static_folder, "translation", "translation_it.json")

    with open(json_url, encoding='utf-8') as fh:
        data = json.load(fh)
    return make_response(data, 200)


@app.route("/get_inventory_excel")
def get_inventory_excel():
    return send_file(app.calc.excel_lci, attachment_filename="testing.xlsx", as_attachment=True)

@app.route("/get_param_table")
def get_param_table():
    params = app.calc.load_params_file()
    return render_template('param_table.html', params=params)