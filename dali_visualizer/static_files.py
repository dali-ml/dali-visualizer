"""
Expose to tornado the routes for loading JS, CSS, and HTML
files from the static folder in this project.
"""
import os
from tornado.web import StaticFileHandler, RequestHandler, HTTPError
import datetime
import time
from react.jsx import JSXTransformer, TransformError

server_dir  = os.path.abspath(os.path.dirname(__file__))
index_route = os.path.join(server_dir, 'static/html/index.html')

class NoCacheStaticFileHandler(StaticFileHandler):
    """ Request static file handlers for development and debug only.
    It disables any caching for static file.
    """
    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'no-cache, must-revalidate')
        self.set_header('Expires', '0')
        now = datetime.datetime.now()

        if os.path.sep != "/":
            path = path.replace("/", os.path.sep)
        abspath = os.path.abspath(os.path.join(self.root, path))
        self.set_header('Last-Modified', time.ctime(os.path.getmtime(abspath)))

class IndexHandler(RequestHandler):
    def get(self):
        self.render(index_route)

class ReactHandler(RequestHandler):
    def initialize(self, path):
        self.root = os.path.abspath(path) + os.path.sep
        self.jsx  = JSXTransformer()

    def get(self, path):
        """
        Transform the JSX online as they change.
        """
        if os.path.sep != "/":
            path = path.replace("/", os.path.sep)
        abspath = os.path.abspath(os.path.join(self.root, path))
        # some default errors:
        if not (abspath + os.path.sep).startswith(self.root):
            raise HTTPError(403, "%s is not in root static directory", path)
        if not os.path.exists(abspath):
            # special case, check if jsx file exists.
            if abspath.endswith(".js") and os.path.exists(abspath + "x"):
                try:
                    self.jsx.transform(abspath + "x", js_path=abspath)
                except Exception as e:
                    raise HTTPError(500, "Could not transform %s into a JS file. %s" % (os.path.basename(abspath + "x"), str(e)))
                # transformation to JS was successful.
            else:
                raise HTTPError(404)
        if not os.path.isfile(abspath):
            raise HTTPError(403, "%s is not a file", path)

        if abspath.endswith(".js") and os.path.exists(abspath + "x"):
            if os.path.getmtime(abspath + "x") > os.path.getmtime(abspath):
                # more recent JSX file than JS
                try:
                    self.jsx.transform(abspath + "x", js_path=abspath)
                except Exception as e:
                    raise HTTPError(500, "Could not transform %s into a JS file. %s" % (os.path.basename(abspath + "x"), str(e)))
            # else the generated file is recent enough
        self.render(abspath)
        self.set_extra_headers(path)

    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'no-cache, must-revalidate')
        self.set_header('Expires', '0')
        now = datetime.datetime.now()
        expiration = datetime.datetime(now.year-1, now.month, now.day)
        self.set_header('Last-Modified', expiration)

routes = [
            (r"/", IndexHandler),
            (r"/css/(.*)", NoCacheStaticFileHandler, {'path': os.path.join(server_dir, 'static/css/')}),
            (r"/materialize/(.*)", StaticFileHandler, {'path': os.path.join(server_dir, 'static/materialize/')}),
            (r"/js/(.*)", ReactHandler, {'path': os.path.join(server_dir, 'js/')})
        ]

__all__ = ["routes"]
