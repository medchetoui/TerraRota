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
"""
from typing import Any
from copy import deepcopy
from .engine import rank
from .rules import CROPS


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
    """
    # 1. Base run
    base_res = rank(
        base_indicators,
        base_inputs,
        farmer_priorities=base_inputs.get("farmer_priorities"),
    )

    # 2. Formulate modified indicators (simulated only, preserves real observations)
    sim_indicators = deepcopy(base_indicators)
    sim_inputs = deepcopy(base_inputs)

    changes_applied = []

    if "rain_factor" in simulated_changes:
        factor = float(simulated_changes["rain_factor"])
        orig_rain = sim_indicators.get("annual_rain_mm", 300.0)
        new_rain = round(orig_rain * factor, 1)
        sim_indicators["annual_rain_mm"] = new_rain
        pct_str = f"{(factor - 1.0) * 100:+.0f}%"
        changes_applied.append(f"Précipitations annuelles : {orig_rain:.0f} mm → {new_rain:.0f} mm ({pct_str})")

    if "temp_delta" in simulated_changes:
        delta = float(simulated_changes["temp_delta"])
        orig_temp = sim_indicators.get("mean_annual_temp_c", 20.0)
        new_temp = round(orig_temp + delta, 1)
        sim_indicators["mean_annual_temp_c"] = new_temp
        # Also adjust GDD estimate
        if "gdd_base10" in sim_indicators:
            sim_indicators["gdd_base10"] = round(sim_indicators["gdd_base10"] + (delta * 180), 0)
        changes_applied.append(f"Température moyenne : {orig_temp:.1f} °C → {new_temp:.1f} °C ({delta:+.1f} °C)")

    if "water_access" in simulated_changes:
        new_water = simulated_changes["water_access"]
        sim_inputs["water_access"] = new_water
        changes_applied.append(f"Régime hydrique : {base_inputs.get('water_access', 'rainfed')} → {new_water}")

    if "previous_crop" in simulated_changes:
        new_prev = simulated_changes["previous_crop"]
        sim_inputs["previous_crop"] = new_prev
        prev_name = CROPS.get(new_prev, {}).get("name_fr", new_prev)
        changes_applied.append(f"Précédent cultural : {prev_name}")

    sim_priorities = simulated_changes.get("farmer_priorities") or sim_inputs.get("farmer_priorities")
    if "farmer_priorities" in simulated_changes:
        changes_applied.append("Priorités d'exploitation recalculées")

    # 3. Simulated run
    sim_res = rank(
        sim_indicators,
        sim_inputs,
        farmer_priorities=sim_priorities,
    )

    # 4. Compare results
    base_recs = {r["crop_id"]: r for r in base_res["recommendations"]}
    sim_recs = {r["crop_id"]: r for r in sim_res["recommendations"]}

    all_crop_ids = list(CROPS.keys())
    crop_comparisons = []

    for cid in all_crop_ids:
        b_item = base_recs.get(cid)
        s_item = sim_recs.get(cid)

        crop_info = CROPS.get(cid, {})
        name_fr = crop_info.get("name_fr", cid)
        name_ar = crop_info.get("name_ar", cid)
        name_en = crop_info.get("name_en", cid)
        emoji = crop_info.get("emoji", "🌱")

        score_before = b_item["score"] if b_item else None
        score_after = s_item["score"] if s_item else None
        delta = (score_after - score_before) if (score_after is not None and score_before is not None) else None

        eligible_before = b_item is not None
        eligible_after = s_item is not None

        status_change = "unchanged"
        if eligible_before and not eligible_after:
            status_change = "became_ineligible"
        elif not eligible_before and eligible_after:
            status_change = "became_eligible"
        elif delta is not None:
            if delta >= 5:
                status_change = "improved"
            elif delta <= -5:
                status_change = "degraded"

        crop_comparisons.append({
            "crop_id": cid,
            "crop_name_fr": name_fr,
            "crop_name_ar": name_ar,
            "crop_name_en": name_en,
            "crop_emoji": emoji,
            "score_before": score_before,
            "score_after": score_after,
            "delta": delta,
            "eligible_before": eligible_before,
            "eligible_after": eligible_after,
            "status_change": status_change,
            "simulated_reasons": s_item.get("reasons", []) if s_item else [],
            "simulated_cautions": s_item.get("cautions", []) if s_item else [],
        })

    # Sort comparisons by score_after desc
    crop_comparisons.sort(key=lambda x: (x["score_after"] if x["score_after"] is not None else -999), reverse=True)

    # Global summary
    winner_before = base_res["recommendations"][0]["crop_name_fr"] if base_res["recommendations"] else "Aucun"
    winner_after = sim_res["recommendations"][0]["crop_name_fr"] if sim_res["recommendations"] else "Aucun"

    return {
        "changes_applied": changes_applied,
        "winner_before": winner_before,
        "winner_after": winner_after,
        "strategy_changed": winner_before != winner_after,
        "crop_comparisons": crop_comparisons,
        "simulated_indicators": sim_indicators,
        "provenance_note": "SIMULÉ : Ces résultats reposent sur des hypothèses modifiées et ne remplacent pas les observations réelles de la NASA.",
    }
