"""
Main server for Dali visualization

@author Jonathan Raiman
@date 12th April 2015

see here for inspiration:
http://blog.kristian.io/post/47460001334/sockjs-and-tornado-for-python-real-time-web-projects/
"""
from dali_visualizer import RedisVisualizer
from sys import argv as ARGV
import sys

if __name__ == "__main__":
    server = RedisVisualizer(
        socket_path = "/updates",
        websockets  = True,
        exit_gracefully = True
    )
    server.start(
        port = 8000 if len(ARGV) < 2 else int(ARGV[1])
    )
