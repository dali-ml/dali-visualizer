Dali Visualizer
===============

Provides a visualization web frontend for the [Dali automatic differentation library](http://github.com/JonathanRaiman/recurrentjs). Allows you to see a model optimize in real time, see the predictions, and collect your results into one window.

### Dependencies

* [Python 3](https://www.python.org/download/releases/3.0/)
* [Redis](http://redis.io)
* [Dali](http://github.com/JonathanRaiman/recurrentjs)

### Installation

To run this visualizer you need to build the javascript files,
launch redis, and start a python server that uses tornado.
To install the dependencies for Javascript and Python run
these commands:

```bash
pip3 install -r requirements
cd dali-visualizer
npm install
gulp
```

### Run visualizer

Start the server from top-level directory:

```bash
python3 run_server.py
```

And now head to [localhost:8000](http://localhost:8000)!
