from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo
from app.models import User
import pycountry as pc

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    first_name = StringField('First name', validators=[DataRequired()])
    last_name = StringField('Last name', validators=[DataRequired()])
    choices = [(p.alpha_2, p.name) for p in pc.countries]
    choices.sort(key=lambda tup: tup[1])
    country = SelectField("Country", choices = choices, validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    organisation = StringField('Company/Institution', validators=[DataRequired()])
    newsletter = BooleanField("Subscribe to the newsletter?")
    str = "I allow the support team of carculator to collect and store the submitted data. " \
          "My submitted data will not be transmitted to any third party, but solely be used to generate statistics on the tool's audience. " \
            "At any time, I can ask the support team of carculator to consult the data I submitted and request its deletion."
    agree = BooleanField(str, validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    password2 = PasswordField(
        'Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError('Please use a different username.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is not None:
            raise ValidationError('Please use a different email address.')
