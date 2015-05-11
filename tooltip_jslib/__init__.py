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

def check_and_download(url, directory):
    status = False
    if directory is not None and os.path.exists(directory) and os.path.isdir(directory):
        status = download_and_check(os.path.join(directory, url.split("/")[-1]), url)
        if not status:
            return status
    return status

__all__ = ["check_and_download"]
