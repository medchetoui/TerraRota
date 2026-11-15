"""
chat.py — AI agricultural advisor chat engine for TerraRota.

Bridges the farmer's question (any language/dialect) with:
1. Farmer's real personalized context (parcels, soil, history, climate)
2. The existing deterministic agronomic recommendation engine
3. The existing Darija NLP classifier (comprendre.py)
4. The existing crop rotation and what-if engines

Returns a structured response with:
- Main text answer (trilingual: ar/fr/en)
- Darija phrases (from templates)
- Scientific evidence
- Suggested follow-up questions
- Detected intent

NO external LLM API required. All reasoning is deterministic and evidence-based.
"""
import sys
from pathlib import Path

# Import Darija understanding module
from fellah.darija import comprendre
from fellah.darija import repondre_darija as RD

from recommendation import engine as rec_engine
from recommendation.whatif import simulate_whatif
from recommendation.rules import CROPS


INTENTS_MAPPING = {
    "QUOI_PLANTER": {
        "ar": "شنو نزرع هاد الموسم",
        "fr": "Que planter cette saison",
        "en": "What to plant this season",
    },
    "POURQUOI": {
        "ar": "علاش هاد التوصية",
        "fr": "Pourquoi cette recommandation",
        "en": "Why this recommendation",
    },
    "PLUIE_METEO": {
        "ar": "حالة التساقطات والمناخ",
        "fr": "Pluviométrie et climat",
        "en": "Rainfall and climate conditions",
    },
    "SOL": {
        "ar": "حالة التربة",
        "fr": "État du sol",
        "en": "Soil condition",
    },
    "EAU_IRRIGATION": {
        "ar": "الماء والسقي",
        "fr": "Eau et irrigation",
        "en": "Water and irrigation",
    },
    "FIABILITE": {
        "ar": "موثوقية التوصية",
        "fr": "Fiabilité du conseil",
        "en": "Recommendation reliability",
    },
    "AVIS_CULTURE": {
        "ar": "رأي في محصول محدد",
        "fr": "Avis sur une culture spécifique",
        "en": "Opinion on a specific crop",
    },
    "HORS_PERIMETRE": {
        "ar": "سؤال خارج نطاق الخدمة",
        "fr": "Question hors périmètre",
        "en": "Out of scope question",
    },
    "INCONNU": {
        "ar": "سؤال غير مفهوم",
        "fr": "Question non comprise",
        "en": "Question not understood",
    },
}

FOLLOWUP_SUGGESTIONS = {
    "QUOI_PLANTER": {
        "ar": ["علاش هاد التوصية؟", "قارن ليا جوج محاصيل", "واش الأمطار كافية لهاد المحصول؟"],
        "fr": ["Pourquoi cette recommandation ?", "Comparez deux cultures", "Est-ce que les pluies sont suffisantes ?"],
        "en": ["Why this recommendation?", "Compare two crops", "Is rainfall sufficient for this crop?"],
    },
    "POURQUOI": {
        "ar": ["شنو المحاصيل الممكنة الأخرى؟", "واش نقدر نغير الخطة؟"],
        "fr": ["Quelles autres cultures sont possibles ?", "Puis-je modifier mon plan ?"],
        "en": ["What other crops are possible?", "Can I change my plan?"],
    },
    "default": {
        "ar": ["شنو نزرع هاد العام؟", "واش القمح مناسب لأرضي؟", "علاش هاد النصيحة؟"],
        "fr": ["Que planter cette année ?", "Le blé convient-il à ma parcelle ?", "Pourquoi ce conseil ?"],
        "en": ["What to plant this year?", "Is wheat suitable for my parcel?", "Why this advice?"],
    },
}


def answer(question: str, ctx: dict, lang: str = "ar", scenario_id: str = "cereales_apres_cereale", persona: str = "ami_ahmed") -> dict:
    """
    Main chat entry point.

    Args:
        question: farmer's question (any dialect/language)
        ctx: farmer context from context.build_context()
        lang: 'ar', 'fr', or 'en'
        scenario_id: fellah scenario (from /fellah/scenarios/)
        persona: 'ami_ahmed' (male advisor) or 'mi_fatima' (female advisor)

    Returns:
        dict with intent, answer_text, darija_phrases, evidence, followups, etc.
    """
    # 1. Classify intent using existing Darija NLP
    classification = comprendre.classer(question, "mots_cles")
    intent = classification.get("intention", "INCONNU")
    confidence = classification.get("confiance", 0.0)

    # Detect greetings and politeness
    q_clean = question.strip().lower()
    if any(g in q_clean for g in ["سلام", "salam", "السلام عليكم", "صباح الخير", "مساء الخير", "bonjour", "salut", "hello", "hi"]):
        intent = "SALUTATION"
        confidence = 1.0

    # Fallback keyword classification for French and English queries
    if intent == "INCONNU":
        q_lower = question.lower()
        if any(w in q_lower for w in ["que planter", "quoi planter", "quelle culture", "what to plant", "what should i plant", "which crop"]):
            intent = "QUOI_PLANTER"
            confidence = 0.9
        elif any(w in q_lower for w in ["pourquoi", "why", "justifi", "raison", "reason"]):
            intent = "POURQUOI"
            confidence = 0.9
        elif any(w in q_lower for w in ["pluie", "pleuvoir", "précipitation", "rain", "rainfall", "météo", "weather", "climat", "climate"]):
            intent = "PLUIE_METEO"
            confidence = 0.9
        elif any(w in q_lower for w in ["sol", "terre", "soil", "texture", "ph", "argil"]):
            intent = "SOL"
            confidence = 0.9
        elif any(w in q_lower for w in ["eau", "irrigation", "irrig", "water", "arros"]):
            intent = "EAU_IRRIGATION"
            confidence = 0.9
        elif any(w in q_lower for w in ["fiab", "confiance", "trust", "reliab", "nasa"]):
            intent = "FIABILITE"
            confidence = 0.9

    # 2. Build farmer inputs for the recommendation engine
    active_parcel = ctx.get("active_parcel") or {}
    indicators = ctx.get("indicators")
    previous_crop = ctx.get("previous_crop", "fallow")
    priorities = ctx.get("priorities", {})

    farmer_inputs = {
        "previous_crop": previous_crop,
        "water_access": active_parcel.get("water_access", "rainfed"),
        "soil_type": active_parcel.get("soil_type", "unknown"),
        "field_size_ha": active_parcel.get("field_size_ha"),
        "latitude": active_parcel.get("latitude", 33.0),
        "longitude": active_parcel.get("longitude", -7.6),
    }

    # 3. Get recommendation engine result (if indicators available)
    engine_result = None
    top_crop = None
    if indicators:
        try:
            engine_result = rec_engine.rank(
                indicators,
                farmer_inputs,
                farmer_priorities=priorities or None,
            )
            if engine_result.get("recommendations"):
                top_crop = engine_result["recommendations"][0]
        except Exception:
            pass

    # 4. Try to get Darija template response
    darija_response = None
    try:
        darija_response = RD.repondre_darija(question, scenario_id)
    except Exception:
        pass

    # 5. Build the personalized text answer
    answer_text = _build_personalized_answer(
        intent=intent,
        question=question,
        lang=lang,
        ctx=ctx,
        farmer_inputs=farmer_inputs,
        indicators=indicators,
        engine_result=engine_result,
        top_crop=top_crop,
        darija_response=darija_response,
        persona=persona,
    )

    # 6. Build evidence from recommendation engine
    evidence = []
    if top_crop and top_crop.get("evidences"):
        evidence = top_crop["evidences"][:3]

    # 7. Followup suggestions
    followups = FOLLOWUP_SUGGESTIONS.get(intent, FOLLOWUP_SUGGESTIONS["default"])[lang]

    # 8. Phrases from Darija templates (for TTS)
    darija_phrases = []
    if darija_response and darija_response.get("lignes_darija"):
        darija_phrases = darija_response["lignes_darija"]

    # 9. Data provenance
    data_sources = []
    if indicators:
        data_sources.append("NASA POWER Agroclimatology (5 ans)")
    if ctx.get("active_parcel"):
        p = ctx["active_parcel"]
        if p.get("soil_type") and p["soil_type"] != "unknown":
            data_sources.append(f"Données sol: {p['soil_type']}")
    if ctx.get("rotation_history"):
        data_sources.append("Historique cultural de la parcelle")

    return {
        "intent": intent,
        "intent_label": INTENTS_MAPPING.get(intent, INTENTS_MAPPING["INCONNU"]),
        "confidence": confidence,
        "answer_text": answer_text,
        "darija_phrases": darija_phrases,
        "evidence": evidence,
        "followup_suggestions": followups,
        "top_crop": {
            "crop_id": top_crop["crop_id"],
            "name_fr": top_crop["crop_name_fr"],
            "name_ar": top_crop["crop_name_ar"],
            "name_en": top_crop.get("crop_name_en", top_crop["crop_name_fr"]),
            "emoji": top_crop.get("crop_emoji", "🌱"),
            "score": top_crop["score"],
            "reasons": top_crop.get("reasons_en" if lang == "en" else "reasons_fr" if lang == "fr" else "reasons", []),
            "cautions": top_crop.get("cautions_en" if lang == "en" else "cautions_fr" if lang == "fr" else "cautions", []),
        } if top_crop else None,
        "all_recommendations": _slim_recs(engine_result, lang) if engine_result else [],
        "data_sources": data_sources,
        "is_personalized": not ctx.get("is_demo", True),
        "context_summary": _summarize_context(ctx, lang),
        "ms": 0,  # filled by view
    }


def _build_personalized_answer(
    intent, question, lang, ctx, farmer_inputs, indicators, engine_result, top_crop, darija_response, persona="ami_ahmed"
):
    """Build a natural language answer based on intent and farmer context."""
    active_parcel = ctx.get("active_parcel") or {}
    farmer_name = ctx.get("farmer", {}).get("first_name", "الفلاح")
    is_demo = ctx.get("is_demo", True)

    region = active_parcel.get("region", "منطقة المغرب")
    water = active_parcel.get("water_access", "rainfed")
    soil = active_parcel.get("soil_type", "unknown")
    prev_crop_id = ctx.get("previous_crop", "fallow")
    prev_crop_name = CROPS.get(prev_crop_id, {}).get(
        "name_en" if lang == "en" else "name_fr", prev_crop_id
    )

    is_fatima = persona == "mi_fatima"
    advisor_name_ar = "مي فاطمة، المستشارة الفلاحية ديالك" if is_fatima else "عمي أحمد، المستشار الفلاحي ديالك"
    advisor_name_fr = "Mi Fatima, votre conseillère agricole" if is_fatima else "Ami Ahmed, votre conseiller agricole"
    advisor_name_en = "Mi Fatima, your agricultural advisor" if is_fatima else "Ami Ahmed, your agricultural advisor"

    # Climate summary
    rain_mm = round(indicators["annual_rain_mm"]) if indicators else None
    temp_c = round(indicators["mean_annual_temp_c"], 1) if indicators else None

    # ── SALUTATION ───────────────────────────────────────────────
    if intent == "SALUTATION":
        if lang == "ar":
            return (
                f"وعليكم السلام ورحمة الله أ سي {farmer_name}! مرحباً بك. "
                f"أنا {advisor_name_ar} لأرض {region}. "
                f"أنا مربوطة بأقمار ناسا وكنعرف طبيعة التربة ديالك ({soil}). " if is_fatima else
                f"وعليكم السلام ورحمة الله أ سي {farmer_name}! مرحباً بك. "
                f"أنا {advisor_name_ar} لأرض {region}. "
                f"أنا مربوط مباشرة بأقمار ناسا وكنعرف طبيعة التربة ديالك ({soil}). "
                f"تفضل سولني: شنو باغي تزرع، واش تكمل بالقمح، أو حالة الشتا فهاد الموسم؟"
            )
        elif lang == "fr":
            return (
                f"Bonjour et bienvenue {farmer_name} ! Je suis {advisor_name_fr} pour la région de {region}. "
                f"Connectée aux satellites NASA et aux données de votre sol ({soil}), " if is_fatima else
                f"Bonjour et bienvenue {farmer_name} ! Je suis {advisor_name_fr} pour la région de {region}. "
                f"Connecté aux satellites NASA et aux données de votre sol ({soil}), "
                f"je suis à votre écoute : quelle culture envisager, rotation ou météo ?"
            )
        else:
            return (
                f"Hello and welcome {farmer_name}! I am {advisor_name_en} for {region}. "
                f"Connected directly to NASA satellites and your soil data ({soil}), "
                f"feel free to ask: what to plant, crop rotation, or rainfall conditions."
            )

    # ── QUOI_PLANTER ──────────────────────────────────────────────
    elif intent == "QUOI_PLANTER":
        if top_crop:
            crop_name = top_crop.get(
                "crop_name_en" if lang == "en" else "crop_name_fr",
                top_crop["crop_name_ar"]
            )
            reasons = top_crop.get("reasons_en" if lang == "en" else "reasons_fr" if lang == "fr" else "reasons") or []
            reasons_text = ". ".join(reasons[:2]) if reasons else ""
            cautions = top_crop.get("cautions_en" if lang == "en" else "cautions_fr" if lang == "fr" else "cautions") or []
            caution_text = cautions[0] if cautions else ""

            if lang == "ar":
                prev_text = f"المحصول السابق كان {prev_crop_name}، وهاد التناوب كيحافظ على خصوبة الأرض ويقلل من الأمراض." if prev_crop_id != 'fallow' else "الأرض كانت مرتاحة، وهاد المحصول غادي يستافد مزيان."
                soil_text = f"تربة ديالك {soil} كتناسب جذور هاد المحصول." if soil != "unknown" else ""
                why_text = f"وعلاش بالضبط نصحتك بيه؟ أولاً، {reasons_text}. ثانياً، {soil_text} {prev_text}"
                return (
                    f"أهلاً سي {farmer_name}! "
                    f"بناءً على معطيات أرضك ف {region} ومعطيات أقمار ناسا للمناخ "
                    f"(تساقطات: {rain_mm} ملم/سنة، والحرارة: {temp_c}°C)، "
                    f"أحسن محصول مقترح ليك هاد الموسم هو {top_crop['crop_name_ar']} {top_crop.get('crop_emoji','🌱')} (نقطة الملائمة: {top_crop.get('score', 80)}/100). "
                    f"{why_text} "
                    f"{'رد بالك: ' + caution_text if caution_text else ''} "
                    f"واش بغيتي نزيد نشرح ليك أكتر، أو نديرو مقارنة مع محصول آخر؟"
                )
            elif lang == "fr":
                prev_text = f"Votre précédent cultural était {prev_crop_name}, ce qui assure une excellente rotation sanitaire et azotée." if prev_crop_id != 'fallow' else ""
                soil_text = f"Votre sol {soil} présente une rétention idéale pour cette plante." if soil != "unknown" else ""
                why_text = f"Pourquoi ce choix ? D'abord, {reasons_text}. De plus, {soil_text} {prev_text}"
                return (
                    f"Bonjour {farmer_name} ! "
                    f"D'après les données de votre parcelle à {region} et les observations satellites NASA "
                    f"({rain_mm} mm/an, {temp_c}°C), "
                    f"la culture la plus recommandée est {top_crop.get('crop_name_fr', crop_name)} {top_crop.get('crop_emoji','🌱')} (score : {top_crop.get('score', 80)}/100). "
                    f"{why_text} "
                    f"{'Attention : ' + caution_text if caution_text else ''} "
                    f"Souhaitez-vous que je compare avec une autre culture ou simule un scénario de sécheresse ?"
                )
            else:
                prev_text = f"Your previous crop was {prev_crop_name}, providing an agronomic rotation benefit." if prev_crop_id != 'fallow' else ""
                soil_text = f"Your {soil} soil type provides suitable aeration and retention." if soil != "unknown" else ""
                why_text = f"Why this crop? First, {reasons_text}. Additionally, {soil_text} {prev_text}"
                return (
                    f"Hello {farmer_name}! "
                    f"Based on your parcel in {region} and NASA agroclimate observations "
                    f"({rain_mm} mm/year, {temp_c}°C), "
                    f"the top recommended crop is {top_crop.get('crop_name_en', crop_name)} {top_crop.get('crop_emoji','🌱')} (score: {top_crop.get('score', 80)}/100). "
                    f"{why_text} "
                    f"{'Note: ' + caution_text if caution_text else ''} "
                    f"Would you like to compare with another crop or explore a what-if scenario?"
                )
        else:
            if lang == "ar":
                return "ما عندي البيانات المناخية الكافية حاليا. سول عن المنطقة ديالك."
            elif lang == "fr":
                return "Je n'ai pas encore les données climatiques suffisantes. Précisez votre région."
            else:
                return "I don't have sufficient climate data yet. Please specify your region."

    # ── POURQUOI ──────────────────────────────────────────────────
    elif intent == "POURQUOI":
        if top_crop:
            reasons = top_crop.get("reasons_en" if lang == "en" else "reasons_fr" if lang == "fr" else "reasons", [])
            reason_text = " ".join(reasons[:2]) if reasons else ""
            if lang == "ar":
                return (
                    f"التوصية بـ {top_crop['crop_name_ar']} مبنية على ثلاثة عوامل رئيسية: "
                    f"{reason_text} "
                    f"{'بالإضافة إلى أن التربة ديالك من نوع ' + soil + ' وهي مناسبة.' if soil != 'unknown' else ''}"
                )
            elif lang == "fr":
                return (
                    f"La recommandation de {top_crop.get('crop_name_fr','')} repose sur : "
                    f"{reason_text} "
                    f"{'De plus, votre sol de type ' + soil + ' est favorable à cette culture.' if soil != 'unknown' else ''}"
                )
            else:
                return (
                    f"The recommendation for {top_crop.get('crop_name_en','')} is based on: "
                    f"{reason_text} "
                    f"{'Additionally, your soil type ({soil}) is well-suited for this crop.' if soil != 'unknown' else ''}"
                )

    # ── PLUIE_METEO ──────────────────────────────────────────────
    elif intent == "PLUIE_METEO":
        if indicators:
            aridity = indicators.get("aridity_index", 0)
            category = "جاف" if aridity < 0.3 else ("شبه جاف" if aridity < 0.5 else "معتدل")
            if lang == "ar":
                return (
                    f"المنطقة ديالك ({region}) سجلت ناسا فيها {rain_mm} ملم/سنة "
                    f"ومعدل حرارة {temp_c}°C. المناخ {category} "
                    f"(مؤشر الجفاف: {round(aridity, 2)}). "
                    f"{'الوضع مناسب للزراعة البورية.' if water == 'rainfed' and rain_mm and rain_mm > 300 else 'الري الإضافي مستحسن.' if water == 'rainfed' else 'الري المتاح يوفر ضمانات إضافية.'}"
                )
            elif lang == "fr":
                rain_note = "Conditions favorables à la culture pluviale." if water == "rainfed" and rain_mm and rain_mm > 300 else ("Une irrigation d'appoint serait bénéfique." if water == "rainfed" else "L'irrigation disponible offre une sécurité supplémentaire.")
                return (
                    f"La NASA enregistre pour {region} : {rain_mm} mm/an, {temp_c}°C. "
                    f"Climat {category} (Indice d'aridité: {round(aridity, 2)}). "
                    f"{rain_note}"
                )
            else:
                return (
                    f"NASA records for {region}: {rain_mm} mm/year, {temp_c}°C. "
                    f"Climate category: {category} (Aridity Index: {round(aridity, 2)}). "
                    f"{'Suitable for rainfed farming.' if water == 'rainfed' and rain_mm and rain_mm > 300 else 'Supplemental irrigation would be beneficial.' if water == 'rainfed' else 'Available irrigation provides additional security.'}"
                )

    # ── EAU_IRRIGATION ───────────────────────────────────────────
    elif intent == "EAU_IRRIGATION":
        if lang == "ar":
            status = "عندك سقي" if water == "irrigated" else ("سقي جزئي" if water == "partial" else "بوري (بدون سقي)")
            return (
                f"الأرض ديالك {status}. "
                f"{'هاد الميزة تتيح لك زراعة محاصيل تتطلب ماء أكثر مثل الطماطم والبطاطس.' if water == 'irrigated' else 'في الزراعة البورية، الشعير والقمح والعدس هم الأنسب لمنطقتك.' if rain_mm and rain_mm < 400 else 'الأمطار كافية لزراعة معظم الحبوب والقطاني.'}"
            )
        elif lang == "fr":
            status_fr = "irriguée" if water == "irrigated" else ("partiellement irriguée" if water == "partial" else "pluviale (sans irrigation)")
            water_note = "Cela vous permet de cultiver des espèces à forte demande en eau (tomate, pomme de terre)." if water == "irrigated" else ("En pluvial, l'orge, le blé et les lentilles sont les mieux adaptés à votre région." if rain_mm and rain_mm < 400 else "Les pluies sont suffisantes pour la plupart des céréales et légumineuses.")
            return (
                f"Votre parcelle est en culture {status_fr}. "
                f"{water_note}"
            )
        else:
            status_en = "irrigated" if water == "irrigated" else ("partially irrigated" if water == "partial" else "rainfed (no irrigation)")
            return (
                f"Your parcel is {status_en}. "
                f"{'This allows you to grow water-intensive crops like tomatoes and potatoes.' if water == 'irrigated' else 'For rainfed farming, barley, wheat and lentils are best suited for your region.' if rain_mm and rain_mm < 400 else 'Rainfall is sufficient for most cereals and pulses.'}"
            )

    # ── SOL ──────────────────────────────────────────────────────
    elif intent == "SOL":
        soil_names = {
            "clay": {"ar": "طينية", "fr": "argileuse", "en": "clay"},
            "clay_loam": {"ar": "طينية-لومية (تيرس)", "fr": "argilo-limoneuse (Tirs)", "en": "clay loam (Tirs)"},
            "loam": {"ar": "لومية", "fr": "limoneuse", "en": "loam"},
            "sandy_loam": {"ar": "رملية-لومية", "fr": "sablo-limoneuse", "en": "sandy loam"},
            "sandy": {"ar": "رملية", "fr": "sableuse", "en": "sandy"},
            "unknown": {"ar": "غير محددة", "fr": "non renseigné", "en": "not specified"},
        }
        soil_name = soil_names.get(soil, {}).get(lang, soil)
        ph = active_parcel.get("soil_ph")
        om = active_parcel.get("organic_matter_pct")
        if lang == "ar":
            return (
                f"التربة ديالك من نوع {soil_name}"
                f"{f'، pH: {ph}' if ph else ''}"
                f"{f'، مادة عضوية: {om}%' if om else ''}. "
                f"{'هاد التربة ممتازة للحبوب والقطاني وعندها سعة مائية جيدة.' if soil in ('clay', 'clay_loam') else 'التربة الخاصة بك تتطلب إضافة مادة عضوية لتحسين الخصوبة.' if soil in ('sandy', 'sandy_loam') else 'التربة في حالة جيدة للزراعة.'}"
            )
        elif lang == "fr":
            return (
                f"Votre sol est de texture {soil_name}"
                f"{f', pH: {ph}' if ph else ''}"
                f"{f', matière organique: {om}%' if om else ''}. "
                f"{'Sol excellent pour les céréales et légumineuses avec une bonne rétention hydrique.' if soil in ('clay', 'clay_loam') else 'Votre sol nécessite des apports organiques pour améliorer sa fertilité.' if soil in ('sandy', 'sandy_loam') else 'Sol en bon état pour la culture.'}"
            )
        else:
            return (
                f"Your soil is {soil_name}"
                f"{f', pH: {ph}' if ph else ''}"
                f"{f', organic matter: {om}%' if om else ''}. "
                f"{'Excellent soil for cereals and pulses with good water retention capacity.' if soil in ('clay', 'clay_loam') else 'Your soil requires organic matter inputs to improve fertility.' if soil in ('sandy', 'sandy_loam') else 'Soil is in good condition for cultivation.'}"
            )

    # ── FIABILITE ─────────────────────────────────────────────────
    elif intent == "FIABILITE":
        data_quality = "عالية" if indicators else "متوسطة (نماذج افتراضية)"
        if lang == "ar":
            return (
                f"موثوقية هاد التوصية {data_quality}. "
                f"{'المصدر: بيانات ناسا باور الحقيقية على مدى 5 سنوات.' if indicators else 'تعتمد على نماذج افتراضية بانتظار البيانات الحقيقية من ناسا.'} "
                f"التوصيات مبنية على قواعد المعهد الوطني للبحث الزراعي (INRA) وFAO."
            )
        elif lang == "fr":
            source_note = "Source : données NASA POWER réelles sur 5 ans." if indicators else "Basée sur des modèles d'estimation en attente des données NASA réelles."
            return (
                f"La fiabilité de cette recommandation est {data_quality}. "
                f"{source_note} "
                f"Les règles agronomiques proviennent de l'INRA Maroc et de la FAO."
            )
        else:
            return (
                f"The reliability of this recommendation is {'high' if indicators else 'moderate (estimation models)'}. "
                f"{'Source: Real NASA POWER data over 5 years.' if indicators else 'Based on estimation models pending real NASA data.'} "
                f"Agronomic rules are based on INRA Morocco and FAO scientific references."
            )

    # ── HORS_PERIMETRE / INCONNU ──────────────────────────────────
    else:
        if lang == "ar":
            return (
                "هاد السؤال خارج نطاق خدمتي الحالية. أنا مختص في: اختيار المحصول المناسب، "
                "الدورة الزراعية، المناخ والتربة، والري. سول سؤالاً حول هاد المواضيع."
            )
        elif lang == "fr":
            return (
                "Cette question dépasse mon périmètre actuel. Je suis spécialisé dans : "
                "le choix de culture, la rotation agronomique, le climat, le sol et l'irrigation. "
                "Posez une question sur ces sujets."
            )
        else:
            return (
                "This question is outside my current scope. I specialize in: "
                "crop selection, rotation planning, climate analysis, soil assessment, and irrigation. "
                "Please ask about one of these topics."
            )


def _slim_recs(engine_result, lang):
    """Slim down recommendations for the response payload."""
    recs = engine_result.get("recommendations", [])[:5]
    result = []
    for r in recs:
        result.append({
            "crop_id": r["crop_id"],
            "name": r.get(f"crop_name_{'en' if lang == 'en' else 'fr' if lang == 'fr' else 'ar'}", r["crop_name_fr"]),
            "emoji": r.get("crop_emoji", "🌱"),
            "score": r["score"],
            "rank": r["rank"],
        })
    return result


def _summarize_context(ctx, lang):
    """Short summary of the farmer's situation for display."""
    p = ctx.get("active_parcel") or {}
    rh = ctx.get("rotation_history") or []
    prev = rh[0]["crop_id"] if rh else "fallow"
    prev_name = CROPS.get(prev, {}).get(
        "name_en" if lang == "en" else "name_fr", prev
    )

    if lang == "ar":
        return {
            "region": p.get("region", "منطقة غير محددة"),
            "soil": p.get("soil_type", "غير محدد"),
            "water": p.get("water_access", "بوري"),
            "previous_crop": prev_name,
            "field_size": f"{p.get('field_size_ha', '?')} هكتار",
        }
    elif lang == "fr":
        return {
            "region": p.get("region", "Région non renseignée"),
            "soil": p.get("soil_type", "Non renseigné"),
            "water": p.get("water_access", "Pluvial"),
            "previous_crop": prev_name,
            "field_size": f"{p.get('field_size_ha', '?')} ha",
        }
    else:
        return {
            "region": p.get("region", "Unspecified region"),
            "soil": p.get("soil_type", "Not specified"),
            "water": p.get("water_access", "Rainfed"),
            "previous_crop": prev_name,
            "field_size": f"{p.get('field_size_ha', '?')} ha",
        }


def compare_crops(crop_a_id: str, crop_b_id: str, ctx: dict, lang: str = "ar") -> dict:
    """Compare two crops in the context of the farmer's real situation."""
    active_parcel = ctx.get("active_parcel") or {}
    indicators = ctx.get("indicators")
    previous_crop = ctx.get("previous_crop", "fallow")
    priorities = ctx.get("priorities", {})

    if not indicators:
        return {
            "error": "Données climatiques insuffisantes pour la comparaison.",
            "crop_a": None,
            "crop_b": None,
        }

    farmer_inputs = {
        "previous_crop": previous_crop,
        "water_access": active_parcel.get("water_access", "rainfed"),
        "soil_type": active_parcel.get("soil_type", "unknown"),
        "field_size_ha": active_parcel.get("field_size_ha"),
        "latitude": active_parcel.get("latitude", 33.0),
        "longitude": active_parcel.get("longitude", -7.6),
    }

    engine_result = rec_engine.rank(indicators, farmer_inputs, farmer_priorities=priorities or None)
    recs = {r["crop_id"]: r for r in engine_result.get("recommendations", [])}

    def _crop_info(crop_id):
        base = CROPS.get(crop_id, {})
        rec = recs.get(crop_id, {})
        name_key = "name_en" if lang == "en" else "name_fr"
        return {
            "crop_id": crop_id,
            "name": base.get(name_key, base.get("name_fr", crop_id)),
            "name_ar": base.get("name_ar", crop_id),
            "emoji": base.get("emoji", "🌱"),
            "score": rec.get("score"),
            "rank": rec.get("rank"),
            "eligible": crop_id in recs,
            "reasons": rec.get(f"reasons_{'en' if lang == 'en' else 'fr' if lang == 'fr' else ''}", rec.get("reasons", [])),
            "cautions": rec.get(f"cautions_{'en' if lang == 'en' else 'fr' if lang == 'fr' else ''}", rec.get("cautions", [])),
            "evidences": rec.get("evidences", [])[:2],
            "water_req": base.get("water_req_mm", [None, None]),
            "nitrogen_fixation": base.get("nitrogen_fixation", False),
            "category": base.get("category", ""),
        }

    crop_a = _crop_info(crop_a_id)
    crop_b = _crop_info(crop_b_id)

    # Build comparison verdict
    if crop_a.get("score") and crop_b.get("score"):
        winner_id = crop_a_id if crop_a["score"] > crop_b["score"] else crop_b_id
        winner_name = crop_a["name"] if winner_id == crop_a_id else crop_b["name"]
    else:
        winner_id = crop_a_id if crop_a["eligible"] else crop_b_id
        winner_name = crop_a["name"] if winner_id == crop_a_id else crop_b["name"]

    if lang == "ar":
        verdict = f"بناءً على معطيات أرضك، {crop_a['name_ar']} أنسب" if winner_id == crop_a_id else f"بناءً على معطيات أرضك، {crop_b['name_ar']} أنسب"
    elif lang == "fr":
        verdict = f"D'après les données de votre parcelle, {winner_name} est plus adapté(e)"
    else:
        verdict = f"Based on your parcel data, {winner_name} is more suitable"

    return {
        "crop_a": crop_a,
        "crop_b": crop_b,
        "winner_crop_id": winner_id,
        "verdict": verdict,
        "comparison_basis": _summarize_context(ctx, lang),
    }
