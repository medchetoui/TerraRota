"""Questions du fellah en darija : la question (texte, écrit ou reconnu par le navigateur) reçoit une réponse
en phrases darija enregistrées, construite sur la sortie du moteur du Membre 2 (moteur/engine, report.analyze).

Aucun modèle de langage, aucun appel réseau : réponse instantanée, jamais de nombre inventé.
Les clips audio (voix humaine) sont servis par le frontend : frontend/public/audio/darija/<id>.wav
(dossier modifiable avec la variable FELLAH_AUDIO_DIR) ; un clip absent = texte seul.
"""
import csv
import json
import os
import time
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.http import Http404, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import atelier
from .darija import repondre_darija as RD
from .parcelle import CHAMPS_PARCELLE, scenario_parcelle

DARIJA_DIR = Path(RD.__file__).resolve().parent
AUDIO_DIR = Path(os.environ.get("FELLAH_AUDIO_DIR")
                 or Path(settings.BASE_DIR).parent / "frontend" / "public" / "audio" / "darija")
AUDIO_URL = "/audio/darija/"
SORTIES = Path(settings.BASE_DIR) / "sorties"
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
            "audio": f"{AUDIO_URL}{i}.wav" if (AUDIO_DIR / f"{i}.wav").exists() else None,
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
    """Question du fellah. Avec « parcelle » (champs du formulaire et indicateurs NASA déjà calculés) : le moteur
    du Membre 2 est lancé sur CETTE parcelle ; sans « parcelle » : un des 2 scénarios de démo."""
    texte = str(request.data.get("question") or "").strip()
    formulaire = request.data.get("parcelle")
    scenario = request.data.get("scenario") or SCENARIO_DEFAUT
    if not texte or len(texte) > LONGUEUR_MAX:
        return Response({"status": "error", "message": "question vide ou trop longue"}, status=status.HTTP_400_BAD_REQUEST)
    if formulaire is not None and not isinstance(formulaire, dict):
        return Response({"status": "error", "message": "parcelle invalide"}, status=status.HTTP_400_BAD_REQUEST)
    if formulaire is None and scenario not in SCENARIOS:
        return Response({"status": "error", "message": "scénario inconnu"}, status=status.HTTP_400_BAD_REQUEST)
    t0 = time.perf_counter()
    correspondance = None
    if formulaire is not None:
        sc = scenario_parcelle({k: formulaire.get(k) for k in CHAMPS_PARCELLE}, RD.culture_citee(texte), question=texte)
        correspondance, scenario = sc["correspondance"], "parcelle"
        r = RD.repondre_darija(texte, sc)
    else:
        r = RD.repondre_darija(texte, scenario)
    phrases = _phrases(r)
    return Response({
        "question": texte,
        "scenario": scenario,
        "parcelle": correspondance,
        "intention": r["intention"],
        "culture": r["culture_citee"],
        "phrases": phrases,
        "texte": " ".join(p["darija"] for g in phrases for p in g),
        "ms": round((time.perf_counter() - t0) * 1000, 1),
    })


@api_view(["POST"])
def journal(request):
    """Essai de reconnaissance vocale (test des 10 questions) ; seulement en développement (DEBUG)."""
    if not settings.DEBUG:
        raise Http404()
    champs = ("methode", "langue", "attendu_id", "transcription", "intention", "culture", "reponse", "erreur", "ms")
    ligne = {k: request.data.get(k) for k in champs}
    maintenant = datetime.now()
    ligne["quand"] = maintenant.isoformat(timespec="seconds")
    SORTIES.mkdir(parents=True, exist_ok=True)
    with open(SORTIES / f"voix_app_{maintenant:%Y%m%d}.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(ligne, ensure_ascii=False) + "\n")
    return Response(ligne)


# ─── Préparation de la démo (développement seulement) : enregistrer les clips, relire les phrases ───

def _dev():
    if not settings.DEBUG:
        raise Http404()


@api_view(["GET"])
def phrases(request):
    _dev()
    return Response({"phrases": atelier.etat_phrases(AUDIO_DIR), "audio_url": AUDIO_URL})


@csrf_exempt
def clip(request, clip_id):
    """POST : corps = WAV mono 16 bits (converti par le navigateur) ; écrit frontend/public/audio/darija/<id>.wav."""
    _dev()
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "POST attendu"}, status=405)
    info, probleme = atelier.enregistrer_clip(clip_id, request.body, AUDIO_DIR)
    if probleme:
        return JsonResponse({"status": "error", "message": probleme}, status=400)
    return JsonResponse({"status": "ok", "id": clip_id, **info, "audio": f"{AUDIO_URL}{clip_id}.wav"})


@api_view(["POST"])
def phrase(request, phrase_id):
    """{"action": "ok"} valide la phrase ; {"action": "modifier", "texte_darija": "..."} la remplace.
    Les 20 questions de test sont ensuite relancées sur les 2 scénarios de démo."""
    _dev()
    action = request.data.get("action")
    if action not in ("ok", "modifier"):
        return Response({"status": "error", "message": "action ok ou modifier"}, status=status.HTTP_400_BAD_REQUEST)
    texte = request.data.get("texte_darija") if action == "modifier" else None
    if action == "modifier" and texte is None:
        return Response({"status": "error", "message": "texte_darija manquant"}, status=status.HTTP_400_BAD_REQUEST)
    resultat, probleme = atelier.valider_phrase(phrase_id, texte)
    if probleme:
        return Response({"status": "error", "message": probleme}, status=status.HTTP_400_BAD_REQUEST)
    etat = next(p for p in atelier.etat_phrases(AUDIO_DIR) if p["id"] == phrase_id)
    return Response({**resultat, "a_refaire": etat["a_refaire"], "demo": atelier.relancer_demo()})
