FROM ubuntu:latest
MAINTAINER Romain Sacchi <r_s@me.com>
RUN apt-get update -y
RUN apt-get install -y python-pip python-dev build-essential
COPY . /carculator_online
WORKDIR /carculator_online
RUN pip install -r requirements.txt
ENTRYPOINT ["python"]
CMD ["carculator_online/__init__.py"]
