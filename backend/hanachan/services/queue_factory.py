
import os
from redis import Redis
from rq import Queue

def get_redis_connection():
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    return Redis.from_url(redis_url)

def get_queue(name='default'):
    """
    Returns an RQ Queue instance.
    """
    conn = get_redis_connection()
    return Queue(name, connection=conn)
