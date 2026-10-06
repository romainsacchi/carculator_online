"""Test pure helpers without initializing Flask, a database, or Redis."""

import importlib.util
import json
from pathlib import Path

import numpy as np


def load_helper(name):
    path = Path(__file__).resolve().parents[1] / "app" / (name + ".py")
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_result_serialization_preserves_booleans_and_cleans_arrays():
    helper = load_helper("serialization")
    result = helper._clean_seq(
        {"ok": True, "flag": np.bool_(False), "values": np.array([1.0, np.nan, np.inf])}
    )
    assert result == {"ok": True, "flag": False, "values": [1.0, 0.0, 0.0]}
    assert result["ok"] is True and result["flag"] is False
    json.dumps(result, allow_nan=False)


def test_data_location_does_not_depend_on_working_directory(tmp_path, monkeypatch):
    helper = load_helper("resources")
    expected = helper.DATA_DIR
    monkeypatch.chdir(tmp_path)
    assert load_helper("resources").DATA_DIR == expected
    fixture = tmp_path / "mapping.yaml"
    fixture.write_text("label: café\n", encoding="utf-8")
    assert helper.load_yaml_file(fixture) == {"label": "café"}
