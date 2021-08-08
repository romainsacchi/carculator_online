import os
import redis
from rq import Worker, Queue, Connection

listen = ['0.0.0.0']
redis_url = os.getenv('REDISCLOUD_URL', 'None')

try:
    conn = redis.from_url(redis_url)
except ValueError:
    print("Cannot connect to Redis server.")
    conn = None

if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

    #with Connection(conn):
    #    worker = Worker(list(map(Queue, listen)))
    #    worker.work()
