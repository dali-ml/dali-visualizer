"""
Utility class for grabbing and using the Tooltip library
from https://github.com/darsain/tooltip

Available at:

* js: http://darsain.github.io/tooltip/dist/tooltip.min.js
* css: http://darsain.github.io/tooltip/dist/tooltip.css

"""
import os
from urllib.request import urlretrieve, HTTPError

def download_and_check(fname, url):
    if os.path.exists(fname) and os.path.isfile(fname):
        return True
    else:
        try:
            urlretrieve(url, fname)
            assert(os.path.exists(fname) and os.path.isfile(fname)), "Could not download file \"%s\" from \"%s\"" % (fname, url)
            return True
        except HTTPError:
            return False

def check_and_download(js=None, css=None):
    """
    Check for installation of the Tooltip library in the folder
    js, and the folder css.

    Inputs
    ------

    js  str : directory to put JS file in
    css str : directory to put CSS file in

    Outputs
    -------

    status bool : success of retrieval
    """
    status = False
    if js is not None and os.path.exists(js) and os.path.isdir(js):
        status = download_and_check(os.path.join(js, "tooltip.min.js"), "http://darsain.github.io/tooltip/dist/tooltip.min.js")
        if not status:
            return status
    if css is not None and os.path.exists(css) and os.path.isdir(css):
        status = download_and_check(os.path.join(css, "tooltip.css"), "http://darsain.github.io/tooltip/dist/tooltip.css")
        if not status:
            return status
    return status

__all__ = ["check_and_download"]
