"""rotation.py - la culture candidate s'enchaine-t-elle bien avec l'historique ?"""
from .config import load_config


def check_rotation(history, candidate, crops, config=None):
    """
    history   : liste de {"crop": "orge", "year": 2025}, dans n'importe quel ordre
    candidate : cle de la culture envisagee (ex. "ble_tendre")
    Retourne : applicable, note (0-1 ou None), issues, benefits.
    """
    config = load_config() if config is None else config
    rules = config["rotation"]
    crop = crops[candidate]

    if crop["type"] == "perennial":
        return {"applicable": False, "note": None, "issues": [], "benefits": []}

    issues = []
    known = []
    for entry in history:
        if entry.get("crop") in crops:
            known.append(entry)
        else:
            issues.append({"rule": "culture_inconnue", "level": "warning",
                           "detail": f"'{entry.get('crop')}' absente de la table, ignoree"})

    if not known:
        issues.append({"rule": "historique_absent", "level": "info",
                       "detail": "pas d'historique exploitable, rotation non evaluee"})
        return {"applicable": True, "note": None, "issues": issues, "benefits": []}

    known.sort(key=lambda entry: entry.get("year", 0))
    last_key = known[-1]["crop"]
    last = crops[last_key]

    note = 1.0
    benefits = []

    if last_key == candidate:
        note -= rules["same_crop_penalty"]
        issues.append({"rule": "meme_culture_consecutive", "level": "warning",
                       "detail": f"{candidate} deja cultivee la saison precedente"})
    elif last["family"] == crop["family"]:
        note -= rules["same_family_penalty"]
        issues.append({"rule": "meme_famille_consecutive", "level": "warning",
                       "detail": f"meme famille ({crop['family']}) que {last_key}"})

    recent = known[-rules["window_years"]:]
    same_family = [e for e in recent if crops[e["crop"]]["family"] == crop["family"]]
    if len(same_family) >= 2:
        note -= rules["repeated_family_penalty"]
        issues.append({"rule": "famille_repetee", "level": "warning",
                       "detail": f"{len(same_family)} fois la famille {crop['family']} recemment"})

    if last.get("soil_effect") == "exhausting" and crop.get("soil_effect") == "exhausting":
        note -= rules["exhausting_after_exhausting_penalty"]
        issues.append({"rule": "culture_exigeante_consecutive", "level": "warning",
                       "detail": f"{candidate} apres {last_key}, deux cultures exigeantes"})

    if last.get("soil_effect") == "fixes_nitrogen" and last["family"] != crop["family"]:
        benefits.append({"rule": "suite_a_legumineuse",
                         "detail": f"{last_key} enrichit le sol en azote"})

    return {"applicable": True, "note": max(0.0, round(note, 2)),
            "issues": issues, "benefits": benefits}