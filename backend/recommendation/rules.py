"""
Crop suitability rules for TerraRota.

⚠️ ALL RULES ARE PROVISIONAL and must be validated by an agronomist
   before operational use. Sources are cited where available.

Each rule is a dict with:
  - id: unique rule identifier
  - type: 'eligibility' | 'rank' | 'caution' | 'info'
  - description: human-readable explanation
  - is_provisional: True unless validated by a named expert source
  - source: citation or 'Provisional'
"""

from typing import Any

# ──────────────────────────────────────────────
# Supported crops catalogue
# ──────────────────────────────────────────────
CROPS: dict[str, dict[str, Any]] = {
    "wheat_hard": {
        "id": "wheat_hard",
        "name_fr": "Blé dur",
        "name_ar": "القمح الصلب",
        "category": "cereal",
        "emoji": "🌾",
    },
    "wheat_soft": {
        "id": "wheat_soft",
        "name_fr": "Blé tendre",
        "name_ar": "القمح اللين",
        "category": "cereal",
        "emoji": "🌾",
    },
    "barley": {
        "id": "barley",
        "name_fr": "Orge",
        "name_ar": "الشعير",
        "category": "cereal",
        "emoji": "🌾",
    },
    "olive": {
        "id": "olive",
        "name_fr": "Olive",
        "name_ar": "الزيتون",
        "category": "tree_crop",
        "emoji": "🫒",
    },
    "argan": {
        "id": "argan",
        "name_fr": "Argan",
        "name_ar": "الأركان",
        "category": "tree_crop",
        "emoji": "🌳",
    },
    "tomato": {
        "id": "tomato",
        "name_fr": "Tomate",
        "name_ar": "الطماطم",
        "category": "vegetable",
        "emoji": "🍅",
    },
    "chickpea": {
        "id": "chickpea",
        "name_fr": "Pois chiche",
        "name_ar": "الحمص",
        "category": "legume",
        "emoji": "🫘",
    },
    "cactus_pear": {
        "id": "cactus_pear",
        "name_fr": "Figuier de Barbarie",
        "name_ar": "الهندية",
        "category": "cactus",
        "emoji": "🌵",
    },
}

# ──────────────────────────────────────────────
# Rule definitions
# ──────────────────────────────────────────────

def get_rules(crop_id: str) -> list[dict[str, Any]]:
    """Return the rules for a given crop ID."""
    registry = {
        "wheat_hard": _wheat_hard_rules,
        "wheat_soft": _wheat_soft_rules,
        "barley": _barley_rules,
        "olive": _olive_rules,
        "argan": _argan_rules,
        "tomato": _tomato_rules,
        "chickpea": _chickpea_rules,
        "cactus_pear": _cactus_pear_rules,
    }
    return registry.get(crop_id, [])


_PROVISIONAL = True
_SOURCE = "Provisional"

_wheat_hard_rules = [
    {
        "id": "WHEAT_HARD_GDD_ELIG",
        "type": "eligibility",
        "condition": lambda ind, inp: ind.get("gdd_base10", 0) >= 1200,
        "fail_reason": "Insufficient growing degree days for wheat maturation (GDD < 1200).",
        "description": "Minimum GDD requirement for hard wheat.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "WHEAT_HARD_GDD_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 1500 <= ind.get("gdd_base10", 0) <= 3500,
        "points": 20,
        "reason": "Growing degree days ({gdd_base10:.0f}) are within the optimal range for hard wheat.",
        "description": "Optimal GDD range bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "WHEAT_HARD_RAIN_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 280 <= ind.get("annual_rain_mm", 0) <= 650,
        "points": 15,
        "reason": "Annual rainfall ({annual_rain_mm:.0f} mm) suits hard wheat requirements (280–650 mm).",
        "description": "Rainfall range bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "WHEAT_HARD_WATER_RANK",
        "type": "rank",
        "condition": lambda ind, inp: inp.get("water_access") in ("rainfed", "partial"),
        "points": 10,
        "reason": "Hard wheat is well-suited to rainfed or partially irrigated conditions.",
        "description": "Rainfed compatibility bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "WHEAT_HARD_FROST_CAUTION",
        "type": "caution",
        "condition": lambda ind, inp: ind.get("frost_days_per_year", 0) > 10,
        "caution": "Average {frost_days_per_year:.0f} frost days per year — monitor for late-frost risk during heading (February–April).",
        "description": "Frost risk warning.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "WHEAT_HARD_ROT_CAUTION",
        "type": "caution",
        "condition": lambda ind, inp: inp.get("previous_crop") in ("wheat_hard", "wheat_soft"),
        "caution": "Consecutive wheat crops increase disease risk (Fusarium, septoria). Consider alternating with a legume.",
        "description": "Crop rotation caution.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
]

_wheat_soft_rules = [
    {
        "id": "WHEAT_SOFT_GDD_ELIG",
        "type": "eligibility",
        "condition": lambda ind, inp: ind.get("gdd_base10", 0) >= 1100,
        "fail_reason": "Insufficient GDD for soft wheat (GDD < 1100).",
        "description": "Minimum GDD for soft wheat.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "WHEAT_SOFT_GDD_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 1300 <= ind.get("gdd_base10", 0) <= 3200,
        "points": 18,
        "reason": "GDD ({gdd_base10:.0f}) is within the optimal range for soft wheat.",
        "description": "Optimal GDD bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "WHEAT_SOFT_RAIN_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 350 <= ind.get("annual_rain_mm", 0) <= 750,
        "points": 15,
        "reason": "Rainfall ({annual_rain_mm:.0f} mm) is within soft wheat's preferred range.",
        "description": "Rainfall range bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "WHEAT_SOFT_ROT_CAUTION",
        "type": "caution",
        "condition": lambda ind, inp: inp.get("previous_crop") in ("wheat_hard", "wheat_soft"),
        "caution": "Consecutive wheat crops increase disease pressure. Consider a legume rotation.",
        "description": "Rotation caution.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
]

_barley_rules = [
    {
        "id": "BARLEY_ARIDITY_ELIG",
        "type": "eligibility",
        "condition": lambda ind, inp: ind.get("aridity_index", 1) >= 0.05,
        "fail_reason": "Location appears hyper-arid (AI < 0.05). Barley requires at least minimal rainfall.",
        "description": "Minimum aridity threshold.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "BARLEY_ARIDITY_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 0.10 <= ind.get("aridity_index", 0) <= 0.55,
        "points": 22,
        "reason": "Aridity index ({aridity_index:.3f}) is within barley's semi-arid tolerance range (0.10–0.55).",
        "description": "Aridity range bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "BARLEY_GDD_RANK",
        "type": "rank",
        "condition": lambda ind, inp: ind.get("gdd_base10", 0) >= 1200,
        "points": 15,
        "reason": "GDD ({gdd_base10:.0f}) is sufficient for barley maturation.",
        "description": "GDD adequacy bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "BARLEY_DROUGHT_RANK",
        "type": "rank",
        "condition": lambda ind, inp: (
            inp.get("water_access") == "rainfed"
            and ind.get("aridity_index", 0) >= 0.10
        ),
        "points": 10,
        "reason": "Barley's drought tolerance makes it a good fit for rainfed conditions in this climate.",
        "description": "Drought tolerance bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "BARLEY_FROST_CAUTION",
        "type": "caution",
        "condition": lambda ind, inp: ind.get("frost_days_per_year", 0) > 15,
        "caution": "{frost_days_per_year:.0f} frost days/year detected — barley may be vulnerable at heading if late-sown.",
        "description": "Frost caution.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
]

_olive_rules = [
    {
        "id": "OLIVE_TEMP_ELIG",
        "type": "eligibility",
        "condition": lambda ind, inp: ind.get("mean_annual_temp_c", 0) >= 10,
        "fail_reason": "Mean annual temperature too low for olive (< 10°C).",
        "description": "Minimum temperature for olive.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "OLIVE_TEMP_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 14 <= ind.get("mean_annual_temp_c", 0) <= 22,
        "points": 25,
        "reason": "Mean annual temperature ({mean_annual_temp_c:.1f}°C) is in olive's optimal range (14–22°C).",
        "description": "Optimal temperature bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "OLIVE_RAIN_RANK",
        "type": "rank",
        "condition": lambda ind, inp: ind.get("annual_rain_mm", 0) >= 200,
        "points": 15,
        "reason": "Rainfall ({annual_rain_mm:.0f} mm) meets olive's minimum threshold (200 mm).",
        "description": "Minimum rainfall bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "OLIVE_FROST_CAUTION",
        "type": "caution",
        "condition": lambda ind, inp: ind.get("frost_days_per_year", 0) > 20,
        "caution": "Severe frost risk ({frost_days_per_year:.0f} days/year) — young olive trees are vulnerable.",
        "description": "Frost risk caution.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "OLIVE_LONGTERM_INFO",
        "type": "info",
        "condition": lambda ind, inp: True,
        "info": "Olive is a long-term investment: 5–8 years to first significant production.",
        "description": "Long-term note.",
        "is_provisional": False,
        "source": "General agricultural knowledge",
    },
]

_argan_rules = [
    {
        "id": "ARGAN_LAT_ELIG",
        "type": "eligibility",
        "condition": lambda ind, inp: True,  # latitude check handled via farmer input
        "fail_reason": None,
        "description": "Argan is endemic to southwestern Morocco.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "ARGAN_ARIDITY_RANK",
        "type": "rank",
        "condition": lambda ind, inp: ind.get("annual_rain_mm", 1000) <= 400,
        "points": 25,
        "reason": "Low rainfall ({annual_rain_mm:.0f} mm) is typical of argan's native habitat.",
        "description": "Aridity adaptation bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "ARGAN_TEMP_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 15 <= ind.get("mean_annual_temp_c", 0) <= 25,
        "points": 15,
        "reason": "Temperature range ({mean_annual_temp_c:.1f}°C) suits argan.",
        "description": "Temperature range bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "ARGAN_LONGTERM_INFO",
        "type": "info",
        "condition": lambda ind, inp: True,
        "info": "Argan requires 15+ years to significant production. Not suitable for short-term income.",
        "description": "Long-term note.",
        "is_provisional": False,
        "source": "General agricultural knowledge",
    },
]

_tomato_rules = [
    {
        "id": "TOMATO_WATER_ELIG",
        "type": "eligibility",
        "condition": lambda ind, inp: not (
            inp.get("water_access") == "rainfed"
            and ind.get("annual_rain_mm", 0) < 500
        ),
        "fail_reason": "Tomato requires irrigation or rainfall >500mm/year. Rainfed conditions in this climate are insufficient.",
        "description": "Water requirement eligibility.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "TOMATO_TEMP_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 17 <= ind.get("mean_annual_temp_c", 0) <= 26,
        "points": 25,
        "reason": "Mean temperature ({mean_annual_temp_c:.1f}°C) is within tomato's optimal range.",
        "description": "Optimal temperature bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "TOMATO_GDD_RANK",
        "type": "rank",
        "condition": lambda ind, inp: ind.get("gdd_base10", 0) >= 1800,
        "points": 15,
        "reason": "GDD ({gdd_base10:.0f}) is adequate for tomato production.",
        "description": "GDD adequacy bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "TOMATO_FROST_CAUTION",
        "type": "caution",
        "condition": lambda ind, inp: ind.get("frost_days_per_year", 0) > 5,
        "caution": "Tomato is frost-sensitive — {frost_days_per_year:.0f} frost days/year requires protection or later planting.",
        "description": "Frost sensitivity caution.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "TOMATO_IRRIGATED_RANK",
        "type": "rank",
        "condition": lambda ind, inp: inp.get("water_access") == "irrigated",
        "points": 10,
        "reason": "Irrigated access maximises tomato yield potential.",
        "description": "Irrigation bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
]

_chickpea_rules = [
    {
        "id": "CHICKPEA_GDD_RANK",
        "type": "rank",
        "condition": lambda ind, inp: ind.get("gdd_base10", 0) >= 1000,
        "points": 15,
        "reason": "GDD ({gdd_base10:.0f}) is adequate for chickpea maturation.",
        "description": "GDD adequacy bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "CHICKPEA_RAIN_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 300 <= ind.get("annual_rain_mm", 0) <= 650,
        "points": 15,
        "reason": "Rainfall ({annual_rain_mm:.0f} mm) is within chickpea's preferred range (300–650 mm).",
        "description": "Rainfall range bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "CHICKPEA_ROT_RANK",
        "type": "rank",
        "condition": lambda ind, inp: inp.get("previous_crop") in (
            "wheat_hard", "wheat_soft", "barley"
        ),
        "points": 12,
        "reason": "Following a cereal crop, chickpea improves soil nitrogen and breaks disease cycles.",
        "description": "Rotation benefit bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "CHICKPEA_FROST_CAUTION",
        "type": "caution",
        "condition": lambda ind, inp: ind.get("frost_days_per_year", 0) > 10,
        "caution": "Chickpea is sensitive to frost during flowering — {frost_days_per_year:.0f} frost days/year detected.",
        "description": "Frost caution.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "CHICKPEA_ARIDITY_ELIG",
        "type": "eligibility",
        "condition": lambda ind, inp: ind.get("aridity_index", 1) >= 0.08,
        "fail_reason": "Too arid for chickpea without supplemental irrigation (AI < 0.08).",
        "description": "Minimum aridity threshold.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
]

_cactus_pear_rules = [
    {
        "id": "CACTUS_ARIDITY_RANK",
        "type": "rank",
        "condition": lambda ind, inp: ind.get("aridity_index", 1) <= 0.40,
        "points": 25,
        "reason": "Cactus pear is highly adapted to arid/semi-arid conditions (AI = {aridity_index:.3f}).",
        "description": "Aridity adaptation bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "CACTUS_TEMP_RANK",
        "type": "rank",
        "condition": lambda ind, inp: 15 <= ind.get("mean_annual_temp_c", 0) <= 28,
        "points": 15,
        "reason": "Temperature ({mean_annual_temp_c:.1f}°C) is within cactus pear's preferred range.",
        "description": "Temperature range bonus.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
    {
        "id": "CACTUS_FROST_CAUTION",
        "type": "caution",
        "condition": lambda ind, inp: ind.get("frost_days_per_year", 0) > 30,
        "caution": "Severe frost ({frost_days_per_year:.0f} days/year) can damage cactus pear pads.",
        "description": "Frost caution.",
        "is_provisional": _PROVISIONAL,
        "source": _SOURCE,
    },
]
