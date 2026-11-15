"""Questions du fellah en darija : la question (texte, écrit ou reconnu par le navigateur) reçoit une réponse
en phrases darija enregistrées, construite sur la sortie du moteur du Membre 2 (moteur/engine, report.analyze).

Aucun modèle de langage, aucun appel réseau : réponse instantanée, jamais de nombre inventé.
Les clips audio (voix humaine) sont dans fellah/darija/audio/ ; un clip absent = texte seul.
"""
import csv
import json
import time
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .darija import repondre_darija as RD

DARIJA_DIR = Path(RD.__file__).resolve().parent
AUDIO_DIR = DARIJA_DIR / "audio"
JOURNAL_VOIX = Path(settings.BASE_DIR) / "sorties" / "voix_app_journal.jsonl"
SCENARIO_DEFAUT = "cereales_apres_cereale"
SCENARIOS = {
    "cereales_apres_cereale": {"darija": "قمح من بعد قمح", "fr": "Blé après blé (plan à corriger)"},
    "plan_equilibre": {"darija": "بلان متوازن", "fr": "Plan équilibré (plan gardé)"},
}
SUGGESTIONS = ("V01", "V02", "V03", "V09", "V10", "V07")
LONGUEUR_MAX = 300


def questions_voix():
    with open(DARIJA_DIR / "questions_voix.csv", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def _phrases(resultat):
    modeles = RD.modeles()
    out = []
    for groupe in resultat["phrases"]:
        out.append([{
            "id": i,
            "darija": modeles[i]["texte_darija"],
            "fr": modeles[i]["traduction_fr"],
            "audio": f"/api/v1/fellah/audio/{i}.wav" if (AUDIO_DIR / f"{i}.wav").exists() else None,
        } for i in groupe])
    return out


@api_view(["GET"])
def scenarios(request):
    voix = {q["id"]: q for q in questions_voix()}
    return Response({
        "scenarios": [{"id": k, **v} for k, v in SCENARIOS.items()],
        "defaut": SCENARIO_DEFAUT,
        "suggestions": [{"question": voix[i]["ecriture_arabe"], "fr": voix[i]["traduction_fr"]} for i in SUGGESTIONS],
        "questions_test": questions_voix(),
        "journal": bool(settings.DEBUG),
        "badge": "Démo — moteur du Membre 2, données d'exemple",
    })


@api_view(["POST"])
def question(request):
    texte = str(request.data.get("question") or "").strip()
    scenario = request.data.get("scenario") or SCENARIO_DEFAUT
    if not texte or len(texte) > LONGUEUR_MAX:
        return Response({"status": "error", "message": "question vide ou trop longue"}, status=status.HTTP_400_BAD_REQUEST)
    if scenario not in SCENARIOS:
        return Response({"status": "error", "message": "scénario inconnu"}, status=status.HTTP_400_BAD_REQUEST)
    t0 = time.perf_counter()
    r = RD.repondre_darija(texte, scenario)
    phrases = _phrases(r)
    return Response({
        "question": texte,
        "scenario": scenario,
        "intention": r["intention"],
        "culture": r["culture_citee"],
        "phrases": phrases,
        "texte": " ".join(p["darija"] for g in phrases for p in g),
        "ms": round((time.perf_counter() - t0) * 1000, 1),
    })


def audio(request, clip):
    if clip not in RD.modeles() or not (AUDIO_DIR / f"{clip}.wav").exists():
        raise Http404("clip absent")
    return FileResponse(open(AUDIO_DIR / f"{clip}.wav", "rb"), content_type="audio/wav")


@api_view(["POST"])
def journal(request):
    """Essai de reconnaissance vocale (test des 10 questions) ; seulement en développement (DEBUG)."""
    if not settings.DEBUG:
        raise Http404()
    champs = ("methode", "langue", "attendu_id", "transcription", "intention", "culture", "ms")
    ligne = {k: request.data.get(k) for k in champs}
    ligne["quand"] = datetime.now().isoformat(timespec="seconds")
    JOURNAL_VOIX.parent.mkdir(parents=True, exist_ok=True)
    with open(JOURNAL_VOIX, "a", encoding="utf-8") as f:
        f.write(json.dumps(ligne, ensure_ascii=False) + "\n")
    return Response(ligne)
