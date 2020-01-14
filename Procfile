web: flask db upgrade init --directory migrations; gunicorn app:app
worker: python app/worker.py