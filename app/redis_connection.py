import os
from redis import Redis

# Get Redis URL from environment variable
redis_url = os.getenv('STACKHERO_REDIS_URL_TLS')

if not redis_url:
    raise RuntimeError("STACKHERO_REDIS_URL_TLS environment variable is not set.")

# Initialize Redis connection
redis_connection = Redis.from_url(
    redis_url,
    health_check_interval=10,
    retry_on_timeout=True,
    socket_keepalive=True
)
