from engine.explain import explain_line
from engine.plan import evaluate_plan
from engine.whatif import apply_changes
from tests.test_whatif import CONFIG, CROPS as BASE

CROPS = {**BASE, "ble": {**BASE["ble"], "cycle_days": [150, 210]}}   # pois : pas de cycle_days
MONTHLY = {"temp_c": [10, 11, 13, 16, 20, 24, 28, 29, 25, 20, 14, 11], "rain_mm": [60] * 12}
PLAN = [{"parcel": "P1", "crop": "ble"}, ]
HOT_YEAR = {"conditions": {"temp_c": 25, "rain_mm": 800}}      # moyenne annuelle trop chaude


def line_of(parcel, crop="ble"):
    out = evaluate_plan([{"parcel": "P1", "crop": crop}], {"P1": parcel}, crops=CROPS, config=CONFIG)
    return out["lines"][0]


def test_without_monthly_nothing_changes():
    line = line_of(HOT_YEAR)
    assert line["agro_score"] == 75 and line["window"] is None


def test_cycle_window_uses_the_months_of_the_crop():
    line = line_of({**HOT_YEAR, "monthly": MONTHLY})
    assert line["agro_score"] == 100
    assert line["window"] == {"start_month": 2, "months": 6, "period_fr": "février à juillet"}
    temp = {c["criterion"]: c for c in line["criteria"]}["temp_c"]
    assert temp["value"] == 18.7 and temp["position"] == "optimal"


def test_crop_without_cycle_days_keeps_the_annual_value():
    line = line_of({**HOT_YEAR, "monthly": MONTHLY}, crop="pois")
    assert line["window"] is None
    assert {c["criterion"]: c for c in line["criteria"]}["temp_c"]["value"] == 25


def test_what_if_shifts_the_monthly_profile():
    out = apply_changes({"P1": {**HOT_YEAR, "monthly": MONTHLY}},
                        {"temp_delta": 2, "rain_factor": 0.5}, previous_year=2025)
    assert out["P1"]["monthly"]["temp_c"][0] == 12.0 and out["P1"]["monthly"]["rain_mm"][0] == 30.0
    assert MONTHLY["temp_c"][0] == 10


def test_explanation_names_the_period():
    line = line_of({**HOT_YEAR, "monthly": MONTHLY})
    reasons = explain_line(line, CROPS)["reasons"]
    assert any(r.startswith("La température moyenne de février à juillet (18.7 °C) est dans la plage idéale")for r in reasons)