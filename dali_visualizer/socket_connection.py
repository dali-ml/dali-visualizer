from sockjs.tornado import SockJSConnection
import json
import tornado.web
import tornado.gen
from .utils import get_redis

class Connection(SockJSConnection):
    clients = set()
    def send_error(self, message, error_type=None):
        """
        Standard format for all errors
        """
        return self.send(json.dumps({
            'type': 'error' if not error_type else '%s_error' % error_type,
            'data': {
                'message': message
            }
        }))

    def send_message(self, message, data_type):
        """
        Standard format for all messages
        """
        return self.send(json.dumps({
            'type': data_type,
            'data': message
        }))

    @tornado.gen.coroutine
    def on_open(self, request):
        """
        Choose what model updates to listen to in visualizer:
        """
        self.authenticated = True
        self.channel = None
        # choose the channel
        available_channels = yield tornado.gen.Task(get_redis().keys, "namespace_*")
        self.send_message(
            {
                "available_channels": [ch.replace("namespace_", "feed_") for ch in available_channels] # available channels
            },
            'pick_channel' # what to name the channel
        )
        self.clients.add(self)

    def on_message(self, msg):
        # For every incoming message, broadcast it to all clients
        # self.broadcast(self.clients, msg)
        if len(msg) > 2:
            json_msg = json.loads(msg)
            if "channel" in json_msg:
                # new participant to this channel:
                self.channel = json_msg["channel"]
        else:
            pass

    def on_close(self):
        # If client disconnects, remove him from the clients list
        self.clients.remove(self)

    @classmethod
    def pubsub_message(cls, msg):
        if msg.channel.startswith('__keyspace@'):
            for client in cls.clients:
                if client.authenticated:
                    # report change in keyspace
                    client.send(json.dumps({
                        'type': 'keyspace_event',
                        'data': {
                            "message": msg.body,
                            "channel": msg.channel
                        }
                    }))
        else:
            for client in cls.clients:
                if client.authenticated and client.channel == msg.channel:
                    # here is what redis sends
                    client.send(msg.body)
