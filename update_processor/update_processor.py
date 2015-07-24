import datetime
import json
import sched
import time
import pytz

from collections import defaultdict
from threading import Thread

from dali_visualizer.socket_connection import Connection


class UpdateProcessor(object):
    def __init__(self, redis):
        self.r = redis
        self.p = None
        self.experiments = defaultdict(lambda: {})
        self.events = sched.scheduler()

    def available_channels(self):
        res = []
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

    def maybe_expire_expriment(self, uuid):
        now = datetime.datetime.now()
        last_heartbeat = self.experiments[uuid]['last_heartbeat']
        if now - last_heartbeat > datetime.timedelta(seconds = 1.9):
            del self.experiments[uuid]
            Connection.announance_new_experiments(self.available_channels())

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
                self.events.enter(2, 2, self.maybe_expire_expriment, (experiment_uid,))

                try:
                    data = json.loads(data.decode('utf-8'))
                except Exception as e:
                    print("Exception parsing json: ", e)
                    return

                if 'type' in data:
                    if data['type'] == 'whoami':
                        exp = self.experiments[experiment_uid];
                        name = data['name']
                        exp['name'] =  name
                        if 'created' not in exp:
                            exp['created'] = datetime.datetime.now()
                        Connection.announance_new_experiments(self.available_channels())

                # ask new experiment for introduction
                if 'name' not in self.experiments.get(experiment_uid):
                    self.r.publish("callcenter_" + experiment_uid, json.dumps({ 'name': 'whoami'}))

            time.sleep(0.01)

    def run_event_queue(self):
        while True:
            time.sleep(0.01)
            self.events.run()


    def run_in_a_thread(self):
        t = Thread(target=self.run_message_processor)
        t.setDaemon(True)
        t.start()
        eq = Thread(target=self.run_event_queue)
        eq.setDaemon(True)
        eq.start()

instance = [None]

def initialize_up(redis):
    instance[0] = UpdateProcessor(redis)

def get_up():
    return instance[0]
