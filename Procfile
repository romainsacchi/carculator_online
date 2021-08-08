web: flask db upgrade --directory migrations;gunicorn --bind 0.0.0.0:${PORT} app:app
worker: python app/worker.py