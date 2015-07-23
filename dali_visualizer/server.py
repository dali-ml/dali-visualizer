#!/usr/bin/env python
import os
import tornado
import logging
import tornadoredis
import signal

from sockjs.tornado     import SockJSRouter

from .utils             import get_redis, init_redis
from .socket_connection import Connection
from .static_files      import generate_routes

server_dir  = os.path.abspath(os.path.dirname(__file__))
index_route = os.path.join(server_dir, 'static/html/index.html')
is_closing = False

def signal_handler(signum, frame):
    """Detect whether user is trying to close server"""
    global is_closing
    logging.info('exiting...')
    is_closing = True

def try_exit():
    """Check if server should shutdown gracefully"""
    global is_closing
    if is_closing:
        # clean up here
        tornado.ioloop.IOLoop.instance().stop()
        logging.info('exit success')
        print("\r", flush=True, end='')
        print("Dali Visualizer has finished his set")

class RedisVisualizer(object):
    """
    Connect to redis and get updates on different subscriptions. Also
    provide static files on /js and /css, and serve an 'index.html' file
    on the '/' route.
    """
    def __init__(self,
            socket_path     = "/updates",
            websockets      = True,
            subscriptions   =  None,
            redis_host      = "127.0.0.1",
            redis_port      = 6379,
            exit_gracefully = True,
            debug           = False):
        """
        RedisVisualization server. Servers updates from redis using websockets
        and also provide static files using Tornado.

        Inputs
        ------
        @socket_path         str : where should client ask for redis updates (default = '/updates')
        @websockets         bool : use websockets ? (default = True)
        @subscriptions list<str> : what to subscribe to on Redis (default=['namespace_*', 'updates_*'])
        @redis_host          str : what hostname is redis server on (default='127.0.0.1')
        @redis_port          int : what port to listen to for redis server (default=6379)
        @exit_gracefully    bool : capture SIGINT event & shut down server from ioloop (default=True)

        """
        self.exit_gracefully = exit_gracefully
        if subscriptions is None:
            subscriptions = ["updates_*"]
        # 2. Start a connection pool to redis:
        pool = tornadoredis.ConnectionPool(host=redis_host, port=redis_port)
        self.clients = tornadoredis.Client(connection_pool=pool, password="")
        init_redis(
            tornadoredis.Client(connection_pool=pool, password="")
        )
        self.clients.connect()
        get_redis().connect()
        # make sure redis reports expiration and set events:
        try:
            get_redis().execute_command('config', 'set', 'notify-keyspace-events', 'AKE')
            # 3. listen to events on feed_*, namespace_*
            self.clients.psubscribe( subscriptions, lambda msg: self.clients.listen(Connection.pubsub_message))
        except tornadoredis.exceptions.ConnectionError:
            print("""
                Could not connect to Redis. Start server with:
                    > redis-server
                """)
            signal_handler(None, None)
            try_exit()
        if not websockets:
            Router = SockJSRouter(Connection, socket_path, dict(disabled_transports=['websocket']))
        else:
            Router = SockJSRouter(Connection, socket_path)
        # 4. Creater router for http + sockets:
        self.App = tornado.web.Application(generate_routes(debug) + Router.urls)


    def start(self, port):
        """
        Start Server listening

        Inputs
        ------
        @port int : what port to listen for connections on
        """
        if self.exit_gracefully:
            signal.signal(signal.SIGINT, signal_handler)
        self.App.listen(port)
        if self.exit_gracefully:
            tornado.ioloop.PeriodicCallback(try_exit, 100).start()
        tornado.ioloop.IOLoop.instance().start()

__all__ = ["RedisVisualizer"]
