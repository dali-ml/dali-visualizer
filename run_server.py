"""
Main server for Dali visualization

@author Jonathan Raiman
@date 12th April 2015

see here for inspiration:
http://blog.kristian.io/post/47460001334/sockjs-and-tornado-for-python-real-time-web-projects/
"""
from dali_visualizer import RedisVisualizer
from tooltip_jslib import check_and_download

from sys import argv as ARGV
import sys
import os
from os.path import join, dirname, abspath

if __name__ == "__main__":
    if not check_and_download(
            js=join(join(join(dirname(abspath(__file__)), "dali_visualizer"), "js"), "vendor"),
            css=join(join(join(join(dirname(abspath(__file__)), "dali_visualizer"), "static"), "css"), "vendor")
        ):
        print("""
            Could not download Tooltip library.
            """)
        sys.exit()

    server = RedisVisualizer(
        socket_path = "/updates",
        websockets  = True,
        exit_gracefully = True
    )
    server.start(
        port = 8000 if len(ARGV) < 2 else int(ARGV[1])
    )
