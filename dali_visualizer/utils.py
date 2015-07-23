from sys import argv as ARGV

import argparse

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

def parse_args():
    parser = argparse.ArgumentParser(description='Process some integers.')
    parser.add_argument('--port', type=int, default=8000, help='server port')
    parser.add_argument('--debug', action='store_true', help='Run in debug mode.')
    parser.add_argument('--redis_host', type=str, default="127.0.0.1", help='Which host to use to connect to redis.')
    parser.add_argument('--redis_port', type=int, default=6379,        help='Which port to use to connect to redis.')
    args = parser.parse_args()
    return args


__all__ = ["get_redis", "init_redis", "parse_args"]
