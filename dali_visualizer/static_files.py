"""
Expose to tornado the routes for loading JS, CSS, and HTML
files from the static folder in this project.
"""
import os
from tornado.web import StaticFileHandler, RequestHandler

server_dir  = os.path.abspath(os.path.dirname(__file__))
index_route = os.path.join(server_dir, 'static/html/index.html')

class IndexHandler(RequestHandler):
    def get(self):
        self.render(index_route)

routes = [
            (r"/", IndexHandler),
            (r"/css/(.*)", StaticFileHandler, {'path': os.path.join(server_dir, 'static/css/')}),
            (r"/js/(.*)", StaticFileHandler,  {'path': os.path.join(server_dir, 'static/js/')})
        ]

__all__ = ["routes"]
