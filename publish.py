#!/usr/bin/python
# -*- coding: utf-8 -*-

def execute_command(command, content):
    import subprocess
    pipe = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE,
                            stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = pipe.communicate(content)
    if stderr.strip():
        raise BaseException(stderr)
    return stdout

def compress_js(js, do_wrap, do_minify):
    from slimit import minify
    return minify(js, do_wrap, do_minify)

def compress_css(css):
    command = '/usr/bin/env cssmin'
    return execute_command(command, css)

CONFIG = {
    'js':{
        'source': (
	    ['calcip_app/static/js/jquery-2.1.1.js', True, True],
            ['calcip_app/static/js/jquery.autocomplete.js',True,True],
            ['calcip_app/static/js/underscore-min.js',True,True],
            ['calcip_app/static/bootstrap/js/bootstrap.js',True,True],
	    ['calcip_app/static/js/crypto/core.js',False,True],
	    ['calcip_app/static/js/crypto/sha1.js',False,True],
            ['calcip_app/static/js/crypto/md5.js',False,True],
            ['calcip_app/static/js/crypto/php-crypt-md5.js',False,True],
            ['calcip_app/static/js/crypto/enc-base64.js',False,True],
            ['calcip_app/static/js/calcip_core.js',True,True],
            ['calcip_app/static/js/calcip.js',True,True]
        ),
        'output': 'calcip_app/static/js/calcip.min.js',
    },
    'css':{
        'source': (
            'calcip_app/static/bootstrap/css/bootstrap.css',
            'calcip_app/static/css/calcip.css'
        ),
        'output': 'calcip_app/static/css/calcip.min.css'
    }
}
with open(CONFIG['js']['output'], 'w') as js_min_file:
    for js_file_item in CONFIG['js']['source']:
        js_file = open(js_file_item[0], 'rb')
        source_code = js_file.read()
        js_file.close()
        js_min_source_code = compress_js(source_code, js_file_item[1], js_file_item[2])
        js_min_file.write(js_min_source_code)

with open(CONFIG['css']['output'], 'w') as css_min_file:
    for css_file_name in CONFIG['css']['source']:
        css_file = open(css_file_name, 'rb')
        source_code = css_file.read()
        css_file.close()
        css_min_source_code = compress_css(source_code)
        css_min_file.write(css_min_source_code)
