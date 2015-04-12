from sockjs.tornado import SockJSConnection
import json

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

    def on_open(self, request):
        """
        Choose what model updates to listen to in visualizer:
        """
        self.authenticated = True
        self.channel = None
        # choose the channel
        self.send_message({}, 'pick_channel')
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
        for client in cls.clients:
            if client.authenticated and client.channel == msg.channel:
                client.send_message(msg.body, "data")
