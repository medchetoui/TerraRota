from engine.confidence import assess_confidence

CONFIG = {
    "weights": {"temp_c": 0.5, "rain_mm": 0.5},
    "confidence": {"high": 0.75, "medium": 0.5, "unverified_crop_penalty": 0.15,
                   "rotation_unknown_penalty": 0.1, "irrigation_unknown_penalty": 0.1},
}
CROP = {"verified": True}


def assess(missing=(), crop=CROP, applicable=True, note=0.7, irrigated=False):
    return assess_confidence(list(missing), crop, applicable, note, irrigated, CONFIG)


def test_everything_known_is_high():
    out = assess()
    assert out["level"] == "high" and out["value"] == 1.0 and out["reasons"] == []


def test_one_missing_criterion_is_medium():
    out = assess(missing=["rain_mm"])
    assert out["value"] == 0.5 and out["level"] == "medium"
    assert "rain_mm" in out["reasons"][0]


def test_everything_missing_is_low():
    assert assess(missing=["temp_c", "rain_mm"])["level"] == "low"


def test_unverified_crop_lowers_confidence():
    out = assess(crop={"verified": False})
    assert out["value"] == 0.85 and "non verifies" in out["reasons"][0]


def test_unknown_rotation_lowers_confidence():
    out = assess(note=None)
    assert out["value"] == 0.9 and "rotation" in out["reasons"][0]


def test_perennial_is_not_penalised_for_rotation():
    assert assess(applicable=False, note=None)["value"] == 1.0


def test_unknown_irrigation_lowers_confidence():
    assert assess(irrigated=None)["value"] == 0.9


def test_penalties_add_up_and_never_go_below_zero():
    out = assess(missing=["rain_mm"], note=None, irrigated=None)
    assert out["value"] == 0.3 and out["level"] == "low"
    heavy = assess(missing=["temp_c", "rain_mm"], crop={"verified": False}, note=None, irrigated=None)
    assert heavy["value"] == 0.0
def test_percent_is_value_times_100():
    assert assess(missing=["rain_mm"])["percent"] == 50   
    
def test_unvalidated_crop_lowers_confidence_when_configured():
    config = {**CONFIG, "confidence": {**CONFIG["confidence"], "unvalidated_crop_penalty": 0.15}}
    out = assess_confidence([], {"verified": True}, True, 0.7, False, config)
    assert out["value"] == 0.85 and "valides localement" in out["reasons"][0]
    validated = assess_confidence(
        [], {"verified": True, "locally_validated": True}, True, 0.7, False, config)
    assert validated["value"] == 1.0     