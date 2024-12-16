from app.redis import redis_connection
from rq import Worker, Queue

# Queues to listen to
listen = ['default']

if __name__ == '__main__':
    # Create queues to listen on
    queues = [Queue(name, connection=redis_connection) for name in listen]

    # Initialize the worker
    worker = Worker(queues, connection=redis_connection)

    # Start processing jobs
    print("Starting worker...")
    worker.work()
