"""Flask App Project."""

from app import app
from app import db
from flask import (
    render_template,
    jsonify,
    request,
    make_response,
    session,
    redirect,
    url_for,
    json,
    flash,
    Response
)
import datetime
import mimetypes
from .email_support import email_out
import numpy as np
import os
from rq import Queue
from rq.job import Job, NoSuchJobError
from .worker import conn
from .calculation import Calculation
from flask_babel import _
from flask_login import current_user, login_user, logout_user, login_required
from app.models import User, Task
from app.forms import LoginForm, RegistrationForm
from werkzeug.urls import url_parse
import uuid

app.calc = Calculation()
app.lci_to_bw = ""

progress_status = 0


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
        next_page = request.args.get("next")
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


@app.route("/")
def index():
    """Return homepage."""
    lang = session.get("language", "en")
    return render_template("index.html", lang=lang)


@app.route("/start")
def start():
    """Return start page."""
    return render_template("start.html")


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
        response = (
            app.calc.electricity_mix.loc[dict(country=country,
            variable=["Hydro","Nuclear","Gas","Solar","Wind","Biomass","Coal","Oil","Geothermal","Waste"])]
            .interp(year=[2010, 2020, 2035, 2050])
            .values
        )
        response = np.round(
            np.true_divide(response.T, response.sum(axis=1)).T, 2
        ).tolist()

        region = app.calc.region_map[country][
                    "RegionCode"
                ]

        share_biofuel = (
            app.calc.biofuel.sel(
                region=region,
                fuel_type='Biomass fuel',
                scenario='SSP2-Base',
            )
            .interp(year=[2010, 2020, 2035, 2050])
            .values
        )

        config = {
            "year": ["2010", "2020", "2035", "2050"],
            "type": [_("Petrol"), _("Diesel"), _("Electric")],
            "size": [_("Mid-size")],
            "driving_cycle": "WLTC",
            "foreground params": {
                "passenger-slider": "1.5",
                "cargo-slider": "150",
                "lifetime-slider": "200 000",
                "mileage-slider": "12 000",
            },
            "background params": {
                "country": country,
                "fuel blend": {'petrol': {'primary fuel': {
                                            'type':'petrol',
                                            'share':np.round((1.0 - share_biofuel), 2).tolist()
                                                            }
                                        ,
                                         'secondary fuel': {
                                            'type':'bioethanol - wheat straw',
                                             'share':np.round(share_biofuel, 2).tolist()
                                         }}
                                        ,
                               'diesel': {'primary fuel': {
                                            'type':'diesel',
                                            'share':np.round((1.0 - share_biofuel), 2).tolist()
                                        },
                                         'secondary fuel': {
                                             'type':'biodiesel - algae',
                                             'share':np.round(share_biofuel, 2).tolist()
                                         }
                                        }
                                },
                "energy storage": {
                    "electric": {"type":"NMC", "origin":"CN"}
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
        _("(Plugin) Hybrid-diesel")
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
    years = [i for i in range(2000, 2051)]
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


@app.route("/search_params/<param_item>/<powertrain_filter>/<size_filter>")
def search_params(param_item, powertrain_filter, size_filter):
    """ Return a list of params if param contain `search?item`"""
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
    lang = session.get("language", "en")
    if lang == "en":
        pt = [app.calc.d_pt_en[p] for p in pt.split(",")]
        s = [app.calc.d_size_en[x] for x in s.split(",")]
    if lang == "de":
        pt = [app.calc.d_pt_de[p] for p in pt.split(",")]
        s = [app.calc.d_size_de[x] for x in s.split(",")]
    if lang == "fr":
        pt = [app.calc.d_pt_fr[p] for p in pt.split(",")]
        s = [app.calc.d_size_fr[x] for x in s.split(",")]
    if lang == "it":
        pt = [app.calc.d_pt_it[p] for p in pt.split(",")]
        s = [app.calc.d_size_it[x] for x in s.split(",")]

    y = y.split(",")
    y = [int(a) for a in y]
    arr = app.calc.interpolate_array(y)
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
    body = message + " email: {}, name: {}".format(email, name)
    sender = app.config["ADMINS"]
    recipients = [app.config["RECIPIENT"]]
    email_out("Question", sender, recipients, body)
    return _("Email sent!")


@app.route("/get_electricity_mix/<ISO>/<years>")
def get_electricity_mix(ISO, years):
    """ Return the electricity mix for the ISO country code and the year(s) given """
    years = [int(y) for y in years.split(",")]
    response = (
        app.calc.electricity_mix.loc[dict(country=ISO,
            variable=["Hydro","Nuclear","Gas","Solar","Wind","Biomass","Coal","Oil","Geothermal","Waste"])]
        .interp(year=years)
        .values
    )
    response = np.true_divide(response.T, response.sum(axis=1)).T
    response = np.round(response, 2)
    return jsonify(response.tolist())


@app.route("/get_results/", methods=["POST"])
def get_results():
    """ Receive LCA calculation request and dispatch the job to the Redis server """

    job_id = str(uuid.uuid1())

    # Add task to db
    task = Task(id=job_id, progress=0,)
    db.session.add(task)
    db.session.commit()

    lang = session.get("language", "en")

    d = app.calc.format_dictionary(request.get_json(), lang, job_id)

    # Create a connection to the Redis server
    q = Queue(connection=conn)
    job = q.enqueue_call(
        func=app.calc.process_results,
        args=(d, lang, job_id),
        result_ttl=3600,
        job_id=job_id,
    )

    task = Task.query.filter_by(id=job_id).first()
    task.progress = 30
    db.session.commit()

    res = make_response(jsonify({"job id": job.get_id()}), 200)
    return res


@app.route("/display_result/<job_key>", methods=["GET"])
def display_result(job_key):
    """ If the job is finished, render `result.html` along with the results """
    if not current_user.is_authenticated:
        session["url"] = "/display_result/" + job_key

    try:
        job = Job.fetch(job_key, connection=conn)
        if job.is_finished:
            app.lci_to_bw = job.result[1]
            return render_template("result.html", data=job.result[0])
    except NoSuchJobError:
        return render_template("404.html", job_id=job_key)


@app.route("/check_status/<job_key>")
def get_job_status(job_key):
    """ Check the status of the job for the given `job_id` """
    try:
        job = Job.fetch(job_key, connection=conn)
    except NoSuchJobError:
        response = jsonify({"job status": "job not found"})
        return make_response(response, 404)

    try:
        progress_status = Task.query.filter_by(id=job_key).first().progress
    except:
        response = jsonify({"job status": "failed"})
        return make_response(response, 404)


    response = jsonify(
        {"job status": job.get_status(), "progress_status": progress_status}
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
    return redirect(url_for("index"))


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


@app.route("/get_inventory_excel_for_bw")
@login_required
def get_inventory_excel_for_bw():

    response = Response()
    response.status_code = 200
    response.data = app.lci_to_bw
    file_name = 'carculator_inventory_export_{}.xlsx'.format(
        str(datetime.date.today()))
    mimetype_tuple = mimetypes.guess_type(file_name)
    response_headers = {
        'Pragma': "public",  # required,
        'Expires': '0',
        'Cache-Control': 'must-revalidate, post-check=0, pre-check=0',
        'Cache-Control': 'private',  # required for certain browsers,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=\"%s\";' % file_name,
        'Content-Transfer-Encoding': 'binary',
        'Content-Length': len(response.data)
    }

    if not mimetype_tuple[1] is None:
        response.update({
            'Content-Encoding': mimetype_tuple[1]
        })
    response.headers = response_headers
    response.set_cookie('fileDownload', 'true', path='/')
    return response

    #resp = make_response(app.lci_to_bw)
    #resp.headers["Content-Disposition"] = "attachment; filename=inventory.xlsx"
    #resp.headers["Content-type"] = "text/csv"
    #return resp


@app.route("/get_param_table")
def get_param_table():
    lang = session.get("language", "en")
    params = app.calc.load_params_file()

    for d in params:
        if isinstance(d[4], str):
            d[4] = [p.strip() for p in d[4].split(",")]
        if isinstance(d[5], str):
            d[5] = [p.strip() for p in d[5].split(",")]
        if isinstance(d[6], str):
            d[6] = [s.strip() for s in d[6].split(",")]

        if lang == "en":
            d[5] = [app.calc.d_rev_pt_en.get(pt, pt) for pt in d[5]]
            d[6] = [app.calc.d_rev_size_en[pt] for pt in d[6]]

        if lang == "de":
            d[5] = [app.calc.d_rev_pt_de.get(pt, pt) for pt in d[5]]
            d[6] = [app.calc.d_rev_size_de[pt] for pt in d[6]]

        if lang == "fr":
            d[5] = [app.calc.d_rev_pt_fr.get(pt, pt) for pt in d[5]]
            d[6] = [app.calc.d_rev_size_fr[pt] for pt in d[6]]

        if lang == "it":
            d[5] = [app.calc.d_rev_pt_it.get(pt, pt) for pt in d[5]]
            d[6] = [app.calc.d_rev_size_it[pt] for pt in d[6]]

    return render_template("param_table.html", params=params)

@app.route("/get_fuel_blend/<country>/<years>")
def get_fuel_blend(country, years):
    years = [int(y) for y in years.split(",")]
    region = app.calc.region_map[country]["RegionCode"]

    share_biofuel = (
            app.calc.biofuel.sel(
                region=region,
                value=0,
                fuel_type='Biomass fuel',
                scenario='SSP2-Base',
            )
            .interp(year=years)
            .values
        )

    response = {}
    for y in years:
        response[y]={'primary':np.round(1-share_biofuel, 2)[years.index(y)],
                     'secondary':np.round(share_biofuel, 2)[years.index(y)]}
    return jsonify(response)
