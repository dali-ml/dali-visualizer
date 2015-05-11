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

    JS_DIR = join(join(join(dirname(abspath(__file__)), "dali_visualizer"), "js"), "vendor")
    CSS_DIR = join(join(join(join(dirname(abspath(__file__)), "dali_visualizer"), "static"), "css"), "vendor")

    got_js = check_and_download(
        "http://darsain.github.io/tooltip/dist/tooltip.min.js",
        JS_DIR
    )
    got_css = check_and_download(
        "http://darsain.github.io/tooltip/dist/tooltip.css",
        CSS_DIR
    )

    got_d3_js = check_and_download(
        "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js",
        JS_DIR
    )

    if not got_js or not got_css or not got_d3_js:
        print("""
            Could not download Javascript and CSS support files.
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
