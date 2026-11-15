"""
context.py — Builds the personalized farmer context for the AI advisor.

Retrieves real data from authenticated farmer's account:
- Parcels and their soil/location properties
- Latest farm plan and crop recommendations
- Crop rotation history
- Farmer priorities
- NASA climate indicators (fetched on demand)

Never fabricates data. Missing fields are explicitly marked as None.
"""
from django.contrib.auth.models import User
from fields.models import Parcel, FarmPlan, RotationHistory, FarmerPriority
from data_services import nasa_power
from indicators import calculator
from indicators.calculator import InsufficientDataError


DEMO_CONTEXT = {
    "farmer": {
        "username": "demo_farmer",
        "first_name": "Ahmed",
        "is_demo": True,
    },
    "parcels": [
        {
            "id": None,
            "name": "Parcelle Pilote — Chaouia",
            "latitude": 33.0,
            "longitude": -7.6,
            "region": "Chaouia-Ouardigha",
            "water_access": "rainfed",
            "soil_type": "clay_loam",
            "soil_ph": 7.2,
            "organic_matter_pct": 1.8,
            "field_size_ha": 5.5,
            "is_demo": True,
        }
    ],
    "active_parcel": {
        "id": None,
        "name": "Parcelle Pilote — Chaouia",
        "latitude": 33.0,
        "longitude": -7.6,
        "region": "Chaouia-Ouardigha",
        "water_access": "rainfed",
        "soil_type": "clay_loam",
        "soil_ph": 7.2,
        "organic_matter_pct": 1.8,
        "field_size_ha": 5.5,
        "is_demo": True,
    },
    "rotation_history": [
        {"crop_id": "wheat_hard", "season": "2024-2025", "year": 2024},
        {"crop_id": "chickpea", "season": "2023-2024", "year": 2023},
        {"crop_id": "wheat_hard", "season": "2022-2023", "year": 2022},
    ],
    "priorities": {
        "water_conservation": 0.8,
        "soil_health": 0.7,
        "profitability": 0.5,
        "climate_resilience": 0.9,
    },
    "active_plan": {
        "id": None,
        "title": "Plan Pilote Chaouia 2025-2026",
        "status": "proposed",
        "selected_crop": "barley",
        "is_demo": True,
    },
    "is_demo": True,
}


def build_context(user, parcel_id=None, fetch_climate=True):
    """
    Build the full farmer context dict for the advisor.

    Args:
        user: Django User instance (or None for demo/guest)
        parcel_id: specific parcel to focus on (None = most recent)
        fetch_climate: whether to call NASA POWER API for climate data

    Returns:
        dict with keys: farmer, parcels, active_parcel, rotation_history,
                        priorities, active_plan, climate, indicators, is_demo
    """
    # ── Guest / Demo ─────────────────────────────────────────────────────
    if user is None or not user.is_authenticated:
        ctx = dict(DEMO_CONTEXT)
        if fetch_climate:
            p = ctx["active_parcel"]
            ctx["climate"], ctx["indicators"] = _fetch_climate(p["latitude"], p["longitude"])
        else:
            ctx["climate"] = None
            ctx["indicators"] = None
        return ctx

    # ── Authenticated farmer ─────────────────────────────────────────────
    parcels_qs = Parcel.objects.filter(user=user).order_by("-created_at")
    parcels_list = list(parcels_qs.values(
        "id", "name", "latitude", "longitude", "region",
        "water_access", "soil_type", "soil_ph", "organic_matter_pct",
        "soil_depth_cm", "field_size_ha", "notes"
    ))
    for p in parcels_list:
        p["is_demo"] = False

    # Active parcel
    active_parcel = None
    if parcel_id:
        active_parcel = next((p for p in parcels_list if p["id"] == parcel_id), None)
    if active_parcel is None and parcels_list:
        active_parcel = parcels_list[0]

    # Rotation history for active parcel
    rotation_history = []
    if active_parcel:
        rh = RotationHistory.objects.filter(
            parcel_id=active_parcel["id"]
        ).order_by("-year", "-id")[:6]
        rotation_history = list(rh.values("crop_id", "season", "year", "yield_kg_ha", "irrigation_used"))

    # Latest plan
    active_plan = None
    plan_qs = FarmPlan.objects.filter(user=user).order_by("-created_at").first()
    if plan_qs:
        active_plan = {
            "id": plan_qs.id,
            "title": plan_qs.title,
            "status": plan_qs.status,
            "selected_crop": plan_qs.selected_crop,
            "recommended_crops": plan_qs.recommended_crops,
            "is_demo": False,
        }

    # Farmer priorities
    priorities = {}
    for fp in FarmerPriority.objects.filter(user=user):
        priorities[fp.priority_name] = fp.weight

    # Previous crop from rotation or plan
    previous_crop = "fallow"
    if rotation_history:
        previous_crop = rotation_history[0]["crop_id"]
    elif active_plan and active_plan.get("selected_crop"):
        previous_crop = active_plan["selected_crop"]

    # Climate data
    climate = None
    indicators = None
    if fetch_climate and active_parcel:
        climate, indicators = _fetch_climate(active_parcel["latitude"], active_parcel["longitude"])

    return {
        "farmer": {
            "username": user.username,
            "first_name": user.first_name or user.username,
            "is_demo": False,
        },
        "parcels": parcels_list,
        "active_parcel": active_parcel,
        "previous_crop": previous_crop,
        "rotation_history": rotation_history,
        "priorities": priorities,
        "active_plan": active_plan,
        "climate": climate,
        "indicators": indicators,
        "is_demo": False,
    }


def _fetch_climate(lat, lon):
    """Fetch NASA climate data and calculate agro-climatic indicators."""
    try:
        climate_result = nasa_power.fetch_climate_data(lat, lon)
        indicators = calculator.calculate(climate_result)
        return climate_result, indicators
    except InsufficientDataError:
        return None, None
    except Exception:
        return None, None
