web: flask db upgrade --directory migrations;gunicorn -t 250 app:app --bind 0.0.0.0:${PORT}
worker: python app/worker.py