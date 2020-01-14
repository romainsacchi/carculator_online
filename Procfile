web: flask db upgrade --directory migrations; gunicorn app:app
worker: python app/worker.py