import os
import redis
from rq import Worker, Queue, Connection

listen = ['default']
redis_url = os.getenv('STACKHERO_REDIS_URL_TLS', 'None')

try:
    conn = redis.from_url(
        redis_url,
        health_check_interval=10,
        retry_on_timeout=True,
        socket_keepalive=True
    )

except ValueError:
    print("Cannot connect to Redis server.")
    conn = None


if __name__ == '__main__':
    with Connection(conn):
        worker = Worker(list(map(Queue, listen)), connection=conn)
        worker.work()
