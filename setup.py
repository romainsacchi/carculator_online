import os
from setuptools import setup

requires = (
        "alembic",
        "bw2io",
        "Flask",
        "flask_babel",
        "flask_login",
        "flask_mail",
        "flask_migrate",
        "flask_sqlalchemy",
        "flask_wtf",
        "klausen",
        "numexpr",
        "numpy",
        "pandas",
        "pycountry",
        "pyprind",
        "PyYAML",
        "redis",
        "rq",
        "scipy",
        "setuptools",
        "SQLAlchemy",
        "stats_arrays",
        "Werkzeug",
        "WTForms",
        "xarray",
        )

def read(fname):
    return open(os.path.join(os.path.dirname(__file__), fname)).read()

setup(
    name = "carculator_online",
    version = "1.0.0",
    author = "Romain Sacchi",
    author_email = "romain.sacchi@psi.ch",
    description = ("user interface for carculator"),
    license = "BSD",
    keywords = "example documentation tutorial",
    url = "https://github.com/romainsacchi/carculator_online",
    packages=['app',],
    # namespace_packages = ['package_name'],
    install_requires=requires,
    long_description=read('README.md'),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Topic :: Utilities",
        "License :: OSI Approved :: BSD License",
    ],
)