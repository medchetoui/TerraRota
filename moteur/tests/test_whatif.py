import copy

from engine.whatif import PRESETS, compare_to_text, what_if

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
GOOD = {"conditions": COND, "history": [{"crop": "pois", "year": 2025}]}
AFTER_WHEAT = {"conditions": COND, "history": [{"crop": "ble", "year": 2025}]}
BLE = [{"parcel": "P1", "crop": "ble", "area_ha": 2}]


def run(parcels, changes):
    return what_if(BLE, parcels, changes, crops=CROPS, config=CONFIG,
                   plan_year=2026, label="Et si ?")


def test_less_rain_lowers_the_score():
    res = run({"P1": GOOD}, {"rain_factor": 0.8})
    line = res["comparison"]["lines"][0]
    assert line["score_before"] == 100 and line["delta"] < 0
    assert res["comparison"]["changed"]


def test_other_previous_crop_changes_the_rotation():
    res = run({"P1": AFTER_WHEAT}, {"previous_crop": "pois"})
    line = res["comparison"]["lines"][0]
    assert (line["score_before"], line["score_after"]) == (50, 100)
    assert (line["status_before"], line["status_after"]) == ("risky", "ok")
    assert res["comparison"]["verdict"] == {"before": "partially_viable", "after": "viable"}


def test_original_parcels_are_not_modified():
    parcels = {"P1": copy.deepcopy(AFTER_WHEAT)}
    run(parcels, {"rain_factor": 0.5, "previous_crop": "pois", "irrigated": True})
    assert parcels == {"P1": AFTER_WHEAT}


def test_no_change_means_no_difference():
    assert run({"P1": GOOD}, {})["comparison"]["changed"] is False


def test_text_is_a_section_with_numbers():
    text = compare_to_text(run({"P1": AFTER_WHEAT}, {"previous_crop": "pois"}))
    assert text.startswith("=== ET SI : Et si ? ===")
    assert "50 sur 100 avant, 100 sur 100 après (+50 points)" in text


def test_presets_are_well_formed():
    for preset in PRESETS.values():
        assert preset["label"].startswith("Et s") and preset["changes"]