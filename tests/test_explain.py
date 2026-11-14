from engine.explain import explain_line, explain_plan, to_text

CROPS = {"ble": {"name_fr": "Blé", "verified": True, "locally_validated": True}}
CONF = {"level": "high", "value": 1.0, "percent": 100, "reasons": []}


def make_line(**changes):
    line = {
        "parcel": "P1", "crop": "ble", "area_ha": 2, "name_fr": "Blé", "status": "ok",
        "score": 90, "agro_score": 90, "rotation_note": 1.0,
        "exclusions": [], "rotation_issues": [], "rotation_benefits": [],
        "missing": [], "confidence": CONF, "alternatives": [],
    }
    line.update(changes)
    return line


def test_good_line():
    out = explain_line(make_line(), CROPS)
    assert out["headline"] == "Blé sur P1 : bon choix."
    assert out["score_text"] == "Adéquation au terrain : 90 sur 100."
    assert out["suggestion"] is None
    assert out["cautions"] == ["Fiabilité des données : 100 % (élevée)."]


def test_good_line_explains_why_it_fits():
    line = make_line(criteria=[
        {"criterion": "temp_c", "value": 18, "position": "optimal",
         "optimal": [15, 23], "tolerated": [5, 27]},
        {"criterion": "rain_mm", "value": 500, "position": "tolerable",
         "optimal": [750, 900], "tolerated": [300, 1600]}])
    reasons = explain_line(line, CROPS)["reasons"]
    assert "La température (18 °C) est dans la plage idéale de cette culture (de 15 °C à 23 °C)." in reasons
    assert any("acceptable" in r and "500 mm" in r for r in reasons)


def test_rotation_penalty_with_alternative():
    line = make_line(
        status="risky", score=45, rotation_note=0.5,
        rotation_issues=[{"rule": "meme_culture_consecutive", "level": "warning", "detail": ""}],
        alternatives=[{"crop": "pois", "name_fr": "Pois chiche", "score": 87, "gain": 42}],
    )
    out = explain_line(line, CROPS)
    assert "90 sur 100" in out["score_text"] and "45 sur 100" in out["score_text"]
    assert "déjà été cultivée" in out["reasons"][0]
    assert "Pois chiche (score 87 sur 100, +42 points)" in out["suggestion"]


def test_excluded_line_has_reason_and_no_score():
    line = make_line(
        status="not_recommended", score=40,
        exclusions=[{"rule": "temperature_hors_plage", "criterion": "temp_c",
                     "value": 32, "allowed_range": [5, 27], "detail": ""}],
    )
    out = explain_line(line, CROPS)
    assert out["reasons"][0] == ("La température (32 °C) est hors de ce que cette culture supporte "
                                 "(de 5 °C à 27 °C).")
    assert out["score_text"] is None
    assert out["suggestion"] == "Aucune alternative meilleure n'a été trouvée avec les données disponibles."


def test_legume_benefit_is_a_reason():
    line = make_line(rotation_benefits=[{"rule": "suite_a_legumineuse", "detail": ""}])
    assert "enrichit le sol en azote" in explain_line(line, CROPS)["reasons"][0]


def test_missing_data_and_history_are_cautions():
    line = make_line(
        missing=["rain_mm", "ph"],
        rotation_issues=[{"rule": "historique_absent", "level": "info", "detail": ""}],
    )
    out = explain_line(line, CROPS)
    assert "Données manquantes : la pluie, le pH du sol." in out["cautions"]
    assert any("Aucun historique" in c for c in out["cautions"])
    assert out["reasons"] == []


def test_unverified_and_unvalidated_crop_cautions():
    out = explain_line(make_line(), {"ble": {"name_fr": "Blé"}})
    assert "Les seuils de cette culture n'ont pas été vérifiés." in out["cautions"]
    assert "Les seuils de cette culture n'ont pas encore été validés localement." in out["cautions"]


def test_unknown_irrigation_is_a_caution():
    conf = {**CONF, "reasons": ["irrigation inconnue"]}
    out = explain_line(make_line(confidence=conf), CROPS)
    assert "On ne sait pas si la parcelle est irriguée." in out["cautions"]


def test_unknown_crop_line():
    line = {"parcel": "P1", "crop": "quinoa", "area_ha": None, "status": "unknown_crop"}
    out = explain_line(line, CROPS)
    assert "quinoa" in out["headline"] and out["reasons"] == []


def test_ok_line_with_better_option_gets_suggestion():
    line = make_line(alternatives=[
        {"crop": "pois", "name_fr": "Pois chiche", "score": 100, "gain": 25}])
    assert explain_line(line, CROPS)["suggestion"] == (
        "Une meilleure option existe : Pois chiche (score 100 sur 100, +25 points).")


# ---------------------------------------------------------------- plan

PLAN_CONF = {"level": "high", "percent": 85}


def make_result(lines, verdict="partially_viable", issues=(), confidence=PLAN_CONF):
    return {"verdict": verdict, "lines": list(lines),
            "plan_issues": list(issues), "confidence": confidence}


def test_plan_headline_summary_and_confidence():
    risky = make_line(status="risky", score=45)
    out = explain_plan(make_result([make_line(), risky]), CROPS)
    assert out["headline"] == "Plan : en partie viable."
    assert out["summary"] == "Lignes évaluées : 2 (bons choix : 1, à risque : 1, à éviter : 0)."
    assert "85 %" in out["confidence_text"] and len(out["lines"]) == 2


def test_proposed_plan_headline():
    out = explain_plan(make_result([make_line()], verdict="viable"), CROPS, proposed=True)
    assert out["headline"] == "Plan proposé : viable."


def test_family_concentration_uses_friendly_name():
    issue = {"rule": "concentration_famille", "level": "warning", "detail": "",
             "family": "poaceae", "percent": 75}
    out = explain_plan(make_result([make_line()], issues=[issue]), CROPS)
    assert "75 % du plan est dans la même famille de cultures (céréales)" in out["issues"][0]


def test_ignored_lines_are_counted():
    unknown = {"parcel": "P1", "crop": "quinoa", "area_ha": None, "status": "unknown_crop"}
    out = explain_plan(make_result([make_line(), unknown]), CROPS)
    assert out["summary"].endswith("Lignes ignorées : 1.")


def test_plan_with_nothing_evaluable():
    unknown = {"parcel": "P1", "crop": "quinoa", "area_ha": None, "status": "unknown_crop"}
    out = explain_plan(make_result([unknown], verdict="not_evaluated", confidence=None), CROPS)
    assert out["summary"] == "Aucune ligne du plan n'a pu être évaluée."
    assert out["confidence_text"] is None


def test_high_confidence_is_not_a_caution_in_a_plan():
    out = explain_plan(make_result([make_line()]), CROPS)
    assert out["lines"][0]["cautions"] == []


def test_medium_confidence_is_still_a_caution_in_a_plan():
    conf = {"level": "medium", "value": 0.6, "percent": 60, "reasons": []}
    out = explain_plan(make_result([make_line(confidence=conf)]), CROPS)
    assert "Fiabilité des données : 60 % (moyenne)." in out["lines"][0]["cautions"]


def test_threshold_warnings_are_said_once_for_the_plan():
    crops = {"ble": {"name_fr": "Blé"}}
    lines = [make_line(), make_line(parcel="P2")]
    out = explain_plan(make_result(lines), crops)
    assert out["notes"] == ["Seuils non vérifiés pour : Blé.",
                            "Seuils pas encore validés localement pour : Blé."]
    for line in out["lines"]:
        assert not any("seuils" in c.lower() for c in line["cautions"])


def test_to_text_contains_the_key_sentences():
    text = to_text(explain_plan(make_result([make_line()], verdict="viable"), CROPS))
    assert "Plan : viable." in text
    assert "Ligne 1 - Blé sur P1 : bon choix." in text
    assert "Fiabilité du plan : 85 % (élevée)" in text
    assert "Précaution : Fiabilité des données" not in text


def test_to_text_starts_with_the_glossary():
    text = to_text(explain_plan(make_result([make_line()], verdict="viable"), CROPS))
    assert text.startswith("Définitions à respecter")
    assert "PAS une probabilité" in text


def test_glossary_can_be_turned_off():
    text = to_text(explain_plan(make_result([make_line()], verdict="viable"), CROPS),
                   with_glossary=False)
    assert text.startswith("Plan : viable.")
def test_cereal_only_tip_and_composition_text():
    result = make_result([make_line()])
    result["composition"] = [{"family": "poaceae", "percent": 100}]
    result["tips"] = [{"rule": "une_seule_famille", "family": "poaceae",
                       "suggestions": {"P1": [{"crop": "pois", "name_fr": "Pois chiche", "score": 100}]}}]
    out = explain_plan(result, CROPS)
    assert out["composition_text"] == "Composition du plan : céréales 100 %."
    assert "ne contient que des céréales" in out["tips"][0]
    assert "Légumineuses adaptées à P1 : Pois chiche (100 sur 100)." in out["tips"][0]
    assert "Astuce : " in to_text(out)    