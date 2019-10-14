"""Flask App Project."""

from flask import Flask, render_template
from carculator import *

app = Flask(__name__)

@app.route('/')
def index():
    """Return homepage."""
    return render_template('index.html')

if __name__ == '__main__':
    app.run()
