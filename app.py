"""Flask App Project."""

from flask import Flask, render_template, request, jsonify, make_response, json
from flask_mail import Mail, Message
from flask_babel import Babel, _
import logging
from logging.handlers import SMTPHandler
from carculator import *
import csv

# Instantiate Flask app
app = Flask(__name__)

# Attach configuration file located in "/instance"
app.config.from_pyfile('config.py')


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

car_to_class_map = load_map_file()

electricity_mix = BackgroundSystemModel().electricity_mix

cip = CarInputParameters()
cip.static()

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
    cars = [car for car in car_to_class_map if any(search_item.lower() in x.lower() for x in car)]
    return jsonify(cars[:5])

@app.route('/get_driving_cycle/<driving_cycle>')
def get_driving_cycle(driving_cycle):
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
    # Return the electricity mix for the ISO country code and the year(s) given
    response = electricity_mix.loc[dict(country=ISO, value=0)].interp(year=[2017, 2040])
    return jsonify(response.to_dict())

def process_results(d):

    dcts, array = fill_xarray_from_input_parameters(cip)
    cm = CarModel(array, cycle=d['driving_cycle'])
    cm.set_all()
    ic = InventoryCalculation(cm.array)

    dict_pt = {
        'Diesel' : 'ICEV-p',
        'Petrol' : 'ICEV-d',
        'Natural gas': 'ICEV-g',
        'Electric': 'BEV',
        'Fuel cell': 'FCEV',
        'Hybrid-petrol': 'HEV-p',
        '(Plugin) Hybrid-petrol': 'PHEV'
    }

    results = ic.calculate_impacts(FU={'powertrain':[dict_pt[pt] for pt in d['type']],
                                       'year':d['year'],
                                       'size':d['size']})
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
    global response
    response = json.dumps(list_res)


@app.route('/get_results/', methods = ['POST'])
def get_results():
    res = request.get_json()

    d={}
    for k in res:
        d[k['key']] = k['value']

    process_results(d)

    res = make_response(jsonify({"message": "OK"}), 200)
    return res

@app.route('/result')
def display_result():
    return render_template('result.html', data = response)



@babel.localeselector
def get_locale():
    """
    Retrieve the favorite language of the browser and display text in the corresponding language.
    :return:
    """
    return request.accept_languages.best_match(app.config['LANGUAGES'])

