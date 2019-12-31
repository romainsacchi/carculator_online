import os
import urlparse
import redis
from rq import Worker, Queue, Connection

listen = ['default']

url = urlparse.urlparse(os.environ.get('REDISCLOUD_URL'))
conn = redis.Redis(host=url.hostname, port=url.port, password=url.password)


#redis_url = os.getenv('REDISCLOUD_URL', 'None')
#redis_pass = os.getenv('REDISTOGO_PASS', 'None')

#conn = redis.from_url(redis_url)

#conn = redis.Redis(
#    host=redis_url,
#    port=18718,
#    password=redis_pass)


if __name__ == '__main__':
    with Connection(conn):
        worker = Worker(list(map(Queue, listen)))
        worker.work()

