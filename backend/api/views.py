"""
TerraRota API views.
"""
import logging
from datetime import datetime, timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import RecommendationRequestSerializer
from data_services import nasa_power
from data_services.nasa_power import NASADataStatus
from indicators import calculator
from indicators.calculator import InsufficientDataError
from recommendation import engine
from recommendation.rules import CROPS

logger = logging.getLogger("terrarota")


@api_view(["GET"])
def health(request):
    """
    GET /api/v1/health/
    Returns service health status and NASA POWER reachability.
    """
    nasa_reachable = nasa_power.check_nasa_connectivity()
    return Response({
        "status": "ok",
        "version": "1.0.0",
        "nasa_power_reachable": nasa_reachable,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@api_view(["POST"])
def recommend(request):
    """
    POST /api/v1/recommendations/
    Accepts farmer inputs, fetches NASA data, runs indicator calculation,
    runs recommendation engine, returns ranked results.
    """
    serializer = RecommendationRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "status": "error",
                "code": "VALIDATION_ERROR",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    lat = data["latitude"]
    lon = data["longitude"]

    logger.info(
        "Recommendation request: lat=%.4f lon=%.4f water=%s soil=%s prev=%s",
        lat, lon,
        data.get("water_access"),
        data.get("soil_type"),
        data.get("previous_crop"),
    )

    # 1. Fetch NASA climate data
    climate_result = nasa_power.fetch_climate_data(lat, lon)
    data_status = climate_result.get("status", NASADataStatus.SAMPLE)
    sample_note = climate_result.get("sample_note")

    # 2. Calculate indicators
    try:
        indicators = calculator.calculate(climate_result)
    except InsufficientDataError as exc:
        logger.warning("Insufficient data for (%.4f, %.4f): %s", lat, lon, exc)
        return Response({
            "status": "ok",
            "data_status": NASADataStatus.INSUFFICIENT,
            "insufficient_data_reason": str(exc),
            "recommendations": [],
            "abstained_crops": [],
            "provenance": climate_result.get("provenance"),
            "indicators": None,
            "sample_note": sample_note,
        })

    # 3. Run recommendation engine
    farmer_inputs = {
        "previous_crop": data.get("previous_crop"),
        "water_access": data.get("water_access"),
        "soil_type": data.get("soil_type"),
        "field_size_ha": data.get("field_size_ha"),
        "latitude": lat,
        "longitude": lon,
    }
    preferred_crops = data.get("preferred_crops", [])
    engine_result = engine.rank(indicators, farmer_inputs, preferred_crops)

    # 4. Build response
    response_body = {
        "status": "ok",
        "data_status": data_status,
        "provenance": climate_result.get("provenance"),
        "indicators": _clean_indicators(indicators),
        "recommendations": engine_result["recommendations"],
        "abstained_crops": engine_result["abstained_crops"],
        "abstention_reason": engine_result["abstention_reason"],
        "rules_version": engine_result["rules_version"],
        "insufficient_data_reason": None,
    }

    if sample_note:
        response_body["sample_note"] = sample_note

    return Response(response_body)


@api_view(["GET"])
def crops_list(request):
    """
    GET /api/v1/crops/
    Returns the list of supported crops.
    """
    return Response({
        "crops": [
            {
                "id": crop_id,
                "name_fr": info["name_fr"],
                "name_ar": info["name_ar"],
                "category": info["category"],
                "emoji": info.get("emoji", "🌱"),
            }
            for crop_id, info in CROPS.items()
        ]
    })


def _clean_indicators(indicators: dict) -> dict:
    """Remove internal fields (prefixed with _) from indicator dict for API response."""
    return {k: v for k, v in indicators.items() if not k.startswith("_")}
