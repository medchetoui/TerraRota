from engine.plan import evaluate_plan, recommend_plan

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
GOOD = {"conditions": {"temp_c": 18, "rain_mm": 800}, "history": [{"crop": "pois", "year": 2025}]}
AFTER_WHEAT = {"conditions": {"temp_c": 18, "rain_mm": 800}, "history": [{"crop": "ble", "year": 2025}]}
HOT = {"conditions": {"temp_c": 32, "rain_mm": 800}}


def run(plan, parcels):
    return evaluate_plan(plan, parcels, crops=CROPS, config=CONFIG)


def rules_of(issues):
    return [issue["rule"] for issue in issues]


def test_good_line_is_ok_without_alternatives():
    out = run([{"parcel": "P1", "crop": "ble", "area_ha": 2}], {"P1": GOOD})
    line = out["lines"][0]
    assert line["status"] == "ok" and line["alternatives"] == []
    assert out["verdict"] == "viable"


def test_rotation_lowers_the_score():
    out = run([{"parcel": "P1", "crop": "ble", "area_ha": 2}], {"P1": AFTER_WHEAT})
    line = out["lines"][0]
    assert line["agro_score"] == 100 and line["rotation_note"] == 0.5
    assert line["score"] == 50 and line["status"] == "risky"
    assert out["verdict"] == "partially_viable"


def test_risky_line_gets_a_better_alternative():
    out = run([{"parcel": "P1", "crop": "ble", "area_ha": 2}], {"P1": AFTER_WHEAT})
    alt = out["lines"][0]["alternatives"][0]
    assert alt["crop"] == "pois" and alt["score"] == 100 and alt["gain"] == 50


def test_excluded_line_is_not_recommended_with_no_gain():
    out = run([{"parcel": "P1", "crop": "ble", "area_ha": 2}], {"P1": HOT})
    line = out["lines"][0]
    assert line["status"] == "not_recommended" and line["exclusions"]
    assert out["verdict"] == "not_viable"
    assert line["alternatives"][0]["crop"] == "pois"
    assert line["alternatives"][0]["gain"] is None


def test_mixed_plan_is_partially_viable_and_flags_concentration():
    plan = [{"parcel": "P1", "crop": "ble", "area_ha": 1},
            {"parcel": "P2", "crop": "ble", "area_ha": 1}]
    out = run(plan, {"P1": GOOD, "P2": HOT})
    assert out["verdict"] == "partially_viable"
    assert "concentration_famille" in rules_of(out["plan_issues"])


def test_balanced_plan_has_no_concentration_issue():
    plan = [{"parcel": "P1", "crop": "ble", "area_ha": 1},
            {"parcel": "P1", "crop": "pois", "area_ha": 1}]
    out = run(plan, {"P1": GOOD})
    assert "concentration_famille" not in rules_of(out["plan_issues"])


def test_concentration_uses_area_when_given():
    plan = [{"parcel": "P1", "crop": "ble", "area_ha": 3},
            {"parcel": "P1", "crop": "pois", "area_ha": 1}]
    out = run(plan, {"P1": GOOD})
    assert "concentration_famille" in rules_of(out["plan_issues"])   # 75 % > 70 %


def test_unknown_crop_and_parcel_do_not_crash():
    plan = [{"parcel": "P1", "crop": "quinoa"}, {"parcel": "PX", "crop": "ble"}]
    out = run(plan, {"P1": GOOD})
    assert [line["status"] for line in out["lines"]] == ["unknown_crop", "unknown_parcel"]
    assert out["verdict"] == "not_evaluated"
    assert rules_of(out["plan_issues"]) == ["ligne_non_evaluee", "ligne_non_evaluee"]


def test_confidence_is_separate_from_score():
    plan = [{"parcel": "P1", "crop": "ble"}]
    unknown = run(plan, {"P1": GOOD})["lines"][0]                              # irrigation inconnue
    known = run(plan, {"P1": {**GOOD, "irrigated": False}})["lines"][0]        # irrigation connue
    assert unknown["score"] == known["score"] == 100
    assert unknown["confidence"]["percent"] == 75
    assert known["confidence"]["percent"] == 85


def test_plan_confidence_is_the_weakest_line():
    plan = [{"parcel": "P1", "crop": "ble"}, {"parcel": "P2", "crop": "ble"}]
    parcels = {
        "P1": {**GOOD, "irrigated": False},
        "P2": {"conditions": {"temp_c": 18}, "irrigated": False,
               "history": [{"crop": "pois", "year": 2025}]},
    }
    out = run(plan, parcels)
    assert out["confidence"]["percent"] == 35
    assert out["confidence"]["level"] == "low"


def test_ok_line_gets_alternative_only_when_much_better():
    parcel = {"conditions": {"temp_c": 25, "rain_mm": 800}}   # pas d'historique
    line = run([{"parcel": "P1", "crop": "ble"}], {"P1": parcel})["lines"][0]
    assert line["status"] == "ok" and line["score"] == 75
    assert line["alternatives"][0]["crop"] == "pois"
    assert line["alternatives"][0]["gain"] == 25


def test_line_keeps_criteria_details():
    line = run([{"parcel": "P1", "crop": "ble"}], {"P1": GOOD})["lines"][0]
    by_name = {c["criterion"]: c for c in line["criteria"]}
    assert by_name["temp_c"]["position"] == "optimal"
    assert by_name["rain_mm"]["optimal"] == [750, 900]


# ---------------------------------------------------------------- recommend_plan

def test_recommend_plan_picks_viable_crop_after_wheat():
    plan, unplanned = recommend_plan({"P1": AFTER_WHEAT}, crops=CROPS, config=CONFIG)
    assert [line["crop"] for line in plan] == ["pois"] and unplanned == []


def test_recommended_plan_is_evaluated_as_viable():
    parcels = {"P1": AFTER_WHEAT}
    plan, _ = recommend_plan(parcels, crops=CROPS, config=CONFIG)
    assert evaluate_plan(plan, parcels, crops=CROPS, config=CONFIG)["verdict"] == "viable"


def test_recommended_plan_is_healthy_for_the_soil():
    parcels = {"P1": AFTER_WHEAT, "P2": GOOD}
    plan, _ = recommend_plan(parcels, crops=CROPS, config=CONFIG)
    out = evaluate_plan(plan, parcels, crops=CROPS, config=CONFIG)
    assert out["verdict"] == "viable"
    for line in out["lines"]:
        assert line["status"] == "ok"
        assert line["rotation_note"] in (None, 1.0)
        assert not [i for i in line["rotation_issues"] if i["level"] == "warning"]
    assert "concentration_famille" not in rules_of(out["plan_issues"])
def test_only_cereals_gets_a_diversification_tip():
    parcel = {"conditions": {"temp_c": 18, "rain_mm": 800}}      # sans historique
    out = run([{"parcel": "P1", "crop": "ble"}], {"P1": parcel})
    tip = out["tips"][0]
    assert tip["rule"] == "une_seule_famille" and tip["family"] == "poaceae"
    assert tip["suggestions"]["P1"][0]["crop"] == "pois"
    assert out["composition"] == [{"family": "poaceae", "percent": 100}]


def test_balanced_plan_has_no_tip():
    plan = [{"parcel": "P1", "crop": "ble"}, {"parcel": "P1", "crop": "pois"}]
    assert run(plan, {"P1": GOOD})["tips"] == []    