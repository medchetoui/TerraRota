"""
TerraRota Advisor API Views.

Endpoints:
  GET  /api/v1/advisor/context/          — Farmer context (parcels, soil, climate, history)
  POST /api/v1/advisor/chat/             — AI agricultural advisor chat
  GET  /api/v1/advisor/history/          — List conversation sessions
  GET  /api/v1/advisor/history/<id>/     — Get session with messages
  POST /api/v1/advisor/compare/          — Compare two crops
  POST /api/v1/advisor/what-if/          — What-if simulation with context
  POST /api/v1/advisor/plan-proposal/    — Propose a farm plan change
  POST /api/v1/advisor/plan-proposal/<id>/approve/ — Approve/reject proposal
"""
import time
import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from fields.models import FarmPlan
from recommendation.whatif import simulate_whatif
from data_services import nasa_power
from indicators import calculator
from indicators.calculator import InsufficientDataError

from .models import AdvisorSession, AdvisorMessage
from .serializers import (
    ChatRequestSerializer,
    CompareRequestSerializer,
    AdvisorSessionSerializer,
    AdvisorSessionListSerializer,
    PlanProposalSerializer,
)
from .context import build_context
from .chat import answer, compare_crops
from io import BytesIO
from django.http import HttpResponse

logger = logging.getLogger("terrarota")


# ─── Natural Human Voice Audio Synthesizer (Studio Quality) ───────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def advisor_speak(request):
    """
    POST /api/v1/advisor/voice/speak/
    Generates real human-sounding speech MP3 on the fly for any Arabic/Darija,
    French, or English text using Google's Neural Text-to-Speech engine.
    """
    text = str(request.data.get("text") or "").strip()
    lang = str(request.data.get("lang") or "ar").strip().lower()

    if not text:
        return Response({"status": "error", "message": "text is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from gtts import gTTS
        # Map lang to gTTS language code with regional accent
        tts_lang = "ar"
        tld = "com"
        if lang == "fr":
            tts_lang = "fr"
            tld = "fr"
        elif lang == "en":
            tts_lang = "en"
            tld = "com"
        else:
            tts_lang = "ar"
            tld = "com"

        tts = gTTS(text=text, lang=tts_lang, tld=tld, slow=False)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)

        response = HttpResponse(fp.read(), content_type="audio/mpeg")
        response["Content-Disposition"] = 'inline; filename="ami_ahmed_voice.mp3"'
        return response
    except Exception as exc:
        logger.warning("gTTS generation error: %s", exc)
        return Response({
            "status": "error",
            "message": f"TTS synthesis unavailable: {exc}",
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# ─── Farmer Context ───────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def advisor_context(request):
    """
    GET /api/v1/advisor/context/
    Returns the authenticated farmer's full context:
    parcels, soil, rotation history, priorities, climate, farm plan.
    Unauthenticated → returns demo farmer context.
    """
    parcel_id = request.query_params.get("parcel_id")
    if parcel_id:
        try:
            parcel_id = int(parcel_id)
        except ValueError:
            parcel_id = None

    ctx = build_context(request.user, parcel_id=parcel_id, fetch_climate=True)

    # Remove internal climate result (keep only processed indicators for API response)
    climate = ctx.pop("climate", None)
    provenance = climate.get("provenance") if climate else None

    return Response({
        "status": "ok",
        "context": ctx,
        "provenance": provenance,
    })


# ─── Chat ─────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def advisor_chat(request):
    """
    POST /api/v1/advisor/chat/
    Main AI advisor endpoint. Accepts farmer question and returns
    a personalized agricultural answer with evidence.

    Body: { question, lang, session_id?, parcel_id?, scenario_id? }
    """
    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"status": "error", "code": "VALIDATION_ERROR", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    question = data["question"]
    lang = data["lang"]
    session_id = data.get("session_id")
    parcel_id = data.get("parcel_id")
    scenario_id = data.get("scenario_id", "cereales_apres_cereale")

    t0 = time.perf_counter()

    # 1. Build farmer context
    ctx = build_context(request.user, parcel_id=parcel_id, fetch_climate=True)

    # 2. Get or create session
    session = None
    if session_id:
        try:
            if request.user.is_authenticated:
                session = AdvisorSession.objects.get(id=session_id, user=request.user)
            else:
                session = AdvisorSession.objects.get(id=session_id, user__isnull=True)
        except AdvisorSession.DoesNotExist:
            session = None

    if session is None:
        session = AdvisorSession.objects.create(
            user=request.user if request.user.is_authenticated else None,
            lang=lang,
            parcel_id=parcel_id,
            context_snapshot={
                "region": (ctx.get("active_parcel") or {}).get("region", ""),
                "soil_type": (ctx.get("active_parcel") or {}).get("soil_type", ""),
                "water_access": (ctx.get("active_parcel") or {}).get("water_access", ""),
            },
        )

    # 3. Save user message
    user_msg = AdvisorMessage.objects.create(
        session=session,
        role="user",
        content=question,
        intent="",
    )

    # 4. Generate answer
    try:
        result = answer(question, ctx, lang=lang, scenario_id=scenario_id)
    except Exception as exc:
        logger.error("Advisor chat error: %s", exc)
        return Response({
            "status": "error",
            "message": "Service advisor temporairement indisponible.",
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    ms = round((time.perf_counter() - t0) * 1000, 1)
    result["ms"] = ms

    # 5. Save AI message
    ai_msg = AdvisorMessage.objects.create(
        session=session,
        role="ai",
        content=result["answer_text"],
        intent=result["intent"],
        ai_response=result,
    )

    # Update user message intent
    user_msg.intent = result["intent"]
    user_msg.save(update_fields=["intent"])

    return Response({
        "status": "ok",
        "session_id": session.id,
        "result": result,
    })


# ─── Conversation History ─────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def advisor_history_list(request):
    """
    GET /api/v1/advisor/history/
    Lists conversation sessions for the authenticated farmer.
    """
    if request.user.is_authenticated:
        sessions = AdvisorSession.objects.filter(user=request.user).order_by("-last_activity")[:20]
    else:
        sessions = AdvisorSession.objects.filter(user__isnull=True).order_by("-last_activity")[:5]

    serializer = AdvisorSessionListSerializer(sessions, many=True)
    return Response({
        "status": "ok",
        "sessions": serializer.data,
    })


@api_view(["GET", "DELETE"])
@permission_classes([AllowAny])
def advisor_history_detail(request, session_id):
    """
    GET  /api/v1/advisor/history/<id>/ — Full session with messages
    DELETE /api/v1/advisor/history/<id>/ — Delete session
    """
    try:
        if request.user.is_authenticated:
            session = AdvisorSession.objects.get(id=session_id, user=request.user)
        else:
            session = AdvisorSession.objects.get(id=session_id, user__isnull=True)
    except AdvisorSession.DoesNotExist:
        return Response(
            {"status": "error", "message": "Session not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        session.delete()
        return Response({"status": "ok", "message": "Session deleted"})

    serializer = AdvisorSessionSerializer(session)
    return Response({"status": "ok", "session": serializer.data})


# ─── Crop Comparison ──────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def advisor_compare(request):
    """
    POST /api/v1/advisor/compare/
    Compare two crops using the farmer's real parcel context.

    Body: { crop_a, crop_b, lang, parcel_id? }
    """
    serializer = CompareRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"status": "error", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    ctx = build_context(request.user, parcel_id=data.get("parcel_id"), fetch_climate=True)

    result = compare_crops(data["crop_a"], data["crop_b"], ctx, lang=data["lang"])

    if "error" in result:
        return Response({"status": "error", "message": result["error"]}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"status": "ok", "comparison": result})


# ─── What-If with Context ─────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def advisor_whatif(request):
    """
    POST /api/v1/advisor/what-if/
    Run what-if simulation using farmer's real parcel location.
    Uses existing simulate_whatif engine but auto-fills lat/lon from parcel.

    Body: { simulated_changes: {...}, parcel_id?, lang }
    """
    parcel_id = request.data.get("parcel_id")
    lang = request.data.get("lang", "fr")
    simulated_changes = request.data.get("simulated_changes", {})

    if not simulated_changes:
        return Response(
            {"status": "error", "message": "simulated_changes is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Get context for location
    ctx = build_context(request.user, parcel_id=parcel_id, fetch_climate=True)
    active_parcel = ctx.get("active_parcel") or {}
    indicators = ctx.get("indicators")

    if not indicators:
        # Try to fetch climate if not already
        lat = active_parcel.get("latitude", 33.0)
        lon = active_parcel.get("longitude", -7.6)
        try:
            climate_result = nasa_power.fetch_climate_data(lat, lon)
            indicators = calculator.calculate(climate_result)
        except (InsufficientDataError, Exception) as exc:
            return Response(
                {"status": "error", "message": f"Climate data unavailable: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    base_inputs = {
        "previous_crop": ctx.get("previous_crop", "fallow"),
        "water_access": active_parcel.get("water_access", "rainfed"),
        "soil_type": active_parcel.get("soil_type", "unknown"),
        "field_size_ha": active_parcel.get("field_size_ha"),
        "latitude": active_parcel.get("latitude", 33.0),
        "longitude": active_parcel.get("longitude", -7.6),
    }

    sim_result = simulate_whatif(indicators, base_inputs, simulated_changes)

    return Response({
        "status": "ok",
        "simulation": sim_result,
        "context_summary": {
            "region": active_parcel.get("region", ""),
            "is_demo": ctx.get("is_demo", True),
        },
    })


# ─── Plan Proposal (Advisor → Farmer Approval Workflow) ──────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def advisor_plan_proposal(request):
    """
    POST /api/v1/advisor/plan-proposal/
    AI proposes a farm plan change. The farmer must explicitly approve it
    via /plan-proposal/<id>/approve/ before it modifies any official plan.

    CRITICAL: The AI never modifies an official FarmPlan automatically.
    """
    serializer = PlanProposalSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"status": "error", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    crop_id = data["crop_id"]
    reason = data["reason"]
    lang = data["lang"]
    parcel_id = data.get("parcel_id")

    # Build context
    ctx = build_context(request.user, parcel_id=parcel_id, fetch_climate=False)
    active_parcel = ctx.get("active_parcel") or {}

    # Create a DRAFT plan proposal (status='proposed', not 'approved')
    # This requires farmer explicit confirmation before it becomes active
    proposal = FarmPlan.objects.create(
        user=request.user if request.user.is_authenticated else None,
        parcel_id=active_parcel.get("id"),
        title=f"{'AI Proposal' if lang == 'en' else 'Proposition IA' if lang == 'fr' else 'اقتراح عمي أحمد'}: {crop_id}",
        status="proposed",  # NOT 'approved' — farmer must confirm
        selected_crop=crop_id,
        recommended_crops=[],
        farmer_feedback="",
    )

    # Explanation text
    if lang == "ar":
        explanation = (
            f"عمي أحمد يقترح لك زراعة {crop_id} باش الموسم الجاي. "
            f"{reason} "
            f"هاد الاقتراح ما يتطبقش حتى تقبله بصراحة."
        )
        confirm_prompt = "هل تقبل هذا الاقتراح وتضيفه لخطتك الزراعية؟"
    elif lang == "fr":
        explanation = (
            f"Ami Ahmed vous propose de cultiver {crop_id} pour la prochaine saison. "
            f"{reason} "
            f"Cette proposition ne sera appliquée que si vous la confirmez explicitement."
        )
        confirm_prompt = "Acceptez-vous cette proposition et souhaitez-vous l'ajouter à votre plan agricole ?"
    else:
        explanation = (
            f"Ami Ahmed suggests planting {crop_id} for the next season. "
            f"{reason} "
            f"This proposal will only be applied if you explicitly confirm it."
        )
        confirm_prompt = "Do you accept this proposal and want to add it to your farm plan?"

    return Response({
        "status": "ok",
        "proposal_id": proposal.id,
        "proposal_status": "pending_farmer_approval",
        "proposed_crop": crop_id,
        "explanation": explanation,
        "confirm_prompt": confirm_prompt,
        "warning": "This plan is NOT active until you approve it.",
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def advisor_plan_proposal_approve(request, proposal_id):
    """
    POST /api/v1/advisor/plan-proposal/<id>/approve/
    Farmer explicitly approves or rejects the AI-proposed plan.

    Body: { action: 'approve' | 'reject', feedback? }
    """
    action = request.data.get("action")
    feedback = request.data.get("feedback", "")

    if action not in ("approve", "reject"):
        return Response(
            {"status": "error", "message": "action must be 'approve' or 'reject'"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        if request.user.is_authenticated:
            proposal = FarmPlan.objects.get(id=proposal_id, user=request.user, status="proposed")
        else:
            proposal = FarmPlan.objects.get(
                id=proposal_id, user__isnull=True, status="proposed"
            )
    except FarmPlan.DoesNotExist:
        return Response(
            {"status": "error", "message": "Proposal not found or already processed"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if action == "approve":
        proposal.status = "approved"
        proposal.farmer_feedback = feedback
        proposal.save()
        return Response({
            "status": "ok",
            "message": "Plan approved and saved to your farm.",
            "plan_id": proposal.id,
            "plan_status": "approved",
        })
    else:
        proposal.status = "rejected"
        proposal.rejection_reason = feedback
        proposal.save()
        return Response({
            "status": "ok",
            "message": "Proposal rejected. No changes were made to your farm plan.",
            "plan_id": proposal.id,
            "plan_status": "rejected",
        })
