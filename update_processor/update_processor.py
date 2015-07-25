import datetime
import json
import time
import pytz

from collections import defaultdict
from threading import Thread, Lock

from dali_visualizer.socket_connection import Connection


class UpdateProcessor(object):
    def __init__(self, redis):
        self.r = redis
        self.p = None
        self.experiments = defaultdict(lambda: {})
        self.experiments_lock = Lock()

    def available_channels(self):
        res = []
        with self.experiments_lock:
            for uuid, experiment in self.experiments.items():
                name = experiment.get('name')

                if name is not None:
                    creation_ts_utc = experiment.get('created') \
                            .replace(tzinfo=pytz.UTC).timestamp()
                    res.append({
                        'name' : name,
                        'created' : creation_ts_utc,
                        'uuid' : uuid
                    })
        return res

    def run_message_processor(self):
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

                experiment_data = self.experiments[experiment_uid]
                experiment_data['last_heartbeat'] = datetime.datetime.now()

                try:
                    data = json.loads(data.decode('utf-8'))
                except Exception as e:
                    print("Exception parsing json: ", e)
                    return

                if 'type' in data:
                    if data['type'] == 'whoami':
                        with self.experiments_lock:
                            exp = self.experiments[experiment_uid];
                        name = data['name']
                        exp['name'] =  name
                        if 'created' not in exp:
                            exp['created'] = datetime.datetime.now()
                        Connection.announce_new_experiments(self.available_channels())

                # ask new experiment for introduction
                if 'name' not in self.experiments.get(experiment_uid):
                    self.r.publish("callcenter_" + experiment_uid, json.dumps({ 'name': 'whoami'}))

            time.sleep(0.01)

    def expiration_worker(self):
        while True:
            time.sleep(0.5)
            now = datetime.datetime.now()
            expired_experiments = []
            with self.experiments_lock:
                for experiment_uuid in self.experiments:
                    last_heartbeat = self.experiments[experiment_uuid]['last_heartbeat']
                    if now - last_heartbeat > datetime.timedelta(seconds = 1.9):
                        expired_experiments.append(experiment_uuid)

                for experiment_uuid in expired_experiments:
                    del self.experiments[experiment_uuid]

            if len(expired_experiments) > 0:
                Connection.announce_new_experiments(self.available_channels())


    def run_in_a_thread(self):
        t = Thread(target=self.run_message_processor)
        t.setDaemon(True)
        t.start()
        eq = Thread(target=self.expiration_worker)
        eq.setDaemon(True)
        eq.start()

instance = [None]

def initialize_up(redis):
    instance[0] = UpdateProcessor(redis)

def get_up():
    return instance[0]
