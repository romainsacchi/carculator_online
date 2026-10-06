"""Application data locations, independent of the worker's working directory."""

from pathlib import Path

import yaml

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_yaml_file(filepath):
    with Path(filepath).open(encoding="utf-8") as stream:
        return yaml.safe_load(stream)
