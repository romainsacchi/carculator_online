import os
from redis import Redis
from rq import Worker, Queue

# Get the Redis URL from the environment variable
redis_url = os.getenv('STACKHERO_REDIS_URL_TLS')
if not redis_url:
    print("Environment variable 'STACKHERO_REDIS_URL_TLS' is not set. Exiting.")
    exit(1)

# Initialize Redis connection
try:
    conn = Redis.from_url(
        redis_url,
        health_check_interval=10,
        retry_on_timeout=True,
        socket_keepalive=True,
        ssl=True,  # Ensure SSL is enabled
    )
    conn.ping()  # Test the Redis connection
    print("Successfully connected to Redis.")
except Exception as e:
    print(f"Cannot connect to Redis server: {e}")
    exit(1)

# Queues to listen to
listen = ['default']

if __name__ == '__main__':
    # Create queues to listen on
    queues = [Queue(name, connection=conn) for name in listen]

    # Initialize the worker
    worker = Worker(queues, connection=conn)

    # Start processing jobs
    print("Starting worker...")
    worker.work()
