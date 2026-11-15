"""
TerraRota Farmer Priorities & Dynamic Decision Weighting System.

Allows Moroccan farmers and agronomists to set weighted goals:
- water_conservation: Prioritize drought tolerance and low water consumption
- soil_health: Prioritize biological nitrogen fixation and soil restoration
- profitability: Prioritize high-value cash crops (olives, vegetables, potatoes)
- climate_resilience: Prioritize resilient crops under volatile climate conditions
- crop_diversification: Penalize repeat families and favor novel crops
- lower_risk: Favor staple food security crops with predictable yields (cereals, legumes)
"""

from typing import Any

PRIORITY_DIMENSIONS = {
    "water_conservation": {
        "label_en": "Water Conservation",
        "label_fr": "Économie d'eau",
        "label_ar": "ترشيد استهلاك المياه",
        "description": "Favors drought-tolerant and CAM/dryland crops (cactus, argan, barley, olive).",
    },
    "soil_health": {
        "label_en": "Soil Health & Regeneration",
        "label_fr": "Santé & Régénération du sol",
        "label_ar": "صحة التربة وتجديد الخصوبة",
        "description": "Favors nitrogen-fixing legumes (chickpea, lentil, faba bean) and organic matter builders.",
    },
    "profitability": {
        "label_en": "Economic Profitability",
        "label_fr": "Rentabilité économique",
        "label_ar": "المردودية الاقتصادية والربحية",
        "description": "Favors high-value market produce (vegetables, potato, olive oil, almond).",
    },
    "climate_resilience": {
        "label_en": "Climate Resilience",
        "label_fr": "Résilience climatique",
        "label_ar": "الصمود في وجه التغير المناخي",
        "description": "Favors hardy rustic crops adapted to high temperature variability and drought.",
    },
    "crop_diversification": {
        "label_en": "Crop Diversification",
        "label_fr": "Diversification culturale",
        "label_ar": "تنويع المحاصيل الزراعية",
        "description": "Breaks monoculture sequences and promotes diverse botanical families.",
    },
    "lower_risk": {
        "label_en": "Risk Minimization",
        "label_fr": "Minimisation des risques",
        "label_ar": "تقليل المخاطر الفلاحية",
        "description": "Favors reliable staple grains and pulses with established market uptake.",
    },
}

# Crop affinity mappings for each priority dimension (-1.0 to +1.0)
PRIORITY_AFFINITIES: dict[str, dict[str, float]] = {
    "water_conservation": {
        "cactus_pear": 0.95,
        "argan": 0.90,
        "barley": 0.65,
        "olive": 0.50,
        "almond": 0.40,
        "lentil": 0.35,
        "chickpea": 0.30,
        "wheat_hard": 0.05,
        "wheat_soft": -0.10,
        "faba_bean": -0.15,
        "potato": -0.55,
        "tomato": -0.85,
    },
    "soil_health": {
        "faba_bean": 0.95,     # Fixes up to 100+ kg N/ha
        "chickpea": 0.85,      # Fixes 40-80 kg N/ha
        "lentil": 0.80,        # Fixes 35-70 kg N/ha
        "cactus_pear": 0.40,   # Erosion control & ground cover
        "argan": 0.35,         # Soil conservation in arid zones
        "olive": 0.10,
        "almond": 0.10,
        "barley": -0.10,
        "wheat_hard": -0.30,   # Soil-depleting cereal
        "wheat_soft": -0.35,
        "tomato": -0.45,
        "potato": -0.60,       # Intensive nutrient extraction
    },
    "profitability": {
        "tomato": 0.90,
        "potato": 0.85,
        "olive": 0.75,
        "almond": 0.70,
        "argan": 0.65,
        "wheat_hard": 0.40,
        "chickpea": 0.35,
        "faba_bean": 0.30,
        "wheat_soft": 0.25,
        "lentil": 0.20,
        "barley": 0.10,
        "cactus_pear": 0.15,
    },
    "climate_resilience": {
        "cactus_pear": 0.95,
        "argan": 0.90,
        "barley": 0.75,
        "olive": 0.60,
        "almond": 0.50,
        "lentil": 0.30,
        "chickpea": 0.25,
        "wheat_hard": 0.10,
        "wheat_soft": -0.10,
        "faba_bean": -0.20,
        "potato": -0.60,
        "tomato": -0.80,
    },
    "crop_diversification": {
        "cactus_pear": 0.80,
        "almond": 0.70,
        "argan": 0.70,
        "lentil": 0.60,
        "faba_bean": 0.60,
        "chickpea": 0.50,
        "olive": 0.40,
        "potato": 0.30,
        "tomato": 0.20,
        "barley": 0.00,
        "wheat_hard": -0.20,
        "wheat_soft": -0.30,
    },
    "lower_risk": {
        "barley": 0.85,
        "wheat_hard": 0.65,
        "wheat_soft": 0.60,
        "chickpea": 0.50,
        "olive": 0.40,
        "lentil": 0.35,
        "cactus_pear": 0.30,
        "faba_bean": 0.25,
        "almond": 0.10,
        "argan": 0.05,
        "potato": -0.30,
        "tomato": -0.60,
    },
}


def apply_priorities(
    recommendations: list[dict[str, Any]],
    priorities: dict[str, float] | None,
) -> list[dict[str, Any]]:
    """
    Re-weight recommendation scores based on normalized farmer priorities.
    Adds transparent priority breakdown notes into each recommendation.
    """
    if not priorities:
        return recommendations

    # Filter and clean valid weights
    valid_weights = {
        k: float(v) for k, v in priorities.items()
        if k in PRIORITY_AFFINITIES and float(v) > 0
    }

    if not valid_weights:
        return recommendations

    total_weight = sum(valid_weights.values())
    norm_weights = {k: v / total_weight for k, v in valid_weights.items()}

    for rec in recommendations:
        crop_id = rec["crop_id"]
        # Calculate dynamic priority adjustment (-20 to +20 points max)
        net_affinity = 0.0
        applied_notes = []

        for dim, weight in norm_weights.items():
            affinity = PRIORITY_AFFINITIES[dim].get(crop_id, 0.0)
            dim_impact = affinity * weight * 20.0
            net_affinity += dim_impact

            if abs(dim_impact) >= 2.0:
                dim_label = PRIORITY_DIMENSIONS[dim]["label_fr"]
                sign = "+" if dim_impact > 0 else ""
                applied_notes.append(f"{dim_label} ({sign}{dim_impact:.1f} pts)")

        # Adjust score bounded between 20 and 99
        base_score = rec["score"]
        adjusted_score = round(max(20, min(99, base_score + net_affinity)))
        rec["score"] = adjusted_score
        rec["priority_adjustment"] = round(net_affinity, 1)

        if applied_notes:
            rec.setdefault("reasons", []).append(
                f"Alignement avec vos priorités d'exploitation : {', '.join(applied_notes[:3])}."
            )

    # Re-sort by adjusted score and update ranks
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    for i, item in enumerate(recommendations, start=1):
        item["rank"] = i

    return recommendations
