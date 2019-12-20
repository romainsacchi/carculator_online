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
app = Flask(__name__,
            template_folder = "../templates",
            static_folder= "../static")

is_prod = os.environ.get('IS_HEROKU', None)

if is_prod:
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', None)
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', None))
    app.config['MAIL_USE_TLS'] = int(os.environ.get('MAIL_USE_TLS', None))
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', None)
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', None)
    app.config['ADMINS'] = os.environ.get('ADMINS', None)
    app.config['RECIPIENT'] = os.environ.get('RECIPIENT', None)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', None)
    app.config['LANGUAGES'] = {
                                'en': 'English',
                                'it': 'Italian',
                                'fr': 'French',
                                'de': 'German'
                            }

else:
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

if __name__ == '__main__':
    app.run(debug=True)
