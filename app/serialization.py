"""Pure result serialization helpers; importing this file needs no Flask services.

Non-finite display values retain the legacy zero fallback. This is a presentation
policy, not validation of the underlying calculation.
"""

import math
import numbers


def _num(value, default=0.0):
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError):
        return float(default)
    return result if math.isfinite(result) else float(default)


def _clean_seq(value):
    if isinstance(value, dict):
        return {key: _clean_seq(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_clean_seq(item) for item in value]
    if hasattr(value, "tolist"):
        return _clean_seq(value.tolist())
    # bool is a subclass of int; preserve JSON booleans before handling numbers.
    if isinstance(value, bool):
        return value
    if isinstance(value, numbers.Real):
        return _num(value)
    return value


def _has_bad_number(value):
    try:
        return not math.isfinite(float(value))
    except (TypeError, ValueError, OverflowError):
        return False
