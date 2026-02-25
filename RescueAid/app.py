from flask import Flask, render_template, send_from_directory, make_response
from werkzeug.wrappers import Response
import os

app = Flask(__name__)

@app.route('/')
def home():
    response = make_response(render_template('index.html'))
    response.headers['Cache-Control'] = 'public, max-age=3600'
    response.headers['Content-Type'] = 'text/html; charset=utf-8'
    return response

@app.route('/sw.js')
def sw():
    response = send_from_directory('.', 'sw.js')
    response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    # Service Worker must always check for updates
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# Serve static files (CSS, JS, JSON)
@app.route('/static/<path:filename>')
def serve_static(filename):
    response = send_from_directory('static', filename)
    # Set CORS headers to allow service worker to cache
    response.headers['Access-Control-Allow-Origin'] = '*'
    # Cache static assets for 1 year
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    
    # Set proper MIME types
    if filename.endswith('.css'):
        response.headers['Content-Type'] = 'text/css; charset=utf-8'
    elif filename.endswith('.js'):
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    elif filename.endswith('.json'):
        response.headers['Content-Type'] = 'application/json; charset=utf-8'
    elif filename.endswith('.png'):
        response.headers['Content-Type'] = 'image/png'
    
    return response

if __name__ == '__main__':
    # Run on localhost for service worker compatibility
    app.run(host='127.0.0.1', port=9000, debug=False)