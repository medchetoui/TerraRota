"""contract.py - format d'entree et de sortie du moteur (version 1)."""
from .config import load_config

CONTRACT_VERSION = "1.0"
RANKED_FIELDS = ("crop", "name_fr", "score", "verdict", "rank")
VERDICTS = ("viable", "risky", "not_recommended")


def _is_number(value):
    # bool est un sous-type de int en Python : True compterait comme 1, on l'exclut
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def validate_input(payload):
    """Retourne la liste des problemes (vide = entree correcte)."""
    if not isinstance(payload, dict):
        return [{"field": "payload", "problem": "doit etre un dictionnaire", "level": "error"}]

    parcel = payload.get("parcel")
    if not isinstance(parcel, dict):
        return [{"field": "parcel", "problem": "obligatoire, doit etre un dictionnaire", "level": "error"}]

    issues = []
    known = load_config()["weights"].keys()

    for name, value in parcel.items():
        if name not in known:
            issues.append({"field": f"parcel.{name}", "problem": "critere inconnu, ignore", "level": "warning"})
        elif value is not None and not _is_number(value):
            issues.append({"field": f"parcel.{name}", "problem": "doit etre un nombre ou null", "level": "error"})

    if not any(_is_number(parcel.get(name)) for name in known):
        issues.append({"field": "parcel", "problem": "aucune donnee exploitable", "level": "warning"})

    irrigated = payload.get("irrigated")
    if irrigated is not None and not isinstance(irrigated, bool):
        issues.append({"field": "irrigated", "problem": "doit etre true, false ou absent", "level": "error"})

    return issues


def validate_output(result):
    """Verifie qu'une sortie respecte le contrat. Retourne la liste des problemes."""
    problems = []
    for key in ("ranked", "excluded", "not_evaluated"):
        if not isinstance(result.get(key), list):
            problems.append(f"'{key}' doit etre une liste")
    if problems:
        return problems

    for item in result["ranked"]:
        missing = [f for f in RANKED_FIELDS if f not in item]
        if missing:
            problems.append(f"{item.get('crop', '?')} : champs manquants {missing}")
            continue
        if not 0 <= item["score"] <= 100:
            problems.append(f"{item['crop']} : score hors de 0-100")
        if item["verdict"] not in VERDICTS:
            problems.append(f"{item['crop']} : verdict inconnu")

    ranks = [item.get("rank") for item in result["ranked"]]
    if ranks != list(range(1, len(ranks) + 1)):
        problems.append("les rangs doivent etre 1, 2, 3...")

    scores = [item["score"] for item in result["ranked"] if "score" in item]
    if scores != sorted(scores, reverse=True):
        problems.append("le classement n'est pas trie par score decroissant")

    return problems