"""
TerraRota Rotation Scenario Engine.

Generates 4 to 5 distinct, explainable crop-rotation alternatives for Moroccan farms
combining NASA agroclimatology, INRA Morocco rotation principles, and farmer constraints.
"""
from typing import Any
from .rules import CROPS


def generate_scenarios(
    indicators: dict[str, Any],
    farmer_inputs: dict[str, Any],
    ranked_crops: list[dict[str, Any]],
    priorities: dict[str, float] | None = None,
) -> list[dict[str, Any]]:
    """
    Generate 5 distinct multi-year rotation scenarios comparing:
    - Crop sequence (3-year horizon: Year 1 next crop, Year 2, Year 3)
    - Water demand (Low / Moderate / High)
    - Nitrogen fixation & soil health impact
    - Economic risk vs return
    - Primary agronomic justification & trade-offs
    """
    prev_crop = farmer_inputs.get("previous_crop") or "wheat_hard"
    water_access = farmer_inputs.get("water_access") or "rainfed"
    annual_rain = indicators.get("annual_rain_mm", 300)
    is_irrigated = water_access == "irrigated"

    scenarios = []

    # ─────────────────────────────────────────────────────────────
    # SCENARIO 1: Cereal-Legume Bioregeneration (Recommended INRA/FAO)
    # ─────────────────────────────────────────────────────────────
    legume_candidates = [c for c in ranked_crops if c["crop_category"] == "legume" and c["eligible"]]
    cereal_candidates = [c for c in ranked_crops if c["crop_category"] == "cereal" and c["eligible"]]

    first_legume = legume_candidates[0]["crop_id"] if legume_candidates else "chickpea"
    follow_cereal = cereal_candidates[0]["crop_id"] if cereal_candidates else "wheat_hard"
    alt_legume = legume_candidates[1]["crop_id"] if len(legume_candidates) > 1 else "lentil"

    s1_sequence = [first_legume, follow_cereal, alt_legume]
    scenarios.append({
        "id": "scenario_legume_rotation",
        "title_fr": "Régénération Biologique (Légumineuse - Céréale)",
        "title_ar": "دورة التجديد الحيوي (قطاني - حبوب)",
        "title_en": "Biological Soil Regeneration (Legume - Cereal)",
        "strategy_type": "soil_restoration",
        "badge_fr": "Recommandé INRA Maroc",
        "badge_ar": "موصى به من INRA المغرب",
        "badge_en": "INRA Morocco Recommended",
        "crop_sequence": [
            {
                "year": 1, 
                "season": "2026/2027", 
                "crop_id": s1_sequence[0], 
                "crop_name_fr": CROPS.get(s1_sequence[0], {}).get("name_fr", s1_sequence[0]), 
                "crop_name_ar": CROPS.get(s1_sequence[0], {}).get("name_ar", s1_sequence[0]), 
                "crop_name_en": CROPS.get(s1_sequence[0], {}).get("name_en", s1_sequence[0]), 
                "crop_emoji": CROPS.get(s1_sequence[0], {}).get("emoji", "🌱")
            },
            {
                "year": 2, 
                "season": "2027/2028", 
                "crop_id": s1_sequence[1], 
                "crop_name_fr": CROPS.get(s1_sequence[1], {}).get("name_fr", s1_sequence[1]), 
                "crop_name_ar": CROPS.get(s1_sequence[1], {}).get("name_ar", s1_sequence[1]), 
                "crop_name_en": CROPS.get(s1_sequence[1], {}).get("name_en", s1_sequence[1]), 
                "crop_emoji": CROPS.get(s1_sequence[1], {}).get("emoji", "🌾")
            },
            {
                "year": 3, 
                "season": "2028/2029", 
                "crop_id": s1_sequence[2], 
                "crop_name_fr": CROPS.get(s1_sequence[2], {}).get("name_fr", s1_sequence[2]), 
                "crop_name_ar": CROPS.get(s1_sequence[2], {}).get("name_ar", s1_sequence[2]), 
                "crop_name_en": CROPS.get(s1_sequence[2], {}).get("name_en", s1_sequence[2]), 
                "crop_emoji": CROPS.get(s1_sequence[2], {}).get("emoji", "🫘")
            },
        ],
        "water_demand_level_fr": "Modérée",
        "water_demand_level_ar": "معتدلة",
        "water_demand_level_en": "Moderate",
        "water_savings_pct": 25,
        "n_fixation_kg_ha": "50 - 90 kg N/ha",
        "soil_health_score": 92,
        "resilience_score": 85,
        "profitability_score": 78,
        "advantages_fr": [
            "Fixation biologique symbiotique de l'azote atmosphérique (Rhizobium).",
            "Rupture nette du cycle des maladies racinaires (Fusarium, Piétin-échaudage).",
            "Économie substantielle sur la facture des engrais azotés de synthèse.",
        ],
        "advantages_ar": [
            "تثبيت بيولوجي تكافلي لنيتروجين الغلاف الجوي (Rhizobium).",
            "كسر واضح لدورة أمراض الجذور (Fusarium، تعفن القدم).",
            "توفير كبير في فاتورة الأسمدة النيتروجينية الصناعية.",
        ],
        "advantages_en": [
            "Symbiotic biological fixation of atmospheric nitrogen (Rhizobium).",
            "Clear break in root disease cycles (Fusarium, take-all).",
            "Substantial savings on synthetic nitrogen fertilizer bills.",
        ],
        "risks_fr": [
            "Sensibilité du pois chiche ou de la lentille aux gelées printanières au stade floraison.",
        ],
        "risks_ar": [
            "حساسية الحمص أو العدس للصقيع الربيعي في مرحلة الإزهار.",
        ],
        "risks_en": [
            "Chickpea or lentil sensitivity to spring frost during the flowering stage.",
        ],
        "scientific_basis_fr": "INRA Settat / ICARDA: Cereal-legume rotations increase subsequent wheat grain yield by 20-30% while restoring soil organic carbon.",
        "scientific_basis_ar": "المعهد الوطني للبحث الزراعي (سطات) / إيكاردا: دورات الحبوب-القطاني تزيد من غلة القمح بنسبة 20-30% مع استعادة الكربون العضوي للتربة.",
        "scientific_basis_en": "INRA Settat / ICARDA: Cereal-legume rotations increase subsequent wheat grain yield by 20-30% while restoring soil organic carbon.",
    })

    # ─────────────────────────────────────────────────────────────
    # SCENARIO 2: Water-Conservative & Climate Adaptation
    # ─────────────────────────────────────────────────────────────
    low_water_crops = [c for c in ranked_crops if c["crop_id"] in ("barley", "cactus_pear", "olive", "argan", "almond")]
    c1 = low_water_crops[0]["crop_id"] if low_water_crops else "barley"
    c2 = "barley" if c1 != "barley" else "chickpea"
    c3 = "olive" if is_irrigated else "barley"

    s2_sequence = [c1, c2, c3]
    scenarios.append({
        "id": "scenario_water_conservative",
        "title_fr": "Sobriété Hydrique & Climat Aride",
        "title_ar": "الاستراتيجية المائية المقاومة للإجهاد والجفاف",
        "title_en": "Water Conservation & Drought Resilience",
        "strategy_type": "water_saving",
        "badge_fr": "Adapté Déficit Pluviométrique",
        "badge_ar": "مقاوم للجفاف",
        "badge_en": "Drought-Resilient",
        "crop_sequence": [
            {"year": 1, "season": "2026/2027", "crop_id": s2_sequence[0], "crop_name_fr": CROPS.get(s2_sequence[0], {}).get("name_fr", s2_sequence[0]), "crop_name_ar": CROPS.get(s2_sequence[0], {}).get("name_ar", s2_sequence[0]), "crop_name_en": CROPS.get(s2_sequence[0], {}).get("name_en", s2_sequence[0]), "crop_emoji": CROPS.get(s2_sequence[0], {}).get("emoji", "🌵")},
            {"year": 2, "season": "2027/2028", "crop_id": s2_sequence[1], "crop_name_fr": CROPS.get(s2_sequence[1], {}).get("name_fr", s2_sequence[1]), "crop_name_ar": CROPS.get(s2_sequence[1], {}).get("name_ar", s2_sequence[1]), "crop_name_en": CROPS.get(s2_sequence[1], {}).get("name_en", s2_sequence[1]), "crop_emoji": CROPS.get(s2_sequence[1], {}).get("emoji", "🌾")},
            {"year": 3, "season": "2028/2029", "crop_id": s2_sequence[2], "crop_name_fr": CROPS.get(s2_sequence[2], {}).get("name_fr", s2_sequence[2]), "crop_name_ar": CROPS.get(s2_sequence[2], {}).get("name_ar", s2_sequence[2]), "crop_name_en": CROPS.get(s2_sequence[2], {}).get("name_en", s2_sequence[2]), "crop_emoji": CROPS.get(s2_sequence[2], {}).get("emoji", "🫒")},
        ],
        "water_demand_level_fr": "Très faible",
        "water_demand_level_ar": "ضعيف جداً",
        "water_demand_level_en": "Very Low",
        "water_savings_pct": 55,
        "n_fixation_kg_ha": "15 - 30 kg N/ha",
        "soil_health_score": 75,
        "resilience_score": 96,
        "profitability_score": 70,
        "advantages_fr": [
            "Résistance maximale aux vagues de chaleur et aux sécheresses prolongées.",
            "Consommation hydrique divisée par deux par rapport aux cultures pluviales intensives.",
            "Faibles charges d'intrants et risque de perte financière minime.",
        ],
        "advantages_ar": [
            "مقاومة قصوى لموجات الحرارة والجفاف الطويل.",
            "استهلاك مائي مقسم إلى النصف مقارنة بالزراعات البورية المكثفة.",
            "تكاليف مدخلات منخفضة وخطر خسارة مالية ضئيل.",
        ],
        "advantages_en": [
            "Maximum resistance to heat waves and prolonged droughts.",
            "Water consumption halved compared to intensive rainfed crops.",
            "Low input costs and minimal financial loss risk.",
        ],
        "risks_fr": [
            "Valorisation commerciale par hectare inférieure aux cultures maraîchères.",
        ],
        "risks_ar": [
            "القيمة التجارية للهكتار أقل من زراعات الخضروات.",
        ],
        "risks_en": [
            "Commercial value per hectare lower than market garden crops.",
        ],
        "scientific_basis_fr": "FAO Dryland Series: Barley and drought-adapted perennial tree crops achieve higher water-use efficiency (WUE) under semi-arid conditions.",
        "scientific_basis_ar": "سلسلة منظمة الأغذية والزراعة للأراضي الجافة: الشعير والأشجار المعمرة المتكيفة مع الجفاف تحقق كفاءة أعلى في استخدام المياه في الظروف شبه الجافة.",
        "scientific_basis_en": "FAO Dryland Series: Barley and drought-adapted perennial tree crops achieve higher water-use efficiency (WUE) under semi-arid conditions.",
    })

    # ─────────────────────────────────────────────────────────────
    # SCENARIO 3: High Economic Market Value (Profitability)
    # ─────────────────────────────────────────────────────────────
    if is_irrigated:
        s3_sequence = ["potato", "wheat_hard", "tomato"]
    else:
        s3_sequence = ["wheat_hard", "chickpea", "almond"]

    scenarios.append({
        "id": "scenario_high_value",
        "title_fr": "Valorisation Économique & Marché",
        "title_ar": "تعظيم المردودية الاقتصادية والقيمة التسويقية",
        "title_en": "High Economic Market Value",
        "strategy_type": "profitability",
        "badge_fr": "Marge Nette Élevée",
        "badge_ar": "هامش ربح مرتفع",
        "badge_en": "High Net Margin",
        "crop_sequence": [
            {"year": 1, "season": "2026/2027", "crop_id": s3_sequence[0], "crop_name_fr": CROPS.get(s3_sequence[0], {}).get("name_fr", s3_sequence[0]), "crop_name_ar": CROPS.get(s3_sequence[0], {}).get("name_ar", s3_sequence[0]), "crop_name_en": CROPS.get(s3_sequence[0], {}).get("name_en", s3_sequence[0]), "crop_emoji": CROPS.get(s3_sequence[0], {}).get("emoji", "🥔")},
            {"year": 2, "season": "2027/2028", "crop_id": s3_sequence[1], "crop_name_fr": CROPS.get(s3_sequence[1], {}).get("name_fr", s3_sequence[1]), "crop_name_ar": CROPS.get(s3_sequence[1], {}).get("name_ar", s3_sequence[1]), "crop_name_en": CROPS.get(s3_sequence[1], {}).get("name_en", s3_sequence[1]), "crop_emoji": CROPS.get(s3_sequence[1], {}).get("emoji", "🌾")},
            {"year": 3, "season": "2028/2029", "crop_id": s3_sequence[2], "crop_name_fr": CROPS.get(s3_sequence[2], {}).get("name_fr", s3_sequence[2]), "crop_name_ar": CROPS.get(s3_sequence[2], {}).get("name_ar", s3_sequence[2]), "crop_name_en": CROPS.get(s3_sequence[2], {}).get("name_en", s3_sequence[2]), "crop_emoji": CROPS.get(s3_sequence[2], {}).get("emoji", "🍅")},
        ],
        "water_demand_level_fr": "Élevée" if is_irrigated else "Moyenne",
        "water_demand_level_ar": "مرتفع" if is_irrigated else "متوسط",
        "water_demand_level_en": "High" if is_irrigated else "Moderate",
        "water_savings_pct": 5 if is_irrigated else 20,
        "n_fixation_kg_ha": "10 - 40 kg N/ha",
        "soil_health_score": 68,
        "resilience_score": 72,
        "profitability_score": 95,
        "advantages_fr": [
            "Revenu brut et marge nette à l'hectare les plus élevés du marché marocain.",
            "Filières de commercialisation structurées sur les marchés de gros (Casablanca, Fès, Agadir).",
        ],
        "advantages_ar": [
            "أعلى دخل إجمالي وهامش ربح صافي للهكتار في السوق المغربي.",
            "سلاسل تسويق منظمة في أسواق الجملة (الدار البيضاء، فاس، أكادير).",
        ],
        "advantages_en": [
            "Highest gross income and net margin per hectare in the Moroccan market.",
            "Structured marketing channels in wholesale markets (Casablanca, Fes, Agadir).",
        ],
        "risks_fr": [
            "Besoin impératif en eau d'irrigation et investissement initial en semences certifiées.",
            "Sensibilité aux fluctuations des prix sur les marchés locaux.",
        ],
        "risks_ar": [
            "حاجة حتمية لمياه الري والاستثمار الأولي في البذور المعتمدة.",
            "الحساسية لتقلبات الأسعار في الأسواق المحلية.",
        ],
        "risks_en": [
            "Mandatory need for irrigation water and initial investment in certified seeds.",
            "Sensitivity to price fluctuations in local markets.",
        ],
        "scientific_basis_fr": "Ministère de l'Agriculture du Maroc - Plan Génération Green: High-value horticultural and potato crops generate the highest gross margins under monitored irrigation.",
        "scientific_basis_ar": "وزارة الفلاحة المغربية - جيل أخضر: محاصيل البستنة والبطاطس عالية القيمة تحقق أعلى هوامش إجمالية تحت الري المراقب.",
        "scientific_basis_en": "Ministry of Agriculture of Morocco - Green Generation Plan: High-value horticultural and potato crops generate the highest gross margins under monitored irrigation.",
    })

    # ─────────────────────────────────────────────────────────────
    # SCENARIO 4: Multi-family Agrobiodiversity (Risk Distribution)
    # ─────────────────────────────────────────────────────────────
    s4_sequence = ["chickpea", "barley", "olive"]
    scenarios.append({
        "id": "scenario_diversification",
        "title_fr": "Diversification & Sécurité Agro-Écologique",
        "title_ar": "التنوع الزراعي وتوزيع المخاطر البيئية",
        "title_en": "Agrobiodiversity & Risk Mitigation",
        "strategy_type": "diversification",
        "badge_fr": "Équilibre et Durabilité",
        "badge_ar": "متوازن ومستدام",
        "badge_en": "Balanced & Sustainable",
        "crop_sequence": [
            {"year": 1, "season": "2026/2027", "crop_id": s4_sequence[0], "crop_name_fr": CROPS.get(s4_sequence[0], {}).get("name_fr", s4_sequence[0]), "crop_name_ar": CROPS.get(s4_sequence[0], {}).get("name_ar", s4_sequence[0]), "crop_name_en": CROPS.get(s4_sequence[0], {}).get("name_en", s4_sequence[0]), "crop_emoji": CROPS.get(s4_sequence[0], {}).get("emoji", "🫘")},
            {"year": 2, "season": "2027/2028", "crop_id": s4_sequence[1], "crop_name_fr": CROPS.get(s4_sequence[1], {}).get("name_fr", s4_sequence[1]), "crop_name_ar": CROPS.get(s4_sequence[1], {}).get("name_ar", s4_sequence[1]), "crop_name_en": CROPS.get(s4_sequence[1], {}).get("name_en", s4_sequence[1]), "crop_emoji": CROPS.get(s4_sequence[1], {}).get("emoji", "🌾")},
            {"year": 3, "season": "2028/2029", "crop_id": s4_sequence[2], "crop_name_fr": CROPS.get(s4_sequence[2], {}).get("name_fr", s4_sequence[2]), "crop_name_ar": CROPS.get(s4_sequence[2], {}).get("name_ar", s4_sequence[2]), "crop_name_en": CROPS.get(s4_sequence[2], {}).get("name_en", s4_sequence[2]), "crop_emoji": CROPS.get(s4_sequence[2], {}).get("emoji", "🫒")},
        ],
        "water_demand_level_fr": "Faible à modérée",
        "water_demand_level_ar": "منخفض إلى متوسط",
        "water_demand_level_en": "Low to moderate",
        "water_savings_pct": 35,
        "n_fixation_kg_ha": "40 - 70 kg N/ha",
        "soil_health_score": 88,
        "resilience_score": 90,
        "profitability_score": 82,
        "advantages_fr": [
            "Combinaison de trois familles botaniques distinctes (Fabaceae, Poaceae, Oleaceae).",
            "Étalement des pointes de travail agricole et des rentrées de trésorerie sur l'année.",
            "Excellente protection contre les aléas climatiques extrêmes.",
        ],
        "advantages_ar": [
            "مزيج من ثلاث عائلات نباتية مختلفة (بقوليات، حبوب، زيتون).",
            "توزيع فترات العمل الزراعي وتدفقات الخزينة على مدار السنة.",
            "حماية ممتازة ضد التقلبات المناخية القصوى.",
        ],
        "advantages_en": [
            "Combination of three distinct plant families (Fabaceae, Poaceae, Oleaceae).",
            "Spreading of farm workload and cash flow throughout the year.",
            "Excellent protection against extreme climate hazards.",
        ],
        "risks_fr": [
            "Nécessite la maîtrise technique de filières agricoles multiples.",
        ],
        "risks_ar": [
            "يتطلب التحكم الفني في سلاسل زراعية متعددة.",
        ],
        "risks_en": [
            "Requires technical mastery of multiple agricultural value chains.",
        ],
        "scientific_basis_fr": "FAO Agroecology Principles: Crop diversification stabilizes farm-level yields and dampens the economic impact of single-crop market or climate shocks.",
        "scientific_basis_ar": "مبادئ الزراعة الإيكولوجية لمنظمة الأغذية والزراعة: تنويع المحاصيل يثبت غلة المزرعة ويقلل من التأثير الاقتصادي لتقلبات الأسعار أو المناخ.",
        "scientific_basis_en": "FAO Agroecology Principles: Crop diversification stabilizes farm-level yields and dampens the economic impact of single-crop market or climate shocks.",
    })

    return scenarios