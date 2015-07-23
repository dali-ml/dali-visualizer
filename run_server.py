"""
Main server for Dali visualization

@author Jonathan Raiman
@date 12th April 2015

see here for inspiration:
http://blog.kristian.io/post/47460001334/sockjs-and-tornado-for-python-real-time-web-projects/
"""

import sys
import os

from os.path import join, dirname, abspath
from redis import StrictRedis

from dali_visualizer.utils import parse_args
from update_processor import UpdateProcessor
from dali_visualizer import RedisVisualizer
from tooltip_jslib import check_and_download

if __name__ == "__main__":
    args = parse_args()
    if args.debug:
        print('Running a debug version')

    JS_DIR  = join(join(join(dirname(abspath(__file__)), "dali_visualizer"), "js"), "vendor")
    CSS_DIR = join(join(join(join(dirname(abspath(__file__)), "dali_visualizer"), "static"), "css"), "vendor")
    FONT_DIR = join(join(join(join(dirname(abspath(__file__)), "dali_visualizer"), "static"), "css"), "font")

    if args.debug:
        react_url = "https://cdnjs.cloudflare.com/ajax/libs/react/0.13.3/react-with-addons.js"
    else:
        react_url = "https://cdnjs.cloudflare.com/ajax/libs/react/0.13.3/react-with-addons.min.js"
    js_libs = [
        "http://darsain.github.io/tooltip/dist/tooltip.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js",
        react_url,
        "https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/0.3.4/sockjs.min.js"
    ]

    css_libs = [
        "http://darsain.github.io/tooltip/dist/tooltip.css",
        "https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.1/css/materialize.min.css"
    ]


    font_libs = [
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-thin-webfont.woff", "roboto/Roboto-Thin.woff"),
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-thin-webfont.ttf", "roboto/Roboto-Thin.ttf"),
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-medium-webfont.woff", "roboto/Roboto-Medium.woff"),
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-medium-webfont.ttf", "roboto/Roboto-Medium.ttf"),
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-light-webfont.woff", "roboto/Roboto-Light.woff"),
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-light-webfont.ttf", "roboto/Roboto-Light.ttf"),
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-regular-webfont.woff", "roboto/Roboto-Regular.woff"),
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-regular-webfont.ttf", "roboto/Roboto-Regular.ttf"),
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-bold-webfont.woff", "roboto/Roboto-Bold.woff"),
        ("https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.7/fonts/Roboto/roboto-bold-webfont.ttf", "roboto/Roboto-Bold.ttf"),
        ("https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.1/font/material-design-icons/Material-Design-Icons.ttf",
                "material-design-icons/Material-Design-Icons.ttf"),
        ("https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.1/font/material-design-icons/Material-Design-Icons.woff",
                "material-design-icons/Material-Design-Icons.woff"),
    ]

    got_js  = all([check_and_download(url, JS_DIR) for url in js_libs])
    got_css = all([check_and_download(url, CSS_DIR) for url in css_libs])
    got_fonts = all([check_and_download(url, FONT_DIR) for url in font_libs])


    if not got_js or not got_css or not got_fonts:
        print("""
            Could not download Javascript, CSS, and Font support files.
            """)
        sys.exit()

    server = RedisVisualizer(
        socket_path = "/updates",
        websockets  = True,
        exit_gracefully = True,
        redis_host      = args.redis_host,
        redis_port      = args.redis_port,
        debug = args.debug
    )

    redis = StrictRedis(args.redis_host, args.redis_port)
    up = UpdateProcessor(redis)
    up.run_in_a_thread()

    server.start(
        port = args.port
    )
