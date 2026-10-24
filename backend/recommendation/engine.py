"""
Recommendation engine for TerraRota.

Deterministic, rule-based, explainable crop scoring.

No ML. No random data. No fabrication.

The engine:
  1. Iterates over all supported crops.
  2. Checks eligibility constraints — eliminates ineligible crops.
  3. Accumulates ranking points from ranking rules.
  4. Collects caution messages from caution rules.
  5. Collects info messages.
  6. Sorts eligible crops by score descending.
  7. Returns crops with score >= MIN_SCORE_THRESHOLD.
  8. Abstains (returns empty list + reason) if no crop qualifies.
"""

import logging
from typing import Any

from .rules import CROPS, get_rules

logger = logging.getLogger("terrarota")

# Crops below this score are not shown in results
MIN_SCORE_THRESHOLD = 25

# Maximum achievable score per crop (for normalisation display)
MAX_THEORETICAL_SCORE = 100


def rank(
    indicators: dict[str, Any],
    farmer_inputs: dict[str, Any],
    preferred_crops: list[str] | None = None,
) -> dict[str, Any]:
    """
    Rank all supported crops and return explainable recommendations.

    Args:
        indicators: Output of indicators.calculator.calculate()
        farmer_inputs: Validated farmer input dict
        preferred_crops: Optional list of crop IDs to prioritise

    Returns:
        {
          "recommendations": [...],
          "abstained_crops": [...],
          "abstention_reason": str | None,
          "rules_version": str,
        }
    """
    results = []
    abstained = []

    for crop_id, crop_info in CROPS.items():
        result = _evaluate_crop(crop_id, crop_info, indicators, farmer_inputs)

        if not result["eligible"]:
            abstained.append({
                "crop_id": crop_id,
                "crop_name_fr": crop_info["name_fr"],
                "crop_name_ar": crop_info["name_ar"],
                "reason": result["ineligibility_reason"],
            })
            continue

        if result["score"] >= MIN_SCORE_THRESHOLD:
            results.append(result)

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)

    # Apply preferred crop bonus (5 pts) — does not change eligibility
    if preferred_crops:
        for r in results:
            if r["crop_id"] in preferred_crops:
                r["score"] = min(MAX_THEORETICAL_SCORE, r["score"] + 5)
                r["reasons"].append(
                    f"This crop matches your stated preference (small priority bonus applied)."
                )
        results.sort(key=lambda x: x["score"], reverse=True)

    # Assign ranks
    for i, r in enumerate(results, start=1):
        r["rank"] = i

    abstention_reason = None
    if not results:
        abstention_reason = (
            "No crop scored above the minimum threshold "
            f"({MIN_SCORE_THRESHOLD} points) for the provided location and constraints. "
            "Consider revising inputs or consulting a local agronomist."
        )

    return {
        "recommendations": results,
        "abstained_crops": abstained,
        "abstention_reason": abstention_reason,
        "rules_version": "provisional-v1.0",
    }


def _evaluate_crop(
    crop_id: str,
    crop_info: dict[str, Any],
    indicators: dict[str, Any],
    farmer_inputs: dict[str, Any],
) -> dict[str, Any]:
    """
    Evaluate a single crop against the indicators and farmer inputs.
    Returns a result dict.
    """
    rules = get_rules(crop_id)
    score = 0
    reasons: list[str] = []
    cautions: list[str] = []
    infos: list[str] = []
    rules_applied: list[str] = []
    is_provisional = False

    for rule in rules:
        rule_type = rule.get("type")
        condition_fn = rule.get("condition")
        rule_id = rule.get("id", "UNKNOWN")

        try:
            passes = bool(condition_fn(indicators, farmer_inputs))
        except Exception as exc:
            logger.warning("Rule %s condition error: %s", rule_id, exc)
            passes = False

        if rule.get("is_provisional"):
            is_provisional = True

        if rule_type == "eligibility":
            if not passes:
                return {
                    "crop_id": crop_id,
                    "eligible": False,
                    "ineligibility_reason": rule.get("fail_reason", "Not eligible."),
                    "score": 0,
                    "rank": None,
                    "reasons": [],
                    "cautions": [],
                    "infos": [],
                    "rules_applied": [rule_id],
                    "is_provisional": rule.get("is_provisional", True),
                }

        elif rule_type == "rank" and passes:
            pts = rule.get("points", 0)
            score += pts
            reason_template = rule.get("reason", "")
            reason = _format_message(reason_template, indicators, farmer_inputs)
            if reason:
                reasons.append(reason)
            rules_applied.append(rule_id)

        elif rule_type == "caution" and passes:
            caution_template = rule.get("caution", "")
            caution = _format_message(caution_template, indicators, farmer_inputs)
            if caution:
                cautions.append(caution)
            rules_applied.append(rule_id)

        elif rule_type == "info" and passes:
            info_template = rule.get("info", "")
            info = _format_message(info_template, indicators, farmer_inputs)
            if info:
                infos.append(info)
            rules_applied.append(rule_id)

    return {
        "crop_id": crop_id,
        "crop_name_fr": crop_info["name_fr"],
        "crop_name_ar": crop_info["name_ar"],
        "crop_category": crop_info.get("category"),
        "crop_emoji": crop_info.get("emoji", "🌱"),
        "eligible": True,
        "score": min(score, MAX_THEORETICAL_SCORE),
        "rank": None,  # set after sorting
        "reasons": reasons,
        "cautions": cautions,
        "infos": infos,
        "rules_applied": rules_applied,
        "is_provisional": is_provisional,
        "provisional_note": (
            "Agronomic rules have not yet been validated by a domain expert. "
            "Treat this as a decision-support tool, not a guarantee."
        ) if is_provisional else None,
        "missing_data": _identify_missing_data(indicators, farmer_inputs),
    }


def _format_message(template: str, indicators: dict, inputs: dict) -> str:
    """Format a rule message template with actual indicator values."""
    context = {**indicators, **inputs}
    try:
        return template.format(**context)
    except (KeyError, ValueError):
        return template


def _identify_missing_data(
    indicators: dict[str, Any],
    farmer_inputs: dict[str, Any],
) -> list[str]:
    """Identify what data is missing that could improve recommendations."""
    missing = []

    if farmer_inputs.get("soil_type") in (None, "unknown"):
        missing.append("Soil type (would enable soil-suitability rules)")

    if farmer_inputs.get("water_access") is None:
        missing.append("Water access type (rainfed/irrigated/partial)")

    if farmer_inputs.get("previous_crop") is None:
        missing.append("Previous crop (would enable rotation rules)")

    warnings = indicators.get("_warnings", [])
    if warnings:
        for w in warnings:
            missing.append(f"Data quality note: {w}")

    return missing
