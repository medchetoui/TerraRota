from engine.api import run
from engine.contract import validate_input, validate_output


def levels(issues):
    return [issue["level"] for issue in issues]


def test_valid_input_has_no_issue():
    payload = {"parcel": {"temp_c": 18, "rain_mm": 500}, "irrigated": False}
    assert validate_input(payload) == []


def test_missing_parcel_is_error():
    assert levels(validate_input({})) == ["error"]


def test_text_instead_of_number_is_error():
    issues = validate_input({"parcel": {"temp_c": "chaud"}})
    assert "error" in levels(issues)


def test_null_value_is_accepted():
    assert validate_input({"parcel": {"temp_c": None, "rain_mm": 500}}) == []


def test_unknown_field_is_warning_only():
    issues = validate_input({"parcel": {"temp": 18, "temp_c": 18}})
    assert levels(issues) == ["warning"]


def test_irrigated_must_be_boolean():
    issues = validate_input({"parcel": {"temp_c": 18}, "irrigated": "oui"})
    assert "error" in levels(issues)


def test_run_rejects_invalid_input():
    out = run({"parcel": {"temp_c": "chaud"}})
    assert out["status"] == "invalid_input"


def test_run_output_respects_contract():
    out = run({"parcel": {"temp_c": 18, "rain_mm": 500, "ph": 7, "salinity_dsm": 2}})
    assert out["status"] == "ok"
    assert validate_output(out) == []