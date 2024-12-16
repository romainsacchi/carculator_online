import logging
import os
from logging.handlers import SMTPHandler
from flask import Flask, request, session
from flask_babel import Babel
from flask_login import LoginManager
from flask_mail import Mail
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from rq import Queue
from redis import Redis
from app.redis import redis_connection


from .version import __version__

ROOT = os.path.join(os.path.abspath(os.pardir), "carculator_online")
TEMPLATES_DIR = os.path.join(ROOT, "templates")
STATIC_DIR = os.path.join(ROOT, "static")
MIGRATION_DIR = os.path.join(ROOT, "migrations")

# Instantiate Flask app
app = Flask(__name__,
            template_folder="../templates",
            static_folder="../static")

# App version
app.version = __version__


def get_locale():
    """
    Retrieve the favorite language of the browser and display text in the corresponding language.
    """
    try:
        language = session['language']
    except KeyError:
        language = None
    if language is not None:
        return language
    session['language'] = request.accept_languages.best_match(app.config['LANGUAGES'])
    return session['language']


is_prod = os.environ.get('IS_HEROKU', None)

# Setup flask-babel
babel = Babel(app, locale_selector=get_locale)

# Instantiate flask-login
login = LoginManager(app)
login.login_view = 'login'

# Production configuration
if is_prod:
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT'))
    app.config['MAIL_USE_TLS'] = bool(int(os.environ.get('MAIL_USE_TLS')))
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['ADMINS'] = os.environ.get('ADMINS')
    app.config['RECIPIENT'] = os.environ.get('RECIPIENT')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('STACKHERO_MYSQL_DATABASE_URL')

    # Use centralized Redis connection
    app.redis = redis_connection
    app.task_queue = Queue(connection=app.redis)

else:
    app.redis = None
    app.task_queue = None

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['LANGUAGES'] = {
    'en': 'English',
    'it': 'Italian',
    'fr': 'French',
    'de': 'German'
}

# CA Certificate Handling
ca_cert_path = "/tmp/ca-cert.pem"
if 'SSL_KEY' in os.environ:
    with open(ca_cert_path, "w") as ca_file:
        ca_file.write(os.environ["SSL_KEY"])

# SSL Arguments for SQLAlchemy
ssl_args = {
    'ssl': {
        'ca': ca_cert_path,  # Path to the CA certificate
    }
}

# Initiate database
db = SQLAlchemy(app, engine_options={"connect_args": ssl_args, "pool_pre_ping": True})

# Migrate setup
migrate = Migrate(app, db, directory=MIGRATION_DIR)

# Setup logger to log errors by email
if is_prod:
    auth = (app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
    secure = ()
    mail_handler = SMTPHandler(
        mailhost=(app.config['MAIL_SERVER'], app.config['MAIL_PORT']),
        fromaddr=f"no-reply@{app.config['ADMINS']}",
        toaddrs=app.config['RECIPIENT'], subject='Error on carculator_online',
        credentials=auth, secure=secure
    )
    mail_handler.setLevel(logging.ERROR)
    app.logger.addHandler(mail_handler)

# Setup flask-mail
mail = Mail(app)

# Import other components
from app import email_support
from app import routes, models

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
