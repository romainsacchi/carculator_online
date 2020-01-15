from flask import Flask, session, request
from flask_mail import Mail
from flask_babel import Babel, _
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
import logging
from logging.handlers import SMTPHandler
import os

from .calculation import Calculation

ROOT = os.path.join(os.path.abspath(os.pardir), "carculator_online");
TEMPLATES_DIR = os.path.join(ROOT, "templates")
STATIC_DIR = os.path.join(ROOT, "static")
MIGRATION_DIR = os.path.join(ROOT, "migrations")

# Instantiate Flask app
app = Flask(__name__,
            template_folder = "../templates",
            static_folder= "../static")

# Setup flask-babel
babel = Babel(app)

# Instantiate flask-login
login = LoginManager(app)
login.login_view = 'login'


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
                                'de': 'German',
                            }
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('CLEARDB_DATABASE_URL', None)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_POOL_RECYCLE'] = 60
    #app.config['SQLALCHEMY_POOL_TIMEOUT'] = 20
    #app.config['CONNECT_TIMEOUT'] = 1000
    #app.config['NET_WRITE_TIMEOUT'] = 1000
    #app.config['WAIT_TIMEOUT'] = 300



else:
    # Attach configuration file
    app.config.from_pyfile('..\instance\config.py')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://bee698db94fa6e:02c34128@us-cdbr-iron-east-05.cleardb.net/heroku_9bb2a3349ea4243'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_POOL_RECYCLE'] = 60
    #app.config['SQLALCHEMY_POOL_TIMEOUT'] = 20
    #app.config['CONNECT_TIMEOUT'] = 1000
    #app.config['NET_WRITE_TIMEOUT'] = 1000
    #app.config['WAIT_TIMEOUT'] = 300

# Initiate database
db = SQLAlchemy(app)

migrate = Migrate(app, db, directory=MIGRATION_DIR)

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

# Setup flask-mail
mail = Mail(app)
from app import email_support
from app import routes, models


if __name__ == '__main__':
    app.run()
