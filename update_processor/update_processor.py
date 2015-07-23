import json
import time

from threading import Thread

class UpdateProcessor(object):
    def __init__(self, redis):
        self.r = redis
        self.p = None
        self.uuid_to_name = {}

    def available_channels():
        print (self.uuid_to_name)
        return self.uuid_to_name

    def run(self):
        self.p = self.r.pubsub()
        self.p.psubscribe('updates_*')
        while True:
            message = self.p.get_message()
            if message:
                channel = message['channel']
                data    = message['data']

                PREFIX = "updates_"

                experiment_uid = channel.decode('utf-8')[len(PREFIX):]

                if experiment_uid == '*':
                    continue
                print ('Update from', experiment_uid)

                try:
                    data = json.loads(data.decode('utf-8'))
                except Exception as e:
                    print("Exception parsing json: ", e)
                    return

                if 'type' in data:
                    if data['type'] == 'whoami':
                        name = data['name']
                        print ("experiment discovered: ", name);
                        self.uuid_to_name[experiment_uid] = name

                # ask new experiment for introduction
                if self.uuid_to_name.get(experiment_uid) is None:
                    self.r.publish("callcenter_" + experiment_uid, json.dumps({ 'name': 'whoami'}))


            time.sleep(0.01)

    def run_in_a_thread(self):
        t = Thread(target=self.run)
        t.setDaemon(True)
        t.start()
        return t


instance = [None]

def initialize_up(redis):
    instance[0] = UpdateProcessor(redis)

def get_up():
    return instance[0]
