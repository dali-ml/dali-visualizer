from sockjs.tornado import SockJSConnection
import json
import tornado.web
import tornado.gen
from .utils import get_redis

class Connection(SockJSConnection):
    clients = set()
    available_experiments = {}
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

    def on_experiments_updated(self):
        self.send_message(
            {
                "available_experiments": Connection.available_experiments
            },
            'experiments_list_update' # what to name the channel
        )

    @tornado.gen.coroutine
    def on_open(self, request):
        """
        Choose what model updates to listen to in visualizer:
        """
        self.authenticated = True
        self.experiment_uuid = None
        # choose the channel
        self.on_experiments_updated()
        self.clients.add(self)

    def on_message(self, msg):
        # For every incoming message, broadcast it to all clients
        # self.broadcast(self.clients, msg)
        if len(msg) > 2:
            try:
                json_msg = json.loads(msg)
            except Exception as e:
                print ("Error parsing JSON from client: " + e)
                return
            if "experiment_uuid" in json_msg:
                # new participant to this channel:
                self.experiment_uuid = json_msg["experiment_uuid"]
        else:
            pass

    def on_close(self):
        # If client disconnects, remove him from the clients list
        self.clients.remove(self)

    @classmethod
    def announce_new_experiments(cls, experiments):
        Connection.available_experiments = experiments
        for client in cls.clients:
            if client.authenticated:
                client.on_experiments_updated()

    @classmethod
    def pubsub_message(cls, msg):
        PREFIX = 'updates_'
        if not msg.channel.startswith(PREFIX) or msg.kind == 'psubscribe':
            return
        try:
            experiment_uuid = msg.channel[len(PREFIX):]
            data = json.loads(msg.body)
            data_type = data["type"]
        except Exception as e:
            print('WARNING: exception JSON parsing incoming update: ', e)
            return

        if data_type == 'heartbeat':
            # only used by server - do not pass to website
            return

        for client in cls.clients:
            if client.authenticated and client.experiment_uuid == experiment_uuid:
                # here is what redis sends
                client.send(msg.body)
