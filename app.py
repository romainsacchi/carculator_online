"""Flask App Project."""

from flask import Flask, render_template, request, jsonify
from flask_mail import Mail, Message
from flask_babel import Babel, _
import logging
from logging.handlers import SMTPHandler
from carculator import *
import os
import csv
import pandas as pd


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

# Load dictionary with electricity mixes
def load_electricity_mix_file():
    filename='data/electricity_mixes.csv'
    df = pd.read_csv(filename, sep=";")
    df['Year'] = (df['Year'].astype('i8') - 1970).view('datetime64[Y]')
    df = df.pivot(index='Year', columns='Country code')
    df = df.resample('A').mean()
    df = df.interpolate(method='time')
    df = df.T * 100
    df.columns = df.columns.year

    return df

electricity_mixes = load_electricity_mix_file()

@app.route('/')
def index():
    """Return homepage."""
    return render_template('index.html')

@app.route('/tool')
def tool_page():
    """Return tool page"""
    cip = CarInputParameters()
    powertrains = [pt for pt in cip.powertrains if pt not in ('PHEV-c', 'PHEV-e')]
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
    response = electricity_mixes.loc[electricity_mixes.index.get_level_values('Country code')==ISO,[2015,2040]]
    response.index = response.index.droplevel('Country code')
    return jsonify(response.to_dict())

@babel.localeselector
def get_locale():
    """
    Retrieve the favorite language of the browser and display text in the corresponding language.
    :return:
    """
    print(request.accept_languages.best_match(app.config['LANGUAGES']))
    return request.accept_languages.best_match(app.config['LANGUAGES'])

