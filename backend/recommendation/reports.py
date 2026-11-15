"""
TerraRota Decision Report Generator.

Compiles an authoritative, scientifically credible agricultural decision-support
report ready for farmer review and PDF export.
"""
from datetime import datetime, timezone
from typing import Any
from .rules import CROPS
from .scenarios import generate_scenarios


def compile_decision_report(
    parcel_info: dict[str, Any],
    indicators: dict[str, Any],
    provenance: dict[str, Any],
    recommendations: list[dict[str, Any]],
    plan_info: dict[str, Any] | None = None,
    farmer_priorities: dict[str, float] | None = None,
) -> dict[str, Any]:
    """
    Assembles complete decision report payload for PDF rendering or API consumption.
    """
    now_iso = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")

    # Top recommended crop
    primary_crop = recommendations[0] if recommendations else None

    # Generate multi-year scenarios for the report
    scenarios = generate_scenarios(
        indicators,
        parcel_info,
        recommendations,
        farmer_priorities,
    )

    return {
        "report_id": f"TR-REPORT-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "generated_at": now_iso,
        "title": "TERRAROTA — RAPPORT D'AIDE À LA DÉCISION AGRICOLE",
        "title_en": "TERRAROTA — AGRICULTURAL DECISION-SUPPORT REPORT",
        "title_ar": "تيراروتا — تقرير المساعدة في اتخاذ القرار الفلاحي",
        "competition": "NASA Space Apps Challenge 2026 • Challenge: Field Shift",
        "farm": {
            "name": parcel_info.get("name", "Parcelle Agricole Pilote"),
            "region": parcel_info.get("region", "Maroc"),
            "latitude": parcel_info.get("latitude"),
            "longitude": parcel_info.get("longitude"),
            "surface_ha": parcel_info.get("field_size_ha", 4.8),
            "water_access": parcel_info.get("water_access", "rainfed"),
            "soil_type": parcel_info.get("soil_type", "clay_loam"),
            "previous_crop": parcel_info.get("previous_crop", "wheat_hard"),
            "previous_crop_name": CROPS.get(parcel_info.get("previous_crop", ""), {}).get("name_fr", parcel_info.get("previous_crop")),
        },
        "environmental_data": {
            "annual_rain_mm": indicators.get("annual_rain_mm"),
            "mean_annual_temp_c": indicators.get("mean_annual_temp_c"),
            "gdd_base10": indicators.get("gdd_base10"),
            "aridity_index": indicators.get("aridity_index"),
            "frost_days_per_year": indicators.get("frost_days_per_year"),
            "dry_months": indicators.get("dry_months"),
            "missing_data_pct": indicators.get("missing_data_pct", 0),
        },
        "nasa_provenance": {
            "source": provenance.get("source", "NASA POWER Daily v2.0"),
            "observation_period": provenance.get("period", {}),
            "spatial_resolution": "0.5° × 0.5° (~50 km)",
            "retrieved_at": provenance.get("retrieved_at"),
            "variables_used": provenance.get("variables", []),
        },
        "primary_recommendation": primary_crop,
        "all_recommendations": recommendations[:5],
        "scenarios": scenarios,
        "selected_plan": plan_info or {
            "status": "proposed",
            "selected_crop": primary_crop.get("crop_id") if primary_crop else "wheat_hard",
            "notes": "Plan initial proposé par le moteur agronomique TerraRota.",
        },
        "scientific_citations": [
            "INRA Maroc (Settat) — Bulletin Agronomique sur la rotation des cultures céréalières et légumineuses en zone semi-aride.",
            "FAO Irrigation and Drainage Paper 56 — Crop Evapotranspiration guidelines.",
            "ICARDA — Legume Production and Biological Nitrogen Fixation in WANA Region.",
            "NASA Langley Research Center — Prediction Of Worldwide Energy Resources (POWER) Agroclimatology.",
        ],
        "limitations_statement": (
            "Ce rapport d'aide à la décision synthétise des observations satellitaires et des règles agronomiques "
            "déterministes. Les données NASA à 0.5° reflètent le macro-climat régional. Une validation par un "
            "conseiller agricole de proximité reste recommandée avant les semis."
        ),
    }
