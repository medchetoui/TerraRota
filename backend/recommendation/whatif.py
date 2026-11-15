"""
TerraRota What-If Agricultural Scenario Simulator.

Allows farmers and agronomists to simulate hypothetical changes:
- Rainfall changes (e.g., -20% drought or +20% wet year)
- Temperature rises (e.g., +2°C climate warming)
- Water access changes (e.g., investing in drip irrigation)
- Previous crop changes (e.g., what if I cultivated chickpea instead of wheat?)
- Prioritizing soil health vs immediate profit

Computes the new recommendation rankings, score deltas, newly restricted crops,
and explains the agronomic tradeoffs.

Réponse rétro-compatible : les anciennes clés (changes_applied, winner_before,
winner_after, ...) sont conservées. Nouvelles clés : changes (structuré),
winner_*_id, winner_*_names, assumptions, provenance_notes, textes fr/en.
"""
from typing import Any
from copy import deepcopy
from .engine import rank
from .rules import CROPS

WATER_ACCESS_VALUES = {"rainfed", "irrigated", "partial"}
RAIN_FACTOR_RANGE = (0.1, 2.0)    # -90 % … +100 %
TEMP_DELTA_RANGE = (-2.0, 6.0)    # °C

# Hypothèses de simulation (affichées dans la réponse pour la transparence)
GDD_PER_DEGREE = 180              # degrés-jours ajoutés par °C de réchauffement
PET_INCREASE_PER_DEGREE = 0.04    # +4 % d'ETP par °C (approximation)

PROVENANCE_NOTES = {
    "fr": "SIMULÉ : Ces résultats reposent sur des hypothèses modifiées et ne remplacent pas les observations réelles de la NASA.",
    "en": "SIMULATED: These results rely on modified assumptions and do not replace real NASA observations.",
    "ar": "محاكاة: هذه النتائج تعتمد على فرضيات معدّلة ولا تعوّض ملاحظات ناسا الحقيقية.",
}


def _to_float(value: Any, name: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be a number, got {value!r}")


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _crop_names(crop_id: str | None) -> dict[str, str]:
    info = CROPS.get(crop_id or "", {})
    fr = info.get("name_fr", crop_id or "")
    return {
        "fr": fr,
        "ar": info.get("name_ar", fr),
        "en": info.get("name_en", fr),
    }


def _top(res: dict[str, Any]) -> dict[str, Any] | None:
    recs = res.get("recommendations") or []
    return recs[0] if recs else None


def _excluded_reasons(res: dict[str, Any]) -> dict[str, dict[str, str]]:
    """crop_id -> motif d'exclusion en ar/fr/en (cultures écartées par le moteur)."""
    return {
        a["crop_id"]: {
            "ar": a.get("reason", ""),
            "fr": a.get("reason_fr", ""),
            "en": a.get("reason_en", ""),
        }
        for a in res.get("abstained_crops", [])
    }


def _legacy_label(change: dict[str, Any]) -> str:
    """Ancien format texte (français), généré à partir des changements structurés."""
    kind = change["type"]
    if kind == "rain":
        return (
            f"Précipitations annuelles : {change['before']:.0f} mm → "
            f"{change['after']:.0f} mm ({change['percent']:+d}%)"
        )
    if kind == "temperature":
        return (
            f"Température moyenne : {change['before']:.1f} °C → "
            f"{change['after']:.1f} °C ({change['delta']:+.1f} °C)"
        )
    if kind == "water_access":
        return f"Régime hydrique : {change['before']} → {change['after']}"
    if kind == "previous_crop":
        return f"Précédent cultural : {change['after_names']['fr']}"
    if kind == "priorities":
        return "Priorités d'exploitation recalculées"
    return kind


def simulate_whatif(
    base_indicators: dict[str, Any],
    base_inputs: dict[str, Any],
    simulated_changes: dict[str, Any],
) -> dict[str, Any]:
    """
    Run baseline vs modified simulation.

    simulated_changes schema:
    {
        "rain_factor": 0.8,        # e.g., 20% less rain
        "temp_delta": 2.0,         # e.g., +2°C warmer
        "water_access": "irrigated",
        "previous_crop": "chickpea",
        "farmer_priorities": {"soil_health": 0.9, "profitability": 0.2}
    }

    Raises ValueError for invalid values (to be turned into a 400 by the view).
    """
    # 1. Base run
    base_res = rank(
        base_indicators,
        base_inputs,
        farmer_priorities=base_inputs.get("farmer_priorities"),
    )

    # 2. Modified inputs (simulated only — real observations are preserved)
    sim_indicators = deepcopy(base_indicators)
    sim_inputs = deepcopy(base_inputs)
    changes: list[dict[str, Any]] = []

    orig_rain = float(sim_indicators.get("annual_rain_mm", 300.0))
    orig_temp = float(sim_indicators.get("mean_annual_temp_c", 20.0))
    rain_factor = 1.0
    temp_delta = 0.0

    if "rain_factor" in simulated_changes:
        rain_factor = _clamp(
            _to_float(simulated_changes["rain_factor"], "rain_factor"),
            *RAIN_FACTOR_RANGE,
        )
        if rain_factor != 1.0:
            new_rain = round(orig_rain * rain_factor, 1)
            sim_indicators["annual_rain_mm"] = new_rain
            changes.append({
                "type": "rain",
                "before": round(orig_rain, 1),
                "after": new_rain,
                "percent": round((rain_factor - 1.0) * 100),
            })

    if "temp_delta" in simulated_changes:
        temp_delta = _clamp(
            _to_float(simulated_changes["temp_delta"], "temp_delta"),
            *TEMP_DELTA_RANGE,
        )
        if temp_delta != 0.0:
            new_temp = round(orig_temp + temp_delta, 1)
            sim_indicators["mean_annual_temp_c"] = new_temp
            if "gdd_base10" in sim_indicators:
                sim_indicators["gdd_base10"] = round(
                    sim_indicators["gdd_base10"] + temp_delta * GDD_PER_DEGREE
                )
            changes.append({
                "type": "temperature",
                "before": round(orig_temp, 1),
                "after": new_temp,
                "delta": round(temp_delta, 1),
            })

    # Indice d'aridité = P / ETP : il doit suivre la pluie et la chaleur simulées
    if (rain_factor != 1.0 or temp_delta != 0.0) and "aridity_index" in sim_indicators:
        pet_factor = max(1.0 + PET_INCREASE_PER_DEGREE * temp_delta, 0.5)
        sim_indicators["aridity_index"] = round(
            sim_indicators["aridity_index"] * rain_factor / pet_factor, 3
        )

    if "water_access" in simulated_changes:
        new_water = simulated_changes["water_access"]
        if new_water not in WATER_ACCESS_VALUES:
            raise ValueError(f"water_access must be one of {sorted(WATER_ACCESS_VALUES)}")
        old_water = base_inputs.get("water_access") or "rainfed"
        sim_inputs["water_access"] = new_water
        if new_water != old_water:
            changes.append({"type": "water_access", "before": old_water, "after": new_water})

    if "previous_crop" in simulated_changes:
        new_prev = simulated_changes["previous_crop"]
        if new_prev not in CROPS and new_prev != "fallow":
            raise ValueError(f"Unknown previous_crop: {new_prev!r}")
        old_prev = base_inputs.get("previous_crop") or "fallow"
        sim_inputs["previous_crop"] = new_prev
        if new_prev != old_prev:
            changes.append({
                "type": "previous_crop",
                "before": old_prev,
                "after": new_prev,
                "before_names": _crop_names(old_prev),
                "after_names": _crop_names(new_prev),
            })

    base_priorities = base_inputs.get("farmer_priorities")
    sim_priorities = simulated_changes.get("farmer_priorities") or base_priorities
    if "farmer_priorities" in simulated_changes and sim_priorities != base_priorities:
        changes.append({"type": "priorities", "after": sim_priorities})

    # 3. Simulated run
    sim_res = rank(
        sim_indicators,
        sim_inputs,
        farmer_priorities=sim_priorities,
    )

    # 4. Compare results
    base_recs = {r["crop_id"]: r for r in base_res["recommendations"]}
    sim_recs = {r["crop_id"]: r for r in sim_res["recommendations"]}
    base_excluded = _excluded_reasons(base_res)
    sim_excluded = _excluded_reasons(sim_res)

    crop_comparisons = []

    for cid in CROPS.keys():
        b_item = base_recs.get(cid)
        s_item = sim_recs.get(cid)
        names = _crop_names(cid)
        crop_info = CROPS.get(cid, {})

        score_before = b_item["score"] if b_item else None
        score_after = s_item["score"] if s_item else None
        score_delta = (
            score_after - score_before
            if score_after is not None and score_before is not None
            else None
        )

        eligible_before = b_item is not None
        eligible_after = s_item is not None

        status_change = "unchanged"
        if eligible_before and not eligible_after:
            status_change = "became_ineligible"
        elif not eligible_before and eligible_after:
            status_change = "became_eligible"
        elif score_delta is not None:
            if score_delta >= 5:
                status_change = "improved"
            elif score_delta <= -5:
                status_change = "degraded"

        crop_comparisons.append({
            "crop_id": cid,
            "crop_name_fr": names["fr"],
            "crop_name_ar": names["ar"],
            "crop_name_en": names["en"],
            "crop_emoji": crop_info.get("emoji", "🌱"),
            "score_before": score_before,
            "score_after": score_after,
            "delta": score_delta,
            "eligible_before": eligible_before,
            "eligible_after": eligible_after,
            "status_change": status_change,
            # Arabe (clés historiques) + français + anglais
            "simulated_reasons": s_item.get("reasons", []) if s_item else [],
            "simulated_reasons_fr": s_item.get("reasons_fr", []) if s_item else [],
            "simulated_reasons_en": s_item.get("reasons_en", []) if s_item else [],
            "simulated_cautions": s_item.get("cautions", []) if s_item else [],
            "simulated_cautions_fr": s_item.get("cautions_fr", []) if s_item else [],
            "simulated_cautions_en": s_item.get("cautions_en", []) if s_item else [],
            # Pourquoi la culture est exclue (avant / après), dans les 3 langues
            "excluded_reason_before": base_excluded.get(cid),
            "excluded_reason_after": sim_excluded.get(cid),
        })

    crop_comparisons.sort(
        key=lambda x: (x["score_after"] if x["score_after"] is not None else -999),
        reverse=True,
    )

    # Global summary (par identifiant, pas par nom français)
    top_before = _top(base_res)
    top_after = _top(sim_res)
    id_before = top_before["crop_id"] if top_before else None
    id_after = top_after["crop_id"] if top_after else None

    return {
        # Nouveau : changements structurés, à traduire côté interface
        "changes": changes,
        "assumptions": {
            "gdd_per_degree": GDD_PER_DEGREE,
            "pet_increase_per_degree": PET_INCREASE_PER_DEGREE,
        },
        # Ancien format (français), conservé pour compatibilité
        "changes_applied": [_legacy_label(c) for c in changes],
        "winner_before": top_before["crop_name_fr"] if top_before else "Aucun",
        "winner_after": top_after["crop_name_fr"] if top_after else "Aucun",
        "winner_before_id": id_before,
        "winner_after_id": id_after,
        "winner_before_names": _crop_names(id_before) if id_before else None,
        "winner_after_names": _crop_names(id_after) if id_after else None,
        "strategy_changed": id_before != id_after,
        "crop_comparisons": crop_comparisons,
        "simulated_indicators": sim_indicators,
        "provenance_note": PROVENANCE_NOTES["fr"],
        "provenance_notes": PROVENANCE_NOTES,
    }