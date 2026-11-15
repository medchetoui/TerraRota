"""Tests de l'endpoint des questions du fellah en darija."""
import json
import re
import wave

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from fellah import views

URL = "/api/v1/fellah/question/"


@pytest.fixture()
def client():
    return APIClient()


def poser(client, question, scenario=None):
    corps = {"question": question}
    if scenario:
        corps["scenario"] = scenario
    return client.post(URL, corps, format="json")


def test_scenarios_and_suggestions(client):
    d = client.get("/api/v1/fellah/scenarios/").json()
    assert [s["id"] for s in d["scenarios"]] == ["cereales_apres_cereale", "plan_equilibre"]
    assert len(d["suggestions"]) == 6 and len(d["questions_test"]) == 10
    assert all(re.search(r"[؀-ۿ]", s["question"]) for s in d["suggestions"])


@pytest.mark.parametrize("scenario", ["cereales_apres_cereale", "plan_equilibre"])
def test_ten_voice_questions_get_expected_type_in_both_scripts(client, scenario):
    for q in views.questions_voix():
        for texte in (q["a_dire"], q["ecriture_arabe"]):
            r = poser(client, texte, scenario).json()
            assert r["intention"] == q["type_attendu"], texte
            assert not q["culture_attendue"] or r["culture"] == q["culture_attendue"], texte
            assert not re.search(r"[0-9٠-٩]", r["texte"]), texte


def test_answer_is_darija_without_numbers_and_ends_with_advisor(client):
    r = poser(client, "واش نبقى نزرع القمح؟").json()
    assert r["intention"] == "AVIS_CULTURE" and r["culture"] == "ble_tendre"
    assert 1 <= len(r["phrases"]) <= 3 and re.search(r"[؀-ۿ]", r["texte"])
    assert not re.search(r"[0-9٠-٩]", r["texte"])
    assert r["phrases"][-1][0]["id"] == "hiba_mostachar"


def test_same_question_differs_by_plan(client):
    a = poser(client, "شنو نزرع هاد العام؟", "cereales_apres_cereale").json()["texte"]
    b = poser(client, "شنو نزرع هاد العام؟", "plan_equilibre").json()["texte"]
    assert a != b


def test_out_of_scope_question_never_invents_a_yield(client):
    r = poser(client, "شحال غادي نحصد؟").json()
    assert r["intention"] == "HORS_PERIMETRE" and [p["id"] for g in r["phrases"] for p in g] == ["hiba_hors_sujet"]


@pytest.mark.parametrize("corps", [{}, {"question": "   "}, {"question": "x" * 301}, {"question": "واش؟", "scenario": "inconnu"}])
def test_bad_requests_are_rejected(client, corps):
    assert client.post(URL, corps, format="json").status_code == 400


def test_audio_only_for_known_existing_clips(client, tmp_path, monkeypatch):
    monkeypatch.setattr(views, "AUDIO_DIR", tmp_path)
    r = poser(client, "شحال غادي نحصد؟").json()
    assert r["phrases"][0][0]["audio"] is None
    with wave.open(str(tmp_path / "hiba_hors_sujet.wav"), "wb") as w:
        w.setnchannels(1), w.setsampwidth(2), w.setframerate(16000), w.writeframes(b"\x00\x00" * 160)
    r = poser(client, "شحال غادي نحصد؟").json()
    assert r["phrases"][0][0]["audio"] == "/audio/darija/hiba_hors_sujet.wav"
    r = poser(client, "واش نبقى نزرع القمح؟").json()
    assert [p["audio"] for g in r["phrases"] for p in g if p["id"] == "hiba_mostachar"] == [None]


def test_default_audio_folder_is_frontend_public():
    assert views.AUDIO_DIR.parts[-4:] == ("frontend", "public", "audio", "darija")


def test_voice_journal_only_in_debug(client, tmp_path, monkeypatch):
    monkeypatch.setattr(views, "SORTIES", tmp_path)
    essai = {"methode": "navigateur", "langue": "ar-MA", "attendu_id": "V01", "transcription": "شنو نزرع",
             "intention": "QUOI_PLANTER", "culture": None, "reponse": "سول المستشار", "erreur": None,
             "ms": 1200, "autre": "ignoré"}
    with override_settings(DEBUG=True):
        assert client.post("/api/v1/fellah/journal/", essai, format="json").status_code == 200
    [journal] = tmp_path.glob("voix_app_*.jsonl")
    ligne = json.loads(journal.read_text(encoding="utf-8"))
    assert ligne["attendu_id"] == "V01" and ligne["reponse"] == "سول المستشار" and "autre" not in ligne
    with override_settings(DEBUG=False):
        assert client.post("/api/v1/fellah/journal/", essai, format="json").status_code == 404


@pytest.mark.parametrize("texte", ["سلام", "salam", "السلام، لاباس؟", "شنو هي عاصمة فرنسا؟", "؟؟", "123"])
def test_greetings_and_noise_get_a_clean_answer(client, texte):
    r = poser(client, texte)
    assert r.status_code == 200 and r.json()["intention"] == "HORS_PERIMETRE"
    assert "سول المستشار" in r.json()["texte"] and not re.search(r"[0-9]", r.json()["texte"])


# ─── Parcelle du formulaire → moteur du Membre 2 ───

PARCELLES = {
    "A": dict(previous_crop="wheat_hard", water_access="rainfed", soil_type="clay_loam", field_size_ha=4.8,
              data_status="live", annual_rain_mm=350, mean_annual_temp_c=18),
    "B": dict(previous_crop="chickpea", water_access="irrigated", soil_type="loam", field_size_ha=2,
              data_status="live", annual_rain_mm=450, mean_annual_temp_c=17),
    "C": dict(previous_crop="barley", water_access="rainfed", soil_type="sandy", field_size_ha=10,
              data_status="cached", annual_rain_mm=180, mean_annual_temp_c=24),
}
INCOMPLETE = dict(previous_crop="tomato", water_access="partial", soil_type="unknown", data_status="sample",
                  annual_rain_mm=300, mean_annual_temp_c=19)


def sur_parcelle(client, question, parcelle):
    r = client.post(URL, {"question": question, "parcelle": parcelle}, format="json")
    assert r.status_code == 200
    return r.json()


def ids(r):
    return [p["id"] for g in r["phrases"] for p in g]


def test_form_mapping_never_invents_values():
    from fellah.parcelle import entree_moteur
    parcels, plan, corr = entree_moteur(INCOMPLETE, annee=2026)
    p = parcels["P1"]
    assert p["conditions"] == {"temp_c": None, "rain_mm": None, "ph": None, "salinity_dsm": None}
    assert p["irrigated"] is None and p["history"] == [] and plan == []
    assert corr["rain_mm"] == corr["ph"] == corr["irrigated"] == corr["history"] == "inconnu"
    parcels, plan, corr = entree_moteur(PARCELLES["A"], culture="lentille", annee=2026)
    p = parcels["P1"]
    assert p["conditions"] == {"temp_c": 18.0, "rain_mm": 350.0, "ph": None, "salinity_dsm": None}
    assert p["irrigated"] is False and p["history"] == [{"crop": "ble_dur", "year": 2025}]
    assert plan == [{"parcel": "P1", "crop": "lentille", "area_ha": 4.8}]


def test_three_plots_give_different_coherent_answers(client):
    q = "شنو نزرع هاد العام؟"
    a, b, c = (sur_parcelle(client, q, PARCELLES[k]) for k in "ABC")
    assert len({a["texte"], b["texte"], c["texte"]}) == 3
    assert a["scenario"] == "parcelle" and a["parcelle"]["history"] == "ble_dur"
    assert "hiba_conseil_changer" in ids(a) and "hiba_conseil_changer" in ids(b)
    assert ids(c)[0] == "hiba_rien_conseille"
    assert sur_parcelle(client, "واش خاصني نسقي؟", PARCELLES["A"])["phrases"][0][0]["id"] == "hiba_eau_bour"
    assert sur_parcelle(client, "واش خاصني نسقي؟", PARCELLES["B"])["phrases"][0][0]["id"] == "hiba_eau_sqi"
    ble = sur_parcelle(client, "واش نبقى نزرع القمح؟", PARCELLES["A"])
    assert ble["culture"] == "ble_dur" and ids(ble)[:2] == ["hiba_culture_ble_dur", "hiba_culture_non"]
    assert ids(sur_parcelle(client, "واش نزرع العدس؟", PARCELLES["C"]))[:3] == [
        "hiba_culture_lentille", "hiba_culture_non", "hiba_raison_pluie_peu"]


def test_incomplete_plot_gives_clean_answer_and_advisor(client):
    for q in ("شنو نزرع هاد العام؟", "علاش هاد النصيحة؟", "واش الشتا غادي تكفي؟", "واش الأرض ديالي مزيانة؟",
              "واش خاصني نسقي؟", "واش نتيق فهاد النصيحة؟", "واش نزرع العدس؟"):
        r = sur_parcelle(client, q, INCOMPLETE)
        assert ids(r)[-1] == "hiba_mostachar" and ids(r).count("hiba_mostachar") == 1, q
        assert not re.search(r"[0-9٠-٩]", r["texte"]), q
    assert ids(sur_parcelle(client, "شنو نزرع هاد العام؟", INCOMPLETE))[0] == "hiba_raison_parcelle_inconnue"
    assert ids(sur_parcelle(client, "واش الشتا غادي تكفي؟", INCOMPLETE))[0] == "hiba_pluie_inconnue"
    assert ids(sur_parcelle(client, "واش خاصني نسقي؟", INCOMPLETE))[0] == "hiba_eau_inconnue"
    assert ids(sur_parcelle(client, "واش الأرض ديالي مزيانة؟", PARCELLES["A"]))[0] == "hiba_raison_parcelle_inconnue"


@pytest.mark.parametrize("parcelle", [{}, {"previous_crop": "???", "annual_rain_mm": "beaucoup", "data_status": "live"},
                                      {"field_size_ha": -3, "water_access": None}])
def test_odd_plot_inputs_never_crash(client, parcelle):
    r = sur_parcelle(client, "شنو نزرع هاد العام؟", parcelle)
    assert ids(r)[-1] == "hiba_mostachar"


def test_plot_must_be_an_object(client):
    assert client.post(URL, {"question": "واش؟", "parcelle": "P1"}, format="json").status_code == 400


# ─── Transcriptions en arabe standard ou en mélange (reconnaissance vocale du navigateur) ───

@pytest.mark.parametrize("texte,attendu,culture", [
    ("ماذا أزرع هذا العام؟", "QUOI_PLANTER", None),
    ("هل أستمر في القمح؟", "AVIS_CULTURE", "ble_tendre"),
    ("لماذا هذه النصيحة؟", "POURQUOI", None),
    ("هل ستمطر كثيرا؟", "PLUIE_METEO", None),
    ("هل أرضي جيدة؟", "SOL", None),
    ("ليس لدي ري ماذا أفعل؟", "EAU_IRRIGATION", None),
    ("هل أزرع العدس؟", "AVIS_CULTURE", "lentille"),
    ("هل أضع السماد؟", "HORS_PERIMETRE", None),
    ("هل أثق في هذه النصيحة؟", "FIABILITE", None),
    ("كم سيكون المحصول؟", "HORS_PERIMETRE", None),
])
def test_standard_arabic_transcripts_get_the_darija_type(client, texte, attendu, culture):
    r = poser(client, texte).json()
    assert r["intention"] == attendu and (culture is None or r["culture"] == culture)


# ─── Préparation de la démo : enregistrer les clips, relire les phrases (DEBUG seulement) ───

def _wav(secondes=1.0, frequence=16000, canaux=1):
    import io
    tampon = io.BytesIO()
    with wave.open(tampon, "wb") as w:
        w.setnchannels(canaux), w.setsampwidth(2), w.setframerate(frequence)
        w.writeframes(b"\x01\x00" * int(secondes * frequence) * canaux)
    return tampon.getvalue()


@pytest.fixture()
def atelier_tmp(tmp_path, monkeypatch):
    """Clips et phrases dans des copies temporaires (jamais les vrais fichiers)."""
    import functools
    import shutil
    from fellah.darija import repondre_darija as RD
    audio = tmp_path / "audio"
    audio.mkdir()
    phrases = tmp_path / "templates_darija.json"
    shutil.copy(RD.TEMPLATES_FILE, phrases)
    monkeypatch.setattr(views, "AUDIO_DIR", audio)

    @functools.lru_cache(maxsize=1)
    def modeles():
        return {m["id"]: m for m in json.loads(phrases.read_text(encoding="utf-8"))["modeles"]}
    monkeypatch.setattr(RD, "modeles", modeles)
    monkeypatch.setattr(RD, "TEMPLATES_FILE", phrases)
    with override_settings(DEBUG=True):
        yield audio, phrases


def test_demo_clip_list_matches_the_21_clips():
    from fellah import atelier
    ids = atelier.clips_demo()
    assert len(ids) == 21 and ids[0] == "hiba_verdict_partiel" and "hiba_mostachar" in ids


def test_record_clip_checks_name_and_format(client, atelier_tmp):
    audio, _ = atelier_tmp
    url = "/api/v1/fellah/clips/{}/"
    assert client.post(url.format("hiba_mostachar"), _wav(), content_type="audio/wav").status_code == 200
    assert (audio / "hiba_mostachar.wav").exists()
    assert client.post(url.format("inconnu"), _wav(), content_type="audio/wav").status_code == 400
    assert client.post(url.format("hiba_et"), _wav(canaux=2), content_type="audio/wav").status_code == 400
    assert client.post(url.format("hiba_et"), _wav(frequence=44100), content_type="audio/wav").status_code == 400
    assert client.post(url.format("hiba_et"), _wav(secondes=0.1), content_type="audio/wav").status_code == 400
    assert client.post(url.format("hiba_et"), b"pas un wav", content_type="audio/wav").status_code == 400
    assert not (audio / "hiba_et.wav").exists() and not (audio / "inconnu.wav").exists()
    etat = {p["id"]: p for p in client.get("/api/v1/fellah/phrases/").json()["phrases"]}
    assert etat["hiba_mostachar"]["present"] and not etat["hiba_et"]["present"]
    assert sum(p["demo"] for p in etat.values()) == 21
    r = poser(client, "شحال غادي نحصد؟").json()
    assert r["phrases"][0][0]["audio"] is None
    r = poser(client, "واش نبقى نزرع القمح؟").json()
    assert [p["audio"] for g in r["phrases"] for p in g if p["id"] == "hiba_mostachar"] == ["/audio/darija/hiba_mostachar.wav"]


def test_validate_and_modify_phrase_reruns_demo(client, atelier_tmp):
    audio, phrases = atelier_tmp
    client.post("/api/v1/fellah/clips/hiba_mostachar/", _wav(), content_type="audio/wav")
    r = client.post("/api/v1/fellah/phrases/hiba_et/", {"action": "ok"}, format="json").json()
    assert r["statut"] == "validé par Ranya" and not r["modifiee"]
    assert r["demo"] == {"questions": 40, "type_correct": 40, "reponses_avec_chiffres": 0}
    r = client.post("/api/v1/fellah/phrases/hiba_mostachar/", {"action": "modifier", "texte_darija": "سول المستشار الفلاحي قبل ما تزرع."},
                    format="json").json()
    assert r["modifiee"] and r["a_refaire"] and r["demo"]["type_correct"] == 40
    m = {x["id"]: x for x in json.loads(phrases.read_text(encoding="utf-8"))["modeles"]}["hiba_mostachar"]
    assert m["texte_darija"] == "سول المستشار الفلاحي قبل ما تزرع." and m["texte_avant"] == "سول المستشار قبل ما تزرع."
    assert "سول المستشار الفلاحي" in poser(client, "واش نبقى نزرع القمح؟").json()["texte"]
    for mauvais in ("", "Demandez au conseiller", "سول المستشار 3 مرات", "س" * 201):
        assert client.post("/api/v1/fellah/phrases/hiba_et/", {"action": "modifier", "texte_darija": mauvais},
                           format="json").status_code == 400
    assert client.post("/api/v1/fellah/phrases/inconnue/", {"action": "ok"}, format="json").status_code == 400


def test_demo_tools_are_off_outside_debug(client):
    with override_settings(DEBUG=False):
        assert client.get("/api/v1/fellah/phrases/").status_code == 404
        assert client.post("/api/v1/fellah/clips/hiba_et/", _wav(), content_type="audio/wav").status_code == 404
        assert client.post("/api/v1/fellah/phrases/hiba_et/", {"action": "ok"}, format="json").status_code == 404


# ─── Voix de synthèse : générée une fois, jamais à la place d'un enregistrement humain ───

def test_synthetic_voice_never_replaces_a_human_clip_and_is_labelled(client, atelier_tmp):
    from fellah import generer_voix_synthese as G
    audio, _ = atelier_tmp
    lus = []

    def faux_tts(texte, voix, chemin):
        lus.append(texte)
        chemin.write_bytes(_wav())

    def fausse_conversion(source, cible):
        cible.write_bytes(source.read_bytes())

    client.post("/api/v1/fellah/clips/hiba_mostachar/", _wav(), content_type="audio/wav")
    humain = (audio / "hiba_mostachar.wav").read_bytes()
    ids = ["hiba_mostachar", "hiba_alternative", "hiba_culture_pois_chiche", "hiba_culture_ble_tendre", "hiba_culture_non"]
    bilan = G.generer(audio, ids, synthetiser=faux_tts, convertir=fausse_conversion)
    assert bilan["humains_gardes"] == ["hiba_mostachar"] and len(bilan["generes"]) == 4
    assert (audio / "hiba_mostachar.wav").read_bytes() == humain
    from fellah.darija import repondre_darija as RD
    assert lus == [RD.modeles()[i]["texte_darija"] for i in ids[1:]]
    r = poser(client, "واش نبقى نزرع القمح؟").json()
    voix = {p["id"]: p["voix"] for g in r["phrases"] for p in g}
    assert voix["hiba_mostachar"] == "humaine" and voix["hiba_alternative"] == "synthese"
    assert G.generer(audio, ids, synthetiser=faux_tts, convertir=fausse_conversion)["deja_faits"] == ids[1:]
    client.post("/api/v1/fellah/clips/hiba_alternative/", _wav(), content_type="audio/wav")
    r = poser(client, "واش نبقى نزرع القمح؟").json()
    assert {p["id"]: p["voix"] for g in r["phrases"] for p in g}["hiba_alternative"] == "humaine"


def test_synthetic_voice_failure_leaves_clip_absent(atelier_tmp):
    from fellah import generer_voix_synthese as G
    audio, _ = atelier_tmp

    def panne(texte, voix, chemin):
        raise ConnectionError("pas d'internet")

    bilan = G.generer(audio, ["hiba_et"], synthetiser=panne, convertir=lambda s, c: None)
    assert bilan["erreurs"] and not (audio / "hiba_et.wav").exists()
