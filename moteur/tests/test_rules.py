from engine.scoring import score_crop
from engine.rules import evaluate_rules

WHEAT = {
    "temp_c": [5, 15, 23, 27],
    "rain_mm": [300, 750, 900, 1600],
}
CONFIG = {"weights": {"temp_c": 0.5, "rain_mm": 0.5}}


def run(parcel, **kwargs):
    result = score_crop(parcel, WHEAT, CONFIG)
    return evaluate_rules(result, parcel, WHEAT, **kwargs)


def test_good_parcel_has_no_exclusion():
    assert run({"temp_c": 18, "rain_mm": 800}) == []


def test_too_hot_is_excluded_with_reason():
    exclusions = run({"temp_c": 32, "rain_mm": 800})
    assert len(exclusions) == 1
    assert exclusions[0]["rule"] == "temperature_hors_plage"
    assert exclusions[0]["allowed_range"] == [5, 27]


def test_dry_parcel_excluded_without_irrigation():
    exclusions = run({"temp_c": 18, "rain_mm": 200})
    assert exclusions[0]["rule"] == "pluie_hors_plage"


def test_irrigation_lifts_the_rain_exclusion():
    assert run({"temp_c": 18, "rain_mm": 200}, irrigated=True) == []