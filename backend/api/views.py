"""
TerraRota API views.
"""
import logging
from datetime import datetime, timezone

from django.db import models
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RecommendationRequestSerializer,
    WhatIfRequestSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    ParcelSerializer,
    FarmPlanSerializer,
    RotationHistorySerializer,
)
from fields.models import Parcel, FarmPlan, RotationHistory
from data_services import nasa_power
from data_services.nasa_power import NASADataStatus
from data_services.registry import get_data_sources_registry
from indicators import calculator
from indicators.calculator import InsufficientDataError
from recommendation import engine
from recommendation.rules import CROPS
from recommendation.scenarios import generate_scenarios
from recommendation.whatif import simulate_whatif
from recommendation.reports import compile_decision_report

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
        "version": "2.0.0",
        "nasa_power_reachable": nasa_reachable,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@api_view(["POST"])
def recommend(request):
    """
    POST /api/v1/recommendations/
    Accepts farmer inputs and priorities, fetches NASA data, runs indicator calculation,
    runs recommendation engine, returns ranked results with full scientific evidence.
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

    # 3. Run recommendation engine with priorities
    farmer_inputs = {
        "previous_crop": data.get("previous_crop"),
        "water_access": data.get("water_access"),
        "soil_type": data.get("soil_type"),
        "field_size_ha": data.get("field_size_ha"),
        "latitude": lat,
        "longitude": lon,
    }
    preferred_crops = data.get("preferred_crops", [])
    farmer_priorities = data.get("farmer_priorities", {})

    engine_result = engine.rank(
        indicators,
        farmer_inputs,
        preferred_crops=preferred_crops,
        farmer_priorities=farmer_priorities,
    )

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


@api_view(["POST"])
def scenarios_view(request):
    """
    POST /api/v1/scenarios/
    Generates 4-5 multi-year crop rotation scenarios for the farm.
    """
    serializer = RecommendationRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"status": "error", "code": "VALIDATION_ERROR", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    lat = data["latitude"]
    lon = data["longitude"]

    climate_result = nasa_power.fetch_climate_data(lat, lon)
    try:
        indicators = calculator.calculate(climate_result)
    except InsufficientDataError as exc:
        return Response({"status": "error", "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    farmer_inputs = {
        "previous_crop": data.get("previous_crop"),
        "water_access": data.get("water_access"),
        "soil_type": data.get("soil_type"),
        "field_size_ha": data.get("field_size_ha"),
        "latitude": lat,
        "longitude": lon,
    }
    farmer_priorities = data.get("farmer_priorities", {})

    engine_result = engine.rank(
        indicators,
        farmer_inputs,
        farmer_priorities=farmer_priorities,
    )

    generated_scenarios = generate_scenarios(
        indicators,
        farmer_inputs,
        engine_result["recommendations"],
        farmer_priorities,
    )

    return Response({
        "status": "ok",
        "scenarios": generated_scenarios,
        "indicators": _clean_indicators(indicators),
        "provenance": climate_result.get("provenance"),
    })


@api_view(["POST"])
def whatif_view(request):
    """
    POST /api/v1/whatif/
    Runs what-if simulation comparing baseline against hypothetical changes.
    """
    serializer = WhatIfRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"status": "error", "code": "VALIDATION_ERROR", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    lat = data["latitude"]
    lon = data["longitude"]

    climate_result = nasa_power.fetch_climate_data(lat, lon)
    try:
        base_indicators = calculator.calculate(climate_result)
    except InsufficientDataError as exc:
        return Response({"status": "error", "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    base_inputs = {
        "previous_crop": data.get("previous_crop"),
        "water_access": data.get("water_access"),
        "soil_type": data.get("soil_type"),
        "field_size_ha": data.get("field_size_ha"),
        "latitude": lat,
        "longitude": lon,
    }

    sim_result = simulate_whatif(
        base_indicators,
        base_inputs,
        data["simulated_changes"],
    )

    return Response({
        "status": "ok",
        "simulation": sim_result,
        "provenance": climate_result.get("provenance"),
    })


@api_view(["GET"])
def crops_list(request):
    """
    GET /api/v1/crops/
    Returns concise list of supported crops for dropdowns.
    """
    return Response({
        "crops": [
            {
                "id": crop_id,
                "name_fr": info["name_fr"],
                "name_ar": info["name_ar"],
                "name_en": info.get("name_en", info["name_fr"]),
                "category": info["category"],
                "emoji": info.get("emoji", "🌱"),
            }
            for crop_id, info in CROPS.items()
        ]
    })


@api_view(["GET"])
def crops_detail_list(request):
    """
    GET /api/v1/crops/detail/
    Returns full structured agronomic knowledge base for all crops with scientific citations.
    """
    return Response({
        "status": "ok",
        "total": len(CROPS),
        "crops": [
            {
                "id": crop_id,
                **info,
            }
            for crop_id, info in CROPS.items()
        ]
    })


@api_view(["GET"])
def data_sources_list(request):
    """
    GET /api/v1/data-sources/
    Returns official NASA Earth Observation registry and integration statuses.
    """
    return Response({
        "status": "ok",
        "data_sources": get_data_sources_registry(),
    })


@api_view(["POST"])
def report_generate(request):
    """
    POST /api/v1/reports/decision-report/
    Generates a structured decision-support report for a farm parcel.
    """
    serializer = RecommendationRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"status": "error", "code": "VALIDATION_ERROR", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    lat = data["latitude"]
    lon = data["longitude"]

    climate_result = nasa_power.fetch_climate_data(lat, lon)
    indicators = calculator.calculate(climate_result)

    farmer_inputs = {
        "name": request.data.get("farm_name", "Parcelle Agricole Pilote"),
        "region": request.data.get("region", "Maroc"),
        "previous_crop": data.get("previous_crop"),
        "water_access": data.get("water_access"),
        "soil_type": data.get("soil_type"),
        "field_size_ha": data.get("field_size_ha"),
        "latitude": lat,
        "longitude": lon,
    }

    engine_result = engine.rank(indicators, farmer_inputs, farmer_priorities=data.get("farmer_priorities"))

    report_payload = compile_decision_report(
        farmer_inputs,
        indicators,
        climate_result.get("provenance", {}),
        engine_result["recommendations"],
        plan_info=request.data.get("plan_info"),
        farmer_priorities=data.get("farmer_priorities"),
    )

    return Response({
        "status": "ok",
        "report": report_payload,
    })


def _clean_indicators(indicators: dict) -> dict:
    """Remove internal fields (prefixed with _) from indicator dict for API response."""
    return {k: v for k, v in indicators.items() if not k.startswith("_")}


# ─── Auth Views ──────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """POST /api/v1/auth/register/"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "status": "ok",
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(
        {"status": "error", "errors": serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """GET /api/v1/auth/me/"""
    return Response({
        "status": "ok",
        "user": UserSerializer(request.user).data,
    })


# ─── Parcel & Plan Management ────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def parcels(request):
    """GET/POST /api/v1/parcels/ (Authenticated or Guest/Demo)"""
    if request.method == "GET":
        if request.user.is_authenticated:
            items = Parcel.objects.filter(user=request.user)
        else:
            items = Parcel.objects.filter(models.Q(user__isnull=True) | models.Q(user__username='demo_farmer'))
        return Response({
            "status": "ok",
            "parcels": ParcelSerializer(items, many=True).data,
        })

    serializer = ParcelSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user if request.user.is_authenticated else None
        parcel = serializer.save(user=user)
        return Response({
            "status": "ok",
            "parcel": ParcelSerializer(parcel).data,
        }, status=status.HTTP_201_CREATED)
    return Response(
        {"status": "error", "errors": serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["DELETE"])
@permission_classes([AllowAny])
def parcel_detail(request, pk):
    """DELETE /api/v1/parcels/<id>/"""
    try:
        if request.user.is_authenticated:
            item = Parcel.objects.get(pk=pk, user=request.user)
        else:
            item = Parcel.objects.get(models.Q(pk=pk) & (models.Q(user__isnull=True) | models.Q(user__username='demo_farmer')))
    except Parcel.DoesNotExist:
        return Response(
            {"status": "error", "message": "Parcel not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    item.delete()
    return Response({"status": "ok", "message": "Parcel deleted"})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def plans_list_create(request):
    """
    GET /api/v1/plans/ — List plans (authenticated user or public demo plans)
    POST /api/v1/plans/ — Save a rotation plan (associates with user if logged in, or guest demo)
    """
    if request.method == "GET":
        if request.user.is_authenticated:
            user_plans = FarmPlan.objects.filter(user=request.user)
        else:
            # Guest / Demo mode: return public demo plans and unassigned plans
            user_plans = FarmPlan.objects.filter(models.Q(user__isnull=True) | models.Q(user__username='demo_farmer'))
        return Response({
            "status": "ok",
            "plans": FarmPlanSerializer(user_plans, many=True).data,
        })

    serializer = FarmPlanSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user if request.user.is_authenticated else None
        plan = serializer.save(user=user)
        return Response({
            "status": "ok",
            "plan": FarmPlanSerializer(plan).data,
        }, status=status.HTTP_201_CREATED)
    return Response(
        {"status": "error", "errors": serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([AllowAny])
def plan_detail_patch(request, pk):
    """
    GET/PATCH/DELETE /api/v1/plans/<pk>/
    Update plan status (approve, reject, modify) with feedback.
    """
    try:
        if request.user.is_authenticated:
            plan = FarmPlan.objects.get(pk=pk, user=request.user)
        else:
            plan = FarmPlan.objects.get(models.Q(pk=pk) & (models.Q(user__isnull=True) | models.Q(user__username='demo_farmer')))
    except FarmPlan.DoesNotExist:
        return Response({"status": "error", "message": "Plan not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response({"status": "ok", "plan": FarmPlanSerializer(plan).data})

    if request.method == "DELETE":
        plan.delete()
        return Response({"status": "ok", "message": "Plan deleted"})

    # PATCH
    allowed_fields = ["status", "selected_crop", "crop_sequence", "rejection_reason", "farmer_feedback", "title"]
    for field in allowed_fields:
        if field in request.data:
            setattr(plan, field, request.data[field])
    plan.save()
    return Response({"status": "ok", "plan": FarmPlanSerializer(plan).data})

    return Response({
        "status": "ok",
        "plan": FarmPlanSerializer(plan).data,
    })
