from engine.report import analyze

CROPS = {
    "ble": {"name_fr": "Blé", "type": "annual", "family": "poaceae", "soil_effect": "neutral",
            "temp_c": [5, 15, 23, 27], "rain_mm": [300, 750, 900, 1600], "alternatives": ["pois"]},
    "pois": {"name_fr": "Pois chiche", "type": "annual", "family": "fabaceae",
             "soil_effect": "fixes_nitrogen",
             "temp_c": [7, 15, 29, 35], "rain_mm": [300, 600, 1000, 1800], "alternatives": ["ble"]},
}
CONFIG = {
    "weights": {"temp_c": 0.5, "rain_mm": 0.5},
    "verdict_thresholds": {"viable": 70, "risky": 40},
    "rotation": {"window_years": 3, "same_crop_penalty": 0.5, "same_family_penalty": 0.3,
                 "repeated_family_penalty": 0.2, "exhausting_after_exhausting_penalty": 0.2},
    "plan": {"max_family_share": 0.7},
    "confidence": {"high": 0.75, "medium": 0.5, "unverified_crop_penalty": 0.15,
                   "rotation_unknown_penalty": 0.1, "irrigation_unknown_penalty": 0.1},
}
COND = {"temp_c": 18, "rain_mm": 800}
BLE = [{"parcel": "P1", "crop": "ble", "area_ha": 2}]


def run(plan, parcels, **kw):
    return analyze(plan, parcels, crops=CROPS, config=CONFIG, plan_year=2026, **kw)


def test_incoherent_plan_gets_a_better_plan_and_next_year_follows_it():
    parcels = {"P1": {"conditions": COND, "history": [{"crop": "ble", "year": 2025}]}}
    rep = run(BLE, parcels)
    assert [l["crop"] for l in rep["better"]["plan"]] == ["pois"]
    assert rep["retained"] == "proposed" and rep["next_year"]["based_on"] == "proposed"
    assert rep["next_year"]["year"] == 2027
    assert "pois" not in [l["crop"] for l in rep["next_year"]["plan"]]   # pas deux fois de suite


def test_viable_plan_has_no_better_plan():
    parcels = {"P1": {"conditions": COND, "history": [{"crop": "pois", "year": 2025}]}}
    rep = run(BLE, parcels)
    assert rep["better"] is None and rep["retained"] == "farmer"


def test_missing_history_does_not_crash_and_is_reported():
    rep = run(BLE, {"P1": {"conditions": COND}})
    assert rep["missing_history"] == ["P1"]
    assert [l["crop"] for l in rep["next_year"]["plan"]] == ["pois"]     # apres le ble de cette annee