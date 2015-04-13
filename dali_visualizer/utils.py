redis_client = None

def get_redis():
    """
    Global Redis client sharing single pool
    to the Redis server.

    Outputs
    -------

    tornadoredis.Client : global Redis client

    """
    global redis_client
    return redis_client

def init_redis(client):
    """
    Global Redis client initialization.
    Pass a redis client in and assign
    it to the global variable.

    Inputs
    -------

    @client tornadoredis.Client : connection to Redis

    """
    global redis_client
    redis_client = client

__all__ = ["get_redis", "init_redis"]
