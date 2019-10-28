web: gunicorn app:app
worker: rq worker -u $REDIS_URL app