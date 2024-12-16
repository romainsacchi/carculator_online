web: flask db upgrade --directory migrations;gunicorn app:app  --timeout 120
worker: python app/worker.py