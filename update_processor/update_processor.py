import time

from threading import Thread

class UpdateProcessor(object):
    def __init__(self, redis):
        self.r = redis
        self.p = None

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
            time.sleep(0.01)

    def run_in_a_thread(self):
        t = Thread(target=self.run)
        t.setDaemon(True)
        t.start()
        return t
