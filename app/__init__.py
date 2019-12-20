from flask import Flask, session, request
from flask_mail import Mail
from flask_babel import Babel, _
import logging
from logging.handlers import SMTPHandler
import os

from .calculation import Calculation

ROOT = os.path.join(os.path.abspath(os.pardir), "carculator_online");
TEMPLATES_DIR = os.path.join(ROOT, "templates")
STATIC_DIR = os.path.join(ROOT, "static")

print(ROOT, TEMPLATES_DIR, STATIC_DIR)

# Instantiate Flask app
app = Flask(__name__, template_folder = TEMPLATES_DIR, static_folder= STATIC_DIR, instance_relative_config=True)

session_token = "123456798"
app.config["SECRET_KEY"] = session_token
# Attach configuration file
app.config.from_pyfile('config.py')

# Setup logger to log errors by email
auth = (app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
secure = ()
mail_handler = SMTPHandler(
    mailhost=(app.config['MAIL_SERVER'], app.config['MAIL_PORT']),
    fromaddr='no-reply@' + app.config['ADMINS'],
    toaddrs=app.config['RECIPIENT'], subject='Error on carculator_online',
    credentials=auth, secure=secure)
mail_handler.setLevel(logging.ERROR)
app.logger.addHandler(mail_handler)


# Setup flask-mail
mail = Mail(app)
from app import email
from app import routes

# Setup flask-babel
babel = Babel(app)

app.calc = Calculation()

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
    session['language'] = request.accept_languages.best_match(app.config['LANGUAGES'])
    return session['language']


app.run(debug=True)