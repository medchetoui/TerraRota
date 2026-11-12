from engine.rotation import check_rotation

CROPS = {
    "ble": {"type": "annual", "family": "poaceae", "soil_effect": "neutral"},
    "orge": {"type": "annual", "family": "poaceae", "soil_effect": "neutral"},
    "pois": {"type": "annual", "family": "fabaceae", "soil_effect": "fixes_nitrogen"},
    "pomme": {"type": "annual", "family": "solanaceae", "soil_effect": "exhausting"},
    "oignon": {"type": "annual", "family": "amaryllidaceae", "soil_effect": "exhausting"},
    "olivier": {"type": "perennial", "family": "oleaceae", "soil_effect": "neutral"},
}
CONFIG = {"rotation": {
    "window_years": 3,
    "same_crop_penalty": 0.5,
    "same_family_penalty": 0.3,
    "repeated_family_penalty": 0.2,
    "exhausting_after_exhausting_penalty": 0.2,
}}


def check(history, candidate):
    return check_rotation(history, candidate, CROPS, CONFIG)


def rules_of(result):
    return [issue["rule"] for issue in result["issues"]]


def test_perennial_has_no_rotation():
    out = check([{"crop": "ble", "year": 2025}], "olivier")
    assert out["applicable"] is False and out["note"] is None


def test_empty_history_is_not_evaluated():
    out = check([], "ble")
    assert out["note"] is None and rules_of(out) == ["historique_absent"]


def test_cereal_after_legume_is_good_with_benefit():
    out = check([{"crop": "pois", "year": 2025}], "ble")
    assert out["note"] == 1.0
    assert out["benefits"][0]["rule"] == "suite_a_legumineuse"


def test_same_crop_twice():
    out = check([{"crop": "ble", "year": 2025}], "ble")
    assert out["note"] == 0.5 and rules_of(out) == ["meme_culture_consecutive"]


def test_same_family_consecutive():
    out = check([{"crop": "orge", "year": 2025}], "ble")
    assert out["note"] == 0.7 and rules_of(out) == ["meme_famille_consecutive"]


def test_family_repeated_in_history_adds_penalty():
    history = [{"crop": "ble", "year": 2024}, {"crop": "orge", "year": 2025}]
    out = check(history, "ble")
    assert out["note"] == 0.5
    assert rules_of(out) == ["meme_famille_consecutive", "famille_repetee"]


def test_two_demanding_crops_in_a_row():
    out = check([{"crop": "pomme", "year": 2025}], "oignon")
    assert out["note"] == 0.8 and rules_of(out) == ["culture_exigeante_consecutive"]


def test_history_order_does_not_matter():
    history = [{"crop": "orge", "year": 2025}, {"crop": "pois", "year": 2023}]
    assert check(history, "ble")["note"] == 0.7   # la derniere est l'orge (2025)


def test_unknown_crop_in_history_is_ignored_with_warning():
    out = check([{"crop": "quinoa", "year": 2025}], "ble")
    assert out["note"] is None
    assert rules_of(out) == ["culture_inconnue", "historique_absent"]