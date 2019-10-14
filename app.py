"""Flask App Project."""

from flask import Flask, jsonify
from carculator import *
app = Flask(__name__)


@app.route('/')
def index():
    """Return homepage."""

    json_data = {'Hello': 'World'}
    return jsonify(json_data)

@app.route('/ttw')
def get_ttw():
    cip = CarInputParameters()
    cip.static()
    dcts, array = fill_xarray_from_input_parameters(cip)
    cm = CarModel(array, cycle='WLTC')
    cm.set_all()
    ttw_energy = cm.array.sel(parameter='TtW energy', year=2017).values.tolist()
    json_data = {'TtW energy': ttw_energy}
    return jsonify(json_data)

if __name__ == '__main__':
    app.run()
