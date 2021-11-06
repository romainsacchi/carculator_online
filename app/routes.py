"""Flask App Project."""

import os
import datetime
import math
import mimetypes
import pickle
import uuid
import numpy as np
from flask import (
    Response,
    flash,
    json,
    jsonify,
    make_response,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_babel import _
from flask_login import current_user, login_required, login_user, logout_user
from rq import Queue
from rq.job import Job, NoSuchJobError
from werkzeug.urls import url_parse

from app import app
from app import db
from app.forms import LoginForm, RegistrationForm
from app.models import Task, User
from .calculation import Calculation
from .email_support import email_out
from .worker import conn

app.calc = Calculation()
app.progress_status = 0

############## Maintenance mode ######################
IS_MAINTENANCE_MODE = False
# Always throw a 503 during maintenance: http://is.gd/DksGDm
@app.before_request
def check_for_maintenance():
    if IS_MAINTENANCE_MODE and request.path != url_for("maintenance"):
        return redirect(url_for("maintenance"))
    return


######################################################


@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            first_name=form.first_name.data,
            last_name=form.last_name.data,
            country=form.country.data,
            email=form.email.data,
            organisation=form.organisation.data,
            newsletter=form.newsletter.data,
        )
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash(_("Congratulations, you are now a registered user!"))
        return redirect(url_for("login"))
    return render_template("register.html", title="Register", form=form)


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(session.get("url", url_for("start")))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash(_("Invalid username or password"))
            return redirect(url_for("login"))
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get("next", url_for("start"))

        if not next_page or url_parse(next_page).netloc != "":
            if "url" in session:
                next_page = session.get("url", url_for("start"))
            else:
                next_page = url_for("start")
        return redirect(next_page)
    return render_template("login.html", title="Sign In", form=form)


@app.route("/logout")
def logout():
    logout_user()
    return redirect(session.get("url", url_for("start")))


if not os.environ.get("IS_HEROKU", None) is None:

    @app.before_request
    def before_request():
        if not request.is_secure:
            url = request.url.replace("http://", "https://", 1)
            code = 301
            return redirect(url, code=code)
        return


@app.route("/")
def index():
    """Return homepage."""
    lang = session.get("language", "en")
    session["url"] = url_for("index")
    return render_template("index.html", lang=lang)


@app.route("/start")
def start():
    """Return start page."""
    session["url"] = url_for("start")
    return render_template("start.html")


@app.route("/new_car", defaults={"country": None})
@app.route("/new_car/<country>")
def new_car(country):
    """Return new_car page."""
    session["url"] = url_for("new_car") + "/" + country
    powertrains = [
        _("Petrol"),
        _("Diesel"),
        _("CNG"),
        _("Electric"),
        _("Fuel cell"),
        _("Hybrid-petrol"),
        _("Hybrid-diesel"),
        _("(Plugin) Hybrid-petrol"),
        _("(Plugin) Hybrid-diesel"),
    ]
    sizes = [
        _("Minicompact"),
        _("Subcompact"),
        _("Compact"),
        _("Mid-size"),
        _("Large"),
        _("SUV"),
        _("Van"),
    ]

    vehicles = [x + ", " + y for x in powertrains for y in sizes]

    return render_template(
        "new_car.html",
        country=country,
        vehicles=vehicles,
        lang=session.get("language", "en"),
    )


def get_car_repl_data(country, cycle):
    filepath = f"data/car replacement data/{cycle}_{country}.pickle"
    with open(filepath, "rb") as pickled_data:
        data = pickle.load(pickled_data)

    return data


@app.route("/fetch_car_repl_results/<country>/<cycle>")
def fetch_car_repl_results(country, cycle):
    arr = get_car_repl_data(country, cycle)

    response = arr.sel(value=0).to_dict()

    return jsonify(response)


@app.route("/tool", defaults={"country": None})
@app.route("/tool/<country>")
@login_required
def tool_page(country):
    """Return tool page"""
    if not current_user.is_authenticated:
        if country is None:
            session["url"] = url_for("tool_page")
        else:
            session["url"] = url_for("tool_page") + "/" + country

    if country is None:
        config = {"config": "false"}

    else:
        if country in app.calc.electricity_mix.country.values:
            response = (
                app.calc.electricity_mix.loc[
                    dict(
                        country=country,
                        variable=[
                            "Hydro",
                            "Nuclear",
                            "Gas",
                            "Solar",
                            "Wind",
                            "Biomass",
                            "Coal",
                            "Oil",
                            "Geothermal",
                            "Waste",
                            "Biogas CCS",
                            "Biomass CCS",
                            "Coal CCS",
                            "Gas CCS",
                            "Wood CCS",
                        ],
                    )
                ]
                .interp(
                    year=np.arange(2020, 2036), kwargs={"fill_value": "extrapolate"}
                )
                .values
            )
        else:
            response = (
                app.calc.electricity_mix.loc[
                    dict(
                        country="RER",
                        variable=[
                            "Hydro",
                            "Nuclear",
                            "Gas",
                            "Solar",
                            "Wind",
                            "Biomass",
                            "Coal",
                            "Oil",
                            "Geothermal",
                            "Waste",
                            "Biogas CCS",
                            "Biomass CCS",
                            "Coal CCS",
                            "Gas CCS",
                            "Wood CCS",
                        ],
                    )
                ]
                .interp(
                    year=np.arange(2020, 2036), kwargs={"fill_value": "extrapolate"}
                )
                .values
            )

        response = np.round(
            np.true_divide(response.T, response.sum(axis=1)).T, 2
        ).tolist()

        # Returns average share of biogasoline according to historical IEA stats
        if country in app.calc.biogasoline.country.values:
            share_biogasoline = np.squeeze(
                np.clip(
                    app.calc.biogasoline.sel(country=country, variable="value")
                    .interp(year=[2020], kwargs={"fill_value": "extrapolate"})
                    .values,
                    0,
                    1,
                )
            )
            share_biogasoline = share_biogasoline.reshape(1)
        else:
            share_biogasoline = 0

        # Returns average share of biodiesel according to historical IEA stats
        if country in app.calc.biodiesel.country.values:
            share_biodiesel = np.squeeze(
                np.clip(
                    app.calc.biodiesel.sel(country=country, variable="value")
                    .interp(year=[2020], kwargs={"fill_value": "extrapolate"})
                    .values,
                    0,
                    1,
                )
            )
            share_biodiesel = share_biodiesel.reshape(1)
        else:
            share_biodiesel = 0

        # Returns average share of biomethane according to historical IEA stats
        if country in app.calc.biomethane.country.values:
            share_biomethane = np.squeeze(
                np.clip(
                    app.calc.biomethane.sel(country=country, variable="value")
                    .interp(year=[2020], kwargs={"fill_value": "extrapolate"})
                    .values,
                    0,
                    1,
                )
            )
            share_biomethane = share_biomethane.reshape(1)
        else:
            share_biomethane = np.array(0)

        config = {
            "year": ["2020"],
            "type": ["ICEV-p", "ICEV-d", "ICEV-g", "BEV"],
            "size": ["Medium"],
            "driving_cycle": "WLTC",
            "fu": {"unit": "vkm", "quantity": 1},
            "foreground params": {
                "passenger-slider": "1.5",
                "cargo-slider": "20",
                "lifetime-slider": "200 000",
                "mileage-slider": "12 000",
            },
            "background params": {
                "country": country,
                "fuel blend": {
                    "petrol": {
                        "primary fuel": {
                            "type": "petrol",
                            "share": np.round((1.0 - share_biogasoline), 2).tolist(),
                        },
                        "secondary fuel": {
                            "type": "bioethanol - wheat straw",
                            "share": np.round(share_biogasoline, 2).tolist(),
                        },
                    },
                    "diesel": {
                        "primary fuel": {
                            "type": "diesel",
                            "share": np.round((1.0 - share_biodiesel), 2).tolist(),
                        },
                        "secondary fuel": {
                            "type": "biodiesel - cooking oil",
                            "share": np.round(share_biodiesel, 2).tolist(),
                        },
                    },
                    "cng": {
                        "primary fuel": {
                            "type": "cng",
                            "share": np.round((1.0 - share_biomethane), 2).tolist(),
                        },
                        "secondary fuel": {
                            "type": "biogas - sewage sludge",
                            "share": np.round(share_biomethane, 2).tolist(),
                        },
                    },
                },
                "energy storage": {
                    "electric": {
                        "Medium": {
                            "type": "NMC-111",
                            "origin": "CN",
                            "energy battery mass": [400],
                            "battery cell energy density": [0.2],
                            "battery lifetime kilometers": [200000],
                        }
                    }
                },
                "efficiency": {
                    "ICEV-p": {
                        "Medium": {
                            "engine efficiency": [0.27],
                            "drivetrain efficiency": [0.81],
                        }
                    },
                    "ICEV-d": {
                        "Medium": {
                            "engine efficiency": [0.3],
                            "drivetrain efficiency": [0.81],
                        }
                    },
                    "ICEV-g": {
                        "Medium": {
                            "engine efficiency": [0.26],
                            "drivetrain efficiency": [0.81],
                        }
                    },
                    "BEV": {
                        "Medium": {
                            "engine efficiency": [0.85],
                            "drivetrain efficiency": [0.85],
                            "battery discharge efficiency": [0.88],
                        }
                    },
                },
                "custom electricity mix": response,
            },
        }

    powertrains = [
        _("Petrol"),
        _("Diesel"),
        _("CNG"),
        _("Electric"),
        _("Fuel cell"),
        _("Hybrid-petrol"),
        _("Hybrid-diesel"),
        _("(Plugin) Hybrid-petrol"),
        _("(Plugin) Hybrid-diesel"),
    ]
    sizes = [
        _("Minicompact"),
        _("Subcompact"),
        _("Compact"),
        _("Mid-size"),
        _("Large"),
        _("SUV"),
        _("Van"),
    ]
    years = range(2000, 2051)
    driving_cycles = [
        "WLTC",
        "WLTC 3.1",
        "WLTC 3.2",
        "WLTC 3.3",
        "WLTC 3.4",
        "CADC Urban",
        "CADC Road",
        "CADC Motorway",
        "CADC Motorway 130",
        "CADC",
        "NEDC",
    ]
    return render_template(
        "tool.html",
        powertrains=powertrains,
        sizes=sizes,
        years=years,
        driving_cycles=driving_cycles,
        config=config,
    )


@app.route("/search_car_model/<search_item>")
def search_car_model(search_item):
    """ Return a list of cars if cars contain `search item`"""
    lang = session.get("language", "en")
    cars = [
        car
        for car in app.calc.load_map_file(lang)
        if any(search_item.lower() in x.lower() for x in car)
    ]
    return jsonify(cars[:5])


@app.route("/direct_results")
def direct_results():
    """ This function is meant to produce quick results for all available countries and store them as pickles.
        This allows to prevent a full calculation when results are accessed through the 'Simple' mode.
        It is to be run every time substantial changes are made to 'carculator'."""

    countries = [
        "AT",
        "AU",
        "BE",
        "BG",
        "BR",
        "CA",
        "CH",
        "CL",
        "CN",
        "CY",
        "CZ",
        "DE",
        "DK",
        "EE",
        "ES",
        "FI",
        "FR",
        "GB",
        "GR",
        "HR",
        "HU",
        "IE",
        "IN",
        "IT",
        "IS",
        "JP",
        "LT",
        "LU",
        "LV",
        "MT",
        "PL",
        "PT",
        "RO",
        "RU",
        "SE",
        "SI",
        "SK",
        "US",
        "ZA",
        "AO",
        "BF",
        "BI",
        "BJ",
        "BW",
        "CD",
        "CF",
        "CG",
        "CI",
        "CM",
        "DJ",
        "DZ",
        "EG",
        "ER",
        "ET",
        "GA",
        "GH",
        "GM",
        "GN",
        "GQ",
        "GW",
        "KE",
        "LR",
        "LS",
        "LY",
        "MA",
        "ML",
        "MR",
        "MW",
        "MZ",
        "NE",
        "NG",
        "NL",
        "NM",
        "RW",
        "SD",
        "SL",
        "SN",
        "SO",
        "SS",
        "SZ",
        "TD",
        "TG",
        "TN",
        "TZ",
        "UG",
        "ZM",
        "ZW",
        "NO",
    ]

    dic_uuids = {}

    for country in countries:
        job_id = str(uuid.uuid1())

        dic_uuids[job_id] = country

        # Add task to db
        task = Task(id=job_id, progress=0,)
        db.session.add(task)
        db.session.commit()

        params_dict = {
            ("Functional unit",): {
                "powertrain": ["ICEV-p", "ICEV-d", "ICEV-g", "BEV"],
                "year": [2020],
                "size": ["Medium"],
                "fu": {"unit": "vkm", "quantity": 1},
            },
            ("Driving cycle",): "WLTC",
            ("Background",): {"country": country},
            ("Foreground",): {
                ("Glider", "all", "all", "average passengers", "none"): {
                    (2020, "loc"): 1.5
                },
                ("Glider", "all", "all", "cargo mass", "none"): {(2020, "loc"): 20.0},
                ("Driving", "all", "all", "lifetime kilometers", "none"): {
                    (2020, "loc"): 200000.0
                },
                ("Driving", "all", "all", "kilometers per year", "none"): {
                    (2020, "loc"): 12000.0
                },
            },
        }
        data, i = app.calc.process_results(params_dict, "en", job_id)
        data = json.loads(data)
        data.append(job_id)

        with open(f"data/quick_results_{country}.pickle", "wb") as f:
            pickle.dump(data, f)

        # generate inventories
        for software in ["brightway2", "simapro"]:
            for ecoinvent_version in ["3.6", "3.7"]:
                if software == "brightway2" or (
                    software == "simapro" and ecoinvent_version == "3.6"
                ):
                    data = i.write_lci_to_excel(
                        ecoinvent_version=ecoinvent_version,
                        ecoinvent_compatibility=True,
                        software_compatibility=software,
                        export_format="string",
                    )

                    with open(
                        f"data/inventories/quick_inventory_{country}_{software}_{ecoinvent_version}.pickle",
                        "wb",
                    ) as f:
                        pickle.dump(data, f)

    with open("data/quick_results_job_ids.pickle", "wb") as f:
        pickle.dump(dic_uuids, f)

    res = make_response(jsonify({"job id": job_id}), 200)
    return res


@app.route("/display_quick_results/<country>")
def display_quick_results(country):
    with open(f"data/quick_results_{country}.pickle", "rb") as pickled_data:
        data = pickle.load(pickled_data)

    job_id = data[-1]
    data = data[:-1]

    # retrieve impact categories
    impact_cat = [
        "climate change",
        "agricultural land occupation",
        "fossil depletion",
        "freshwater ecotoxicity",
        "freshwater eutrophication",
        "human toxicity",
        "ionising radiation",
        "marine ecotoxicity",
        "marine eutrophication",
        "metal depletion",
        "natural land transformation",
        "ozone depletion",
        "particulate matter formation",
        "photochemical oxidant formation",
        "terrestrial acidification",
        "terrestrial ecotoxicity",
        "urban land occupation",
        "water depletion",
        "noise emissions",
        "renewable primary energy",
        "non-renewable primary energy",
        "ownership cost",
    ]
    return render_template(
        "result.html",
        data=json.dumps(data),
        uuid=job_id,
        impact_cat=impact_cat,
        country=country,
    )


@app.route("/search_params/<param_item>/<powertrain_filter>/<size_filter>")
def search_params(param_item, powertrain_filter, size_filter):
    """ Return a list of params if param contain `search_item`"""
    lang = session.get("language", "en")
    parameters = [
        param
        for param in app.calc.load_params_file()
        if any(param_item.lower() in x.lower() for x in param)
    ]

    if lang == "en":
        powertrain_filter = [
            app.calc.d_pt_en[pt] for pt in powertrain_filter.split(",")
        ]
        size_filter = [app.calc.d_size_en[s] for s in size_filter.split(",")]

    if lang == "de":
        powertrain_filter = [
            app.calc.d_pt_de[pt] for pt in powertrain_filter.split(",")
        ]
        size_filter = [app.calc.d_size_de[s] for s in size_filter.split(",")]

    if lang == "fr":
        powertrain_filter = [
            app.calc.d_pt_fr[pt] for pt in powertrain_filter.split(",")
        ]
        size_filter = [app.calc.d_size_fr[s] for s in size_filter.split(",")]

    if lang == "it":
        powertrain_filter = [
            app.calc.d_pt_it[pt] for pt in powertrain_filter.split(",")
        ]
        size_filter = [app.calc.d_size_it[s] for s in size_filter.split(",")]

    response = []
    for a in parameters:
        if isinstance(a[4], str):
            a[4] = [p.strip() for p in a[4].split(",")]
        if isinstance(a[5], str):
            a[5] = [p.strip() for p in a[5].split(",")]
        if isinstance(a[6], str):
            a[6] = [s.strip() for s in a[6].split(",")]
        if list(set(a[5]).intersection(powertrain_filter)) and list(
            set(a[6]).intersection(size_filter)
        ):
            if lang == "en":
                a[5] = [
                    app.calc.d_rev_pt_en[pt]
                    for pt in a[5]
                    if pt in app.calc.d_rev_pt_en
                ]
                a[6] = [
                    app.calc.d_rev_size_en[s]
                    for s in a[6]
                    if s in app.calc.d_rev_size_en
                ]
                response.append(a)

            if lang == "de":
                a[5] = [
                    app.calc.d_rev_pt_de[pt]
                    for pt in a[5]
                    if pt in app.calc.d_rev_pt_de
                ]
                a[6] = [
                    app.calc.d_rev_size_de[s]
                    for s in a[6]
                    if s in app.calc.d_rev_size_de
                ]
                response.append(a)

            if lang == "fr":
                a[5] = [
                    app.calc.d_rev_pt_fr[pt]
                    for pt in a[5]
                    if pt in app.calc.d_rev_pt_fr
                ]
                a[6] = [
                    app.calc.d_rev_size_fr[s]
                    for s in a[6]
                    if s in app.calc.d_rev_size_fr
                ]
                response.append(a)

            if lang == "it":
                a[5] = [
                    app.calc.d_rev_pt_it[pt]
                    for pt in a[5]
                    if pt in app.calc.d_rev_pt_it
                ]
                a[6] = [
                    app.calc.d_rev_size_it[s]
                    for s in a[6]
                    if s in app.calc.d_rev_size_it
                ]
                response.append(a)

    return jsonify(response[:7])


@app.route("/get_param_value/<name>/<pt>/<s>/<y>")
def get_param_value(name, pt, s, y):

    y = y.split(",")
    y = [int(a) for a in y]
    arr = app.calc.interpolate_array(y)

    name = name.split(",")

    pt = pt.split(",")
    s = s.split(",")

    val = (
        arr.sel(powertrain=pt, size=s, year=y, parameter=name, value=0)
        .values.round(2)
        .tolist()
    )
    return jsonify(val)


@app.route("/get_driving_cycle/<driving_cycle>")
def get_driving_cycle(driving_cycle):
    """ Return a driving cycle"""
    dc = app.calc.get_dc(driving_cycle)
    return jsonify(dc.tolist())


@app.route("/send_email", methods=["POST"])
def send_email():
    """
    Sends an email after submission of the contact form.
    :return:
    """
    name = request.form["name_input"]
    email = request.form["email_input"]
    message = request.form["message_input"]
    body = message + f" email: {email}, name: {name}"
    sender = app.config["ADMINS"]
    recipients = [app.config["RECIPIENT"]]
    email_out("Question", sender, recipients, body)
    return _("Email sent!")


@app.route("/get_electricity_mix/<iso_code>/<years>/<lifetime>")
def get_electricity_mix(iso_code, years, lifetime):
    """ Return the electricity mix for the iso_code country code and the year(s) given """
    years = [int(y) for y in years.split(",")]
    lifetime = math.ceil(int(float(lifetime)))

    response = [
        app.calc.electricity_mix.sel(
            country=iso_code,
            variable=[
                "Hydro",
                "Nuclear",
                "Gas",
                "Solar",
                "Wind",
                "Biomass",
                "Coal",
                "Oil",
                "Geothermal",
                "Waste",
                "Biogas CCS",
                "Biomass CCS",
                "Coal CCS",
                "Gas CCS",
                "Wood CCS",
            ],
        )
        .interp(
            year=np.arange(year, year + lifetime), kwargs={"fill_value": "extrapolate"},
        )
        .mean(axis=0)
        .values
        if y + lifetime <= 2050
        else app.calc.electricity_mix.sel(
            country=iso_code,
            variable=[
                "Hydro",
                "Nuclear",
                "Gas",
                "Solar",
                "Wind",
                "Biomass",
                "Coal",
                "Oil",
                "Geothermal",
                "Waste",
                "Biogas CCS",
                "Biomass CCS",
                "Coal CCS",
                "Gas CCS",
                "Wood CCS",
            ],
        )
        .interp(year=np.arange(year, 2051), kwargs={"fill_value": "extrapolate"})
        .mean(axis=0)
        .values
        for y, year in enumerate(years)
    ]
    response = np.clip(response, 0, 1) / np.clip(response, 0, 1).sum(axis=1)[:, None]

    response = np.true_divide(response.T, response.sum(axis=1)).T
    response = np.round(response, 2)
    return jsonify(response.tolist())


@app.route("/get_results/", methods=["POST"])
def get_results():
    """ Receive LCA calculation request and dispatch the job to the Redis server """

    job_id = str(uuid.uuid1())

    lang = session.get("language", "en")
    d = app.calc.format_dictionary(request.get_json())

    # Add task to db
    task = Task(id=job_id, progress=0,)
    db.session.add(task)
    db.session.commit()

    # Update task progress to db
    task = Task.query.filter_by(id=job_id).first()
    task.progress = 10
    db.session.commit()

    # Create a connection to the Redis server
    q = Queue(connection=conn)
    job = q.enqueue_call(
        func=app.calc.process_results,
        args=(d, lang, job_id),
        result_ttl=3600,
        job_id=job_id,
    )

    print(f"JOB SENT with job_id {job_id}")

    task = Task.query.filter_by(id=job_id).first()
    task.progress = 30
    db.session.commit()

    res = make_response(jsonify({"job id": job.get_id()}), 200)
    return res


@app.route("/fetch_results/<job_key>", methods=["GET"])
def fetch_results(job_key):
    """ Return raw results is the job is completed. """

    try:
        job = Job.fetch(job_key, connection=conn)

        if job.is_finished:
            return make_response(jsonify(job.result[0]), 200)

        return make_response(jsonify({"message": "The JOB is not completed."}), 404)

    except NoSuchJobError:
        return make_response(jsonify({"message": "The JOB ID is not found."}), 404)


@app.route("/display_result/<job_key>", methods=["GET"])
def display_result(job_key):
    """ If the job is finished, render `result.html` along with the results """
    if not current_user.is_authenticated:
        session["url"] = "/display_result/" + job_key

    try:
        job = Job.fetch(job_key, connection=conn)

        if job.is_finished:
            # retrieve impact categories
            impact_cat = [
                "climate change",
                "agricultural land occupation",
                "fossil depletion",
                "freshwater ecotoxicity",
                "freshwater eutrophication",
                "human toxicity",
                "ionising radiation",
                "marine ecotoxicity",
                "marine eutrophication",
                "metal depletion",
                "natural land transformation",
                "ozone depletion",
                "particulate matter formation",
                "photochemical oxidant formation",
                "terrestrial acidification",
                "terrestrial ecotoxicity",
                "urban land occupation",
                "water depletion",
                "noise emissions",
                "renewable primary energy",
                "non-renewable primary energy",
                "ownership cost",
            ]
            return render_template(
                "result.html", data=job.result[0], uuid=job_key, impact_cat=impact_cat
            )

    except NoSuchJobError:

        # maybe it is a pre-calculated results page
        d_uuids = get_list_uuids_countries()

        if job_key in d_uuids.keys():
            return redirect(url_for("display_quick_results", country=d_uuids[job_key]))
        else:
            return render_template("404.html", job_id=job_key)


@app.route("/check_status/<job_key>")
def get_job_status(job_key):
    """ Check the status of the job for the given `job_id` """
    try:
        job = Job.fetch(job_key, connection=conn)
    except NoSuchJobError:
        response = jsonify({"job status": "job not found"})
        print(f"NO SUCH JOB {job_key}")
        return make_response(response, 404)

    try:
        app.progress_status = Task.query.filter_by(id=job_key).first().progress
    except:
        response = jsonify({"job status": "failed"})
        print(f"JOB FAIL {job_key}")
        return make_response(response, 404)

    response = jsonify(
        {"job status": job.get_status(), "progress_status": app.progress_status}
    )

    return make_response(response, 200)


@app.context_processor
def inject_conf_var():
    return dict(
        AVAILABLE_LANGUAGES=app.config["LANGUAGES"],
        CURRENT_LANGUAGE=session.get(
            "language",
            request.accept_languages.best_match(app.config["LANGUAGES"].keys()),
        ),
    )


@app.route("/language/<language>")
def set_language(language=None):
    session["language"] = language
    return redirect(session.get("url", url_for("index")))


@app.route("/language_result_display/<language>")
def set_language_for_result_display(language):
    session["language"] = language
    return make_response(jsonify({"current language": language}), 200)


@app.route("/get_language")
def get_language():
    lang = session.get("language", "en")
    json_url = os.path.join(app.static_folder, "translation", "translation_en.json")
    if lang == "en":
        json_url = os.path.join(app.static_folder, "translation", "translation_en.json")
    if lang == "de":
        json_url = os.path.join(app.static_folder, "translation", "translation_de.json")
    if lang == "fr":
        json_url = os.path.join(app.static_folder, "translation", "translation_fr.json")
    if lang == "it":
        json_url = os.path.join(app.static_folder, "translation", "translation_it.json")

    with open(json_url, encoding="utf-8") as fh:

        data = json.load(fh)

    return make_response(data, 200)


def get_list_uuids_countries():
    """Returns a dictionary with correspondence between uuids and countries
    for pre-calculated countries"""
    filepath = r"data/quick_results_job_ids.pickle"

    with open(filepath, "rb") as pickled_data:
        data = pickle.load(pickled_data)

    return data


@app.route("/get_inventory/<compatibility>/<ecoinvent_version>/<job_key>/<software>")
@login_required
def get_inventory(compatibility, ecoinvent_version, job_key, software):

    response = Response()
    response.status_code = 200

    d_uuids = get_list_uuids_countries()

    if job_key in d_uuids.keys():

        filepath = f"data/inventories/quick_inventory_{d_uuids[job_key]}_{software}_{ecoinvent_version}.pickle"

        with open(filepath, "rb") as pickled_data:
            data = pickle.load(pickled_data)

    else:

        job = Job.fetch(job_key, connection=conn)
        export = job.result[1]

        data = export.write_lci_to_excel(
            ecoinvent_version=ecoinvent_version,
            ecoinvent_compatibility=compatibility,
            software_compatibility=software,
            export_format="string",
        )

    response.data = data

    if software == "brightway2":
        file_ext = "xlsx"
    else:
        file_ext = "csv"

    file_name = f"carculator_inventory_{datetime.date.today()}_for_ei_{ecoinvent_version}_{software}.{file_ext}"

    mimetype_tuple = mimetypes.guess_type(file_name)
    response_headers = {
        "Pragma": "public",  # required,
        "Expires": "0",
        "Cache-Control": "must-revalidate, post-check=0, pre-check=0",
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": f"attachment; filename={file_name};",
        "Content-Transfer-Encoding": "binary",
        "Content-Length": len(response.data),
    }

    if not mimetype_tuple[1] is None:
        response_headers["Content-Encoding"] = mimetype_tuple[1]

    response.headers.update(response_headers)
    return response


@app.route("/get_param_table")
def get_param_table():
    lang = session.get("language", "en")
    params = app.calc.load_params_file()

    for param in params:
        if isinstance(param[4], str):
            param[4] = [p.strip() for p in param[4].split(",")]
        if isinstance(param[5], str):
            param[5] = [p.strip() for p in param[5].split(",")]
        if isinstance(param[6], str):
            param[6] = [s.strip() for s in param[6].split(",")]

        if lang == "en":
            param[5] = [app.calc.d_rev_pt_en.get(pt, pt) for pt in param[5]]
            param[6] = [app.calc.d_rev_size_en[pt] for pt in param[6]]

        if lang == "de":
            param[5] = [app.calc.d_rev_pt_de.get(pt, pt) for pt in param[5]]
            param[6] = [app.calc.d_rev_size_de[pt] for pt in param[6]]

        if lang == "fr":
            param[5] = [app.calc.d_rev_pt_fr.get(pt, pt) for pt in param[5]]
            param[6] = [app.calc.d_rev_size_fr[pt] for pt in param[6]]

        if lang == "it":
            param[5] = [app.calc.d_rev_pt_it.get(pt, pt) for pt in param[5]]
            param[6] = [app.calc.d_rev_size_it[pt] for pt in param[6]]

    return render_template("param_table.html", params=params)


@app.route("/get_fuel_blend/<country>/<years>")
def get_fuel_blend(country, years):
    years = [int(y) for y in years.split(",")]

    # Returns average share of biogasoline according to historical IEA stats
    if country in app.calc.biogasoline.country.values:
        share_biogasoline = np.squeeze(
            np.clip(
                app.calc.biogasoline.sel(country=country, variable="value")
                .interp(year=years, kwargs={"fill_value": "extrapolate"})
                .values,
                0,
                1,
            )
        )
        if share_biogasoline.shape == ():
            share_biogasoline = share_biogasoline.reshape(1)
    else:
        share_biogasoline = np.zeros_like(years)

    # Returns average share of biodiesel according to historical IEA stats
    if country in app.calc.biodiesel.country.values:
        share_biodiesel = np.squeeze(
            np.clip(
                app.calc.biodiesel.sel(country=country, variable="value")
                .interp(year=years, kwargs={"fill_value": "extrapolate"})
                .values,
                0,
                1,
            )
        )
        if share_biodiesel.shape == ():
            share_biodiesel = share_biodiesel.reshape(1)
    else:
        share_biodiesel = np.zeros_like(years)

    # Returns average share of biomethane according to historical IEA stats
    if country in app.calc.biomethane.country.values:
        share_biomethane = np.squeeze(
            np.clip(
                app.calc.biomethane.sel(country=country, variable="value")
                .interp(year=years, kwargs={"fill_value": "extrapolate"})
                .values,
                0,
                1,
            )
        )
        if share_biomethane.shape == ():
            share_biomethane = share_biomethane.reshape(1)
    else:
        share_biomethane = np.zeros_like(years)

    response = {
        "petrol": {
            "primary": np.round(1 - share_biogasoline, 2).tolist(),
            "secondary": np.round(share_biogasoline, 2).tolist(),
        },
        "diesel": {
            "primary": np.round(1 - share_biodiesel, 2).tolist(),
            "secondary": np.round(share_biodiesel, 2).tolist(),
        },
        "cng": {
            "primary": np.round(1 - share_biomethane, 2).tolist(),
            "secondary": np.round(share_biomethane, 2).tolist(),
        },
        "hydrogen": {
            "primary": np.ones_like(years).tolist(),
            "secondary": np.zeros_like(years).tolist(),
        },
    }

    return jsonify(response)
