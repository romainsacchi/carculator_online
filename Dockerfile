FROM ubuntu:latest
MAINTAINER Romain Sacchi <r_s@me.com>

RUN apt-get update -y
RUN apt-get install -y python-pip python-dev build-essential
COPY . /carculator_online
WORKDIR /carculator_online
RUN pip install -r requirements.txt

EXPOSE 5000

ENV FLASK_APP "carculator_online"
ENV FLASK_ENV "development"
ENV FLASK_DEBUG True

CMD flask run --host=0.0.0.0 --port=5000
