web: flask db upgrade --directory migrations;gunicorn app:app --bind 0.0.0.0:${PORT}
worker: python app/worker.py