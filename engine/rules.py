"""rules.py - filtres eliminatoires : pourquoi une culture est exclue."""

RULE_NAMES = {
    "temp_c": "temperature_hors_plage",
    "rain_mm": "pluie_hors_plage",
    "ph": "ph_hors_plage",
    "salinity_dsm": "salinite_hors_plage",
}


def evaluate_rules(scoring_result, inputs, crop, irrigated=False):
    """
    scoring_result : ce que renvoie score_crop()
    irrigated      : si True, une pluie insuffisante n'elimine pas la culture
                     (l'irrigation compense).
    Retourne la liste des exclusions (vide = culture non eliminee).
    """
    exclusions = []
    for criterion in scoring_result["blockers"]:
        if irrigated and criterion == "rain_mm":
            continue
        low, _, _, high = crop[criterion]
        value = inputs[criterion]
        exclusions.append({
            "rule": RULE_NAMES.get(criterion, criterion + "_hors_plage"),
            "criterion": criterion,
            "value": value,
            "allowed_range": [low, high],
            "detail": f"{criterion} = {value}, la culture supporte de {low} a {high}",
        })
    return exclusions