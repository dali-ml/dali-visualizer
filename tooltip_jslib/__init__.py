"""
Utility class for grabbing and using the JS, CSS, and Fonts libraries

Tooltip available at:

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
    """
    Url is the destination url desired, and directory
    is where the download should be stored. If url is
    a tuple then it is assumed to be in the format:

        (url, desired_filename)

    Inputs
    ------

    url str/tuple : location of download (optional name for
        retrieved file)
    directory str : where to store download

    Outputs
    -------

    status   bool : True if download / retrieval succeeded
        or file exists already.

    """
    if type(url) is tuple:
        url, destfilename = url
        if "/" in destfilename:
            subpaths = destfilename.split("/")
            destfilename = subpaths[-1]
            for subpath in subpaths[:-1]:
                directory = os.path.join(directory, subpath)
    else:
        destfilename = url.split("/")[-1]
    status = False
    if directory is not None:
        os.makedirs(directory, exist_ok=True)
    if directory is not None and os.path.exists(directory) and os.path.isdir(directory):
        status = download_and_check(os.path.join(directory, destfilename), url)

        if not status:
            return status
    return status

__all__ = ["check_and_download"]
