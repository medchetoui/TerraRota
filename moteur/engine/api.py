"""api.py - point d'entree du moteur : classe les cultures pour une parcelle."""
from .config import load_config, load_crops
from .scoring import score_crop
from .rules import evaluate_rules
from .contract import validate_input


def verdict_from_score(score, thresholds):
    if score >= thresholds["viable"]:
        return "viable"
    if score >= thresholds["risky"]:
        return "risky"
    return "not_recommended"


def recommend(parcel, irrigated=False, crops=None, config=None):
    """
    parcel    : conditions de la parcelle, ex. {"temp_c": 18, "rain_mm": 600}
    irrigated : si True, la pluie n'est ni notee ni eliminatoire
    Retourne : cultures classees, cultures exclues (avec raison),
               cultures non evaluables (aucune donnee utile).
    """
    config = load_config() if config is None else config
    crops = load_crops() if crops is None else crops
    thresholds = config["verdict_thresholds"]
    ignore = ("rain_mm",) if irrigated else ()

    ranked, excluded, not_evaluated = [], [], []

    for key, crop in crops.items():
        result = score_crop(parcel, crop, config, ignore=ignore)
        exclusions = evaluate_rules(result, parcel, crop, irrigated=irrigated)

        if exclusions:
            excluded.append({
                "crop": key,
                "name_fr": crop["name_fr"],
                "exclusions": exclusions,
            })
        elif result["score"] is None:
            not_evaluated.append({
                "crop": key,
                "name_fr": crop["name_fr"],
                "missing": result["missing"],
            })
        else:
            ranked.append({
                "crop": key,
                "name_fr": crop["name_fr"],
                "score": result["score"],
                "verdict": verdict_from_score(result["score"], thresholds),
                "breakdown": result["breakdown"],
                "missing": result["missing"],
            })

    ranked.sort(key=lambda item: item["score"], reverse=True)
    for position, item in enumerate(ranked, start=1):
        item["rank"] = position

    return {
        "ranked": ranked,
        "excluded": excluded,
        "not_evaluated": not_evaluated,
    }


def run(payload):
    """Point d'entree appele par Django."""
    issues = validate_input(payload)
    if any(issue["level"] == "error" for issue in issues):
        return {"status": "invalid_input", "issues": issues}

    result = recommend(
        payload["parcel"],
        irrigated=bool(payload.get("irrigated")),
    )
    result["status"] = "ok"
    result["issues"] = issues  # les avertissements restent visibles
    return result