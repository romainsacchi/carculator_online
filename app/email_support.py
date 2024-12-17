
from flask_mail import Message
from app import mail


def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)

def email_out(subject, sender, recipients, text_body, attachments=None, sync=False):
    print(f"Sending email to {recipients}, with subject {subject}, from {sender}")
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = text_body
    if attachments:
        for attachment in attachments:
            msg.attach(*attachment)

    mail.send(msg)

