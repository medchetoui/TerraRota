"""indicators.py - position des conditions climatiques face aux seuils de chaque culture
(les memes seuils que le moteur, donc la page ne peut pas le contredire)."""
from .config import load_config, load_crops
from .plan import _assess


def climate_fit(conditions, crops=None, config=None, irrigated=False):
    config = load_config() if config is None else config
    crops = load_crops() if crops is None else crops
    parcel = {"conditions": conditions, "irrigated": irrigated}
    rows = []
    for key, crop in crops.items():
        res = _assess(key, parcel, crops, config)
        position = {c["criterion"]: c["position"] for c in res["criteria"]}
        rows.append({"crop": key, "name_fr": crop["name_fr"], "family": crop["family"],
                     "type": crop["type"], "score": res["agro_score"],
                     "excluded": bool(res["exclusions"]),
                     "temp": position.get("temp_c"), "rain": position.get("rain_mm")})
    rows.sort(key=lambda r: (-(r["score"] or 0), r["crop"]))
    return rows