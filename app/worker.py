import os
import redis
import threading
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

    # Create a PubSub instance
    p = conn.pubsub()

    # Subscribe to the channel "test"
    p.subscribe('test')

    # Create a function that will call `check_health` every 5 seconds
    def redis_auto_check(p):
        t = threading.Timer(5, redis_auto_check, [p])
        t.start()
        p.check_health()

    # Call the redis_auto_check function
    redis_auto_check(p)

except ValueError:
    print("Cannot connect to Redis server.")
    conn = None



if __name__ == '__main__':
    with Connection(conn):
        worker = Worker(list(map(Queue, listen)))
        worker.work()
