import os
import redis
from rq import Worker, Queue, Connection

listen = ['default']

redis_url = os.getenv('REDISCLOUD_URL', 'None')

try:
    conn = redis.from_url(redis_url)
except ValueError:
    print("Cannot connect to Redis server.")
    conn = None

if __name__ == '__main__':
    with Connection(conn):
        worker = Worker(list(map(Queue, listen)))
        worker.work()

