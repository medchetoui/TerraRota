"""scoring.py - note de 0 a 100 d'une culture pour une parcelle."""
from .config import load_config


def trapezoid(x, a, b, c, d):
    """
    Note de 0 a 1 d'une valeur x pour une plage [a, b, c, d]
    (minimum absolu, optimum bas, optimum haut, maximum absolu).
      - x hors de [a, d]      -> 0   (la culture ne survit pas)
      - x dans [b, c]         -> 1   (zone optimale)
      - entre a et b, c et d  -> progressif
      - x inconnu (None)      -> None
    """
    if x is None:
        return None
    if x < a or x > d:
        return 0.0
    if x < b:
        return (x - a) / (b - a)
    if x <= c:
        return 1.0
    return (d - x) / (d - c)
def score_crop(inputs, crop, config=None,ignore=()):
    """
    inputs : conditions de la parcelle, ex. {"temp_c": 18, "rain_mm": 600, "ph": 6.5}
    crop   : une entree de crops_reference.json
    Retourne : score (0-100 ou None), detail par critere, criteres manquants,
               criteres bloquants (note = 0).
    """
    config = config or load_config()
    weights = config["weights"]

    breakdown = {}
    missing = []
    blockers = []
    weighted_sum = 0.0
    weight_used = 0.0

    for criterion, weight in weights.items():
        if criterion in ignore:
            continue
        limits = crop.get(criterion)
        if limits is None:
            continue  # cette culture n'a pas ce critere : on l'ignore
        value = inputs.get(criterion)
        note = trapezoid(value, *limits)
        if note is None:
            missing.append(criterion)  # donnee absente : ni 0, ni compte
            continue
        breakdown[criterion] = {"value": value, "note": round(note, 2)}
        if note == 0.0:
            blockers.append(criterion)
        weighted_sum += note * weight
        weight_used += weight

    score = round(100 * weighted_sum / weight_used) if weight_used > 0 else None
    return {
        "score": score,
        "breakdown": breakdown,
        "missing": missing,
        "blockers": blockers,
    }