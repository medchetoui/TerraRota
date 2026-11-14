"""confidence.py - a quel point peut-on faire confiance a un resultat ?"""
from .config import load_config


def level_from_value(value, config):
    settings = config["confidence"]
    if value >= settings["high"]:
        return "high"
    if value >= settings["medium"]:
        return "medium"
    return "low"


def assess_confidence(missing, crop, rotation_applicable, rotation_note, irrigated, config=None):
    """
    missing             : criteres sans donnee (renvoyes par score_crop)
    crop                : l'entree de la culture dans crops_reference.json
    rotation_applicable : False pour une culture perenne
    rotation_note       : note de rotation, ou None si non evaluee
    irrigated           : True, False, ou None si on ne sait pas
    Retourne : level (high / medium / low), value (0 a 1), percent (0 a 100),
               reasons (phrases).
    """
    config = load_config() if config is None else config
    weights = config["weights"]
    settings = config["confidence"]

    # 1. part du poids total qui manque
    total_weight = sum(weights.values())
    missing_weight = sum(weights[c] for c in missing if c in weights)
    value = 1.0 - missing_weight / total_weight
    reasons = []

    if missing:
        reasons.append("donnees manquantes : " + ", ".join(missing))

    # 2. culture non verifiee
    if not crop.get("verified", False):
        value -= settings["unverified_crop_penalty"]
        reasons.append("seuils de la culture non verifies")

    # 3. seuils non valides localement
    #    (seulement si la penalite est configuree : pas de raison sans effet sur le score)
    local_penalty = settings.get("unvalidated_crop_penalty", 0)
    if local_penalty > 0 and not crop.get("locally_validated", False):
        value -= local_penalty
        reasons.append("seuils non valides localement (base ECOCROP mondiale)")

    # 4. rotation non evaluee (seulement si elle devrait l'etre)
    if rotation_applicable and rotation_note is None:
        value -= settings["rotation_unknown_penalty"]
        reasons.append("historique absent : rotation non evaluee")

    # 5. irrigation inconnue
    if irrigated is None:
        value -= settings["irrigation_unknown_penalty"]
        reasons.append("irrigation inconnue")

    value = max(0.0, round(value, 2))

    return {
        "level": level_from_value(value, config),
        "value": value,
        "percent": round(value * 100),
        "reasons": reasons,
    }