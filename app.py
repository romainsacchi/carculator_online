"""Flask App Project."""

from flask import Flask, render_template, request
from flask_mail import Mail, Message
import logging
from logging.handlers import SMTPHandler
from carculator import *


# Instantiate Flask app
app = Flask(__name__, instance_relative_config=True)
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

# Setup flask_mail
mail = Mail(app)

@app.route('/')
def index():
    """Return homepage."""
    return render_template('index.html')

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
    return "Email sent!"