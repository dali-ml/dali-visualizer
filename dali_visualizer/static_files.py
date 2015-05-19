"""
Expose to tornado the routes for loading JS, CSS, and HTML
files from the static folder in this project.
"""
import os
import datetime
import time

from tornado.web import StaticFileHandler, RequestHandler, HTTPError
from react.jsx import JSXTransformer, TransformError

server_dir  = os.path.abspath(os.path.dirname(__file__))
index_route = os.path.join(server_dir, 'static/html/index.html')

class NoCacheStaticFileHandler(StaticFileHandler):
    """ Request static file handlers for development and debug only.
    It disables any caching for static file.
    """
    @classmethod
    def _get_cached_version(cls, abs_path):
        return None

class IndexHandler(RequestHandler):
    def initialize(self, debug=False):
        self.debug = debug

    def get(self):
        self.render(index_route, debug=self.debug)

class ReactHandler(StaticFileHandler):
    def initialize(self, path):
        self.root = os.path.abspath(path) + os.path.sep
        self.jsx  = JSXTransformer()
        self.settings.setdefault('compiled_template_cache', False)

    def try_transform(self, abspath):
        try:
            self.jsx.transform(abspath + "x", js_path=abspath)
        except Exception as e:
            raise HTTPError(500, "Could not transform %s into a JS file. %s" % (os.path.basename(abspath + "x"), str(e)))

    def get(self, path, **kwargs):
        """
        Transform the JSX online as they change.
        """
        if os.path.sep != "/":
            path = path.replace("/", os.path.sep)
        abspath = os.path.abspath(os.path.join(self.root, path))
        self.absolute_path = abspath
        # some default errors:
        if not (abspath + os.path.sep).startswith(self.root):
            raise HTTPError(403, "%s is not in root static directory", path)
        if not os.path.exists(abspath):
            # special case, check if jsx file exists.
            if abspath.endswith(".js") and os.path.exists(abspath + "x"):
                self.try_transform(abspath)
                # transformation to JS was successful.
            else:
                raise HTTPError(404)
        if not os.path.isfile(abspath):
            raise HTTPError(403, "%s is not a file", path)

        if abspath.endswith(".js") and os.path.exists(abspath + "x"):
            if os.path.getmtime(abspath + "x") > os.path.getmtime(abspath):
                # more recent JSX file than JS
                self.try_transform(abspath)
            # else the generated file is recent enough
        template_path = self.get_template_path()
        if not template_path:
            template_path = os.path.dirname(os.path.abspath(__file__))
        loader = RequestHandler._template_loaders[template_path]
        return super(ReactHandler, self).get(path, **kwargs)

    @classmethod
    def _get_cached_version(cls, abs_path):
        return None

def generate_routes(debug=False):
    return [
        (r"/", IndexHandler, {'debug': debug}),
        (r"/css/(.*)", NoCacheStaticFileHandler, {'path': os.path.join(server_dir, 'static/css/')}),
        (r"/materialize/(.*)", StaticFileHandler, {'path': os.path.join(server_dir, 'static/materialize/')}),
        (r"/js/(.*)", ReactHandler, {'path': os.path.join(server_dir, 'js/')})
    ]

__all__ = ["generate_routes"]
