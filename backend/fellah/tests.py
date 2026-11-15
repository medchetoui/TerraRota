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
    assert r["phrases"][0][0]["audio"] == "/api/v1/fellah/audio/hiba_hors_sujet.wav"
    assert client.get("/api/v1/fellah/audio/hiba_hors_sujet.wav").status_code == 200
    assert client.get("/api/v1/fellah/audio/hiba_mostachar.wav").status_code == 404
    assert client.get("/api/v1/fellah/audio/..%2Fsettings.wav").status_code == 404


def test_voice_journal_only_in_debug(client, tmp_path, monkeypatch):
    monkeypatch.setattr(views, "JOURNAL_VOIX", tmp_path / "journal.jsonl")
    essai = {"methode": "navigateur", "langue": "ar-MA", "attendu_id": "V01", "transcription": "شنو نزرع",
             "intention": "QUOI_PLANTER", "culture": None, "ms": 1200, "autre": "ignoré"}
    with override_settings(DEBUG=True):
        assert client.post("/api/v1/fellah/journal/", essai, format="json").status_code == 200
    ligne = json.loads((tmp_path / "journal.jsonl").read_text(encoding="utf-8"))
    assert ligne["attendu_id"] == "V01" and "autre" not in ligne
    with override_settings(DEBUG=False):
        assert client.post("/api/v1/fellah/journal/", essai, format="json").status_code == 404
