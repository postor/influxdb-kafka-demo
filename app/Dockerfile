FROM python:3.8-alpine

RUN pip install kafka-python

WORKDIR /app

ADD ./garden_sensor_gateway.py ./

CMD python garden_sensor_gateway.py