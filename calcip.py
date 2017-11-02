#!../env/bin/python
# -*- coding: utf-8 -*-
from flup.server.fcgi import WSGIServer

def calcip_app(environ, start_response):
    remote_ip = environ.get('REMOTE_ADDR', '')
    try:
        with open('index.html', 'r') as index_page_file:
            index_page = index_page_file.read().decode('utf8')
            index_page = index_page.replace(u'<div id="ip_address"></div>', u'<div id="ip_address">%s</div>' % remote_ip).encode('utf8')
            start_response('200 OK', [('Content-Type', 'text/html')])
            return ['%s\n' % index_page]
    except IOError:
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        return ['Internal Server Error']

if __name__ == '__main__':
    WSGIServer(calcip_app).run()