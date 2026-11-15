"""
NASA Earth Observation Data Source Registry for TerraRota.

Documents every environmental dataset used or investigated by TerraRota,
its spatial/temporal resolution, provider, parameters, and operational status.
"""
from typing import Any

NASA_DATA_SOURCES = [
    {
        "id": "nasa_power_ag",
        "name": "NASA POWER Daily Agroclimatology",
        "provider": "NASA Langley Research Center (LaRC)",
        "product_id": "POWER_AG_DAILY_POINT_V2",
        "official_url": "https://power.larc.nasa.gov/",
        "api_docs_url": "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
        "status": "fully_integrated",
        "spatial_resolution": "0.5° × 0.5° (~50 km)",
        "temporal_resolution_fr": "Observations journalières (climatologie 5 ans)",
        "temporal_resolution_ar": "ملاحظات يومية (مناخ 5 سنوات)",
        "temporal_resolution_en": "Daily observations (5-year multi-annual climatology)",
        "variables": [
            {"code": "PRECTOTCORR", "name_fr": "Précipitations corrigées", "name_ar": "هطول الأمطار المصحح", "name_en": "Corrected Precipitation", "unit": "mm/day"},
            {"code": "T2M", "name_fr": "Température à 2 mètres", "name_ar": "درجة الحرارة على ارتفاع مترين", "name_en": "Temperature at 2 Meters", "unit": "°C"},
            {"code": "T2M_MAX", "name_fr": "Température max journalière", "name_ar": "أقصى درجة حرارة يومية", "name_en": "Maximum Daily Temperature", "unit": "°C"},
            {"code": "T2M_MIN", "name_fr": "Température min journalière", "name_ar": "أدنى درجة حرارة يومية", "name_en": "Minimum Daily Temperature", "unit": "°C"},
            {"code": "RH2M", "name_fr": "Humidité relative à 2 m", "name_ar": "الرطوبة النسبية على ارتفاع مترين", "name_en": "Relative Humidity at 2 Meters", "unit": "%"},
            {"code": "WS2M", "name_fr": "Vitesse du vent à 2 m", "name_ar": "سرعة الرياح على ارتفاع مترين", "name_en": "Wind Speed at 2 Meters", "unit": "m/s"},
            {"code": "ALLSKY_SFC_SW_DWN", "name_fr": "Rayonnement solaire incident", "name_ar": "الإشعاع الشمسي الساقط", "name_en": "All Sky Surface Shortwave Downward Irradiance", "unit": "MJ/m²/day"},
        ],
        "processing_methods_fr": [
            "Accumulation GDD (Growing Degree Days Base 10°C)",
            "Indice d'aridité UNEP (formule P / PET Thornthwaite)",
            "Comptage des jours de gel (T_min < 0°C)",
            "Climatologie des mois secs (seuil <30mm)",
            "Filtrage des valeurs manquantes (-999.0 contrôle qualité)",
        ],
        "processing_methods_ar": [
            "تراكم درجات النمو (GDD الأساس 10°C)",
            "مؤشر الجفاف UNEP (صيغة Thornthwaite)",
            "حساب أيام الصقيع (T_min < 0°C)",
            "مناخ الأشهر الجافة (عتبة <30 مم)",
            "تصفية القيم الفارغة (-999.0 مراقبة الجودة)",
        ],
        "processing_methods_en": [
            "GDD (Growing Degree Days Base 10°C) accumulation",
            "UNEP Aridity Index (P / PET Thornthwaite formulation)",
            "Frost Risk Days Count (T_min < 0°C)",
            "Dry Months Climatology (<30mm threshold)",
            "Fill-value filtering (-999.0 quality control)",
        ],
        "limitations_fr": "La résolution spatiale de 0.5° représente un macro-climat régional ; les variations micro-climatiques (ex: fonds de vallées) peuvent ne pas être capturées.",
        "limitations_ar": "تمثل الدقة المكانية 0.5 درجة مناخاً إقليمياً شاملاً ؛ قد لا يتم التقاط التغيرات المناخية الدقيقة (مثل قيعان الوديان).",
        "limitations_en": "0.5° spatial grid resolution represents regional macro-climate; micro-climatic or deep valley temperature variations may not be captured.",
    },
    {
        "id": "modis_vegetation",
        "name": "MODIS Terra/Aqua Vegetation Indices",
        "provider": "NASA Goddard Space Flight Center (GSFC) / LP DAAC",
        "product_id": "MOD13Q1 / MYD13Q1 Version 6.1",
        "official_url": "https://modis.gsfc.nasa.gov/data/dataprod/mod13.php",
        "api_docs_url": "https://lpdaac.usgs.gov/products/mod13q1v061/",
        "status": "investigating",
        "spatial_resolution": "250 meters",
        "temporal_resolution_fr": "Composite sur 16 jours",
        "temporal_resolution_ar": "مركب كل 16 يوماً",
        "temporal_resolution_en": "16-day composite",
        "variables": [
            {"code": "NDVI", "name_fr": "Indice de végétation par différence normalisée", "name_ar": "مؤشر الغطاء النباتي الطبيعي", "name_en": "Normalized Difference Vegetation Index", "unit": "Index (-1 to +1)"},
            {"code": "EVI", "name_fr": "Indice de végétation amélioré", "name_ar": "مؤشر الغطاء النباتي المحسن", "name_en": "Enhanced Vegetation Index", "unit": "Index (-1 to +1)"},
            {"code": "VI_Quality", "name_fr": "Drapeaux de fiabilité des pixels", "name_ar": "أعلام موثوقية البكسل", "name_en": "Vegetation Index Pixel Reliability Flags", "unit": "Bitmask"},
        ],
        "processing_methods_fr": [
            "Correction atmosphérique & filtrage des nuages",
            "Courbes temporelles de vigueur phénologique",
        ],
        "processing_methods_ar": [
            "التصحيح الجوي وتصفية السحب",
            "منحنيات النمو الظاهرية للمحاصيل",
        ],
        "processing_methods_en": [
            "Atmospheric correction & cloud mask filtering",
            "Phenological crop vigor temporal curves",
        ],
        "limitations_fr": "Mesure la verdure végétative et la biomasse ; ne peut pas mesurer directement la fertilité, l'humidité du sol ou les maladies.",
        "limitations_ar": "يقيس الاخضرار والكتلة الحيوية ؛ لا يمكنه قياس خصوبة التربة أو رطوبتها أو أمراض المحاصيل مباشرة.",
        "limitations_en": "Measures vegetative greenness and biomass; cannot directly measure soil fertility, soil moisture, or crop disease.",
    },
    {
        "id": "nasa_smap",
        "name": "NASA Soil Moisture Active Passive (SMAP)",
        "provider": "NASA Jet Propulsion Laboratory (JPL)",
        "product_id": "SPL3SMP_E / SPL4SMAU",
        "official_url": "https://smap.jpl.nasa.gov/",
        "api_docs_url": "https://nsidc.org/data/smap",
        "status": "investigating",
        "spatial_resolution": "9 km (enhanced L3) / 36 km (L4 root zone)",
        "temporal_resolution_fr": "2 à 3 jours",
        "temporal_resolution_ar": "2 إلى 3 أيام",
        "temporal_resolution_en": "2-3 days",
        "variables": [
            {"code": "soil_moisture_surface", "name_fr": "Humidité du sol de surface (5 cm)", "name_ar": "رطوبة التربة السطحية (5 سم)", "name_en": "Top 5cm Surface Soil Moisture", "unit": "m³/m³"},
            {"code": "soil_moisture_rootzone", "name_fr": "Humidité de la zone racinaire modélisée", "name_ar": "رطوبة منطقة الجذور (0-100 سم)", "name_en": "Root Zone Soil Moisture (0-100cm Modelled)", "unit": "m³/m³"},
        ],
        "processing_methods_fr": [
            "Récupération de la rétrodiffusion du radiomètre en bande L couplée à des modèles de surface",
        ],
        "processing_methods_ar": [
            "استرجاع التشتت العكسي لمقياس الإشعاع L-band مع نماذج سطح الأرض",
        ],
        "processing_methods_en": [
            "L-band radiometer backscatter retrieval coupled with land surface catchment models",
        ],
        "limitations_fr": "La récupération radiométrique directe pénètre uniquement les 5 premiers cm du sol ; les valeurs de la zone racinaire sont assimilées via des modèles numériques.",
        "limitations_ar": "الاسترجاع الإشعاعي المباشر يخترق فقط أول 5 سم من التربة ؛ يتم استيعاب قيم منطقة الجذور عبر نماذج رقمية.",
        "limitations_en": "Direct radiometric retrieval penetrates only the top 5 cm of soil; root-zone values are assimilated via numerical land models.",
    },
    {
        "id": "nasa_gpm",
        "name": "NASA Global Precipitation Measurement (GPM)",
        "provider": "NASA GSFC / JAXA",
        "product_id": "GPM_3IMERGDL (IMERG Final Run)",
        "official_url": "https://gpm.nasa.gov/",
        "api_docs_url": "https://gpm.nasa.gov/data/imerg",
        "status": "investigating",
        "spatial_resolution": "0.1° × 0.1° (~10 km)",
        "temporal_resolution_fr": "Estimation multi-satellite quotidienne / mensuelle",
        "temporal_resolution_ar": "تقدير متعدد الأقمار يومي / شهري",
        "temporal_resolution_en": "Daily / Monthly multi-satellite precipitation estimate",
        "variables": [
            {"code": "precipitationCal", "name_fr": "Taux de précipitation calibré", "name_ar": "معدل هطول الأمطار المعاير", "name_en": "Calibrated Precipitation Rate", "unit": "mm/hour / mm/day"},
        ],
        "processing_methods_fr": [
            "Fusion de constellations multi-satellites micro-ondes et infrarouge avec calibration par pluviomètres au sol",
        ],
        "processing_methods_ar": [
            "دمج الأقمار الصناعية لل microwaves والأشعة تحت الحمراء مع المعايرة بواسطة مقاييس المطر الأرضية",
        ],
        "processing_methods_en": [
            "Microwave and infrared multi-satellite constellation fusion with ground rain-gauge calibration",
        ],
        "limitations_fr": "Fournit une estimation des précipitations à travers le relief complexe de l'Atlas marocain où les radars au sol sont limités.",
        "limitations_ar": "يوفر تقديراً لهطول الأمطار عبر التضاريس المعقدة للأطلس المغربي حيث تكون رادارات الأرض محدودة.",
        "limitations_en": "Provides precipitation estimate across complex Moroccan Atlas relief where ground radar is limited.",
    },
    {
        "id": "soilgrids_isric",
        "name": "SoilGrids Global Gridded Soil Information",
        "provider": "ISRIC – World Soil Information / FAO Partner",
        "product_id": "SoilGrids250m v2.0",
        "official_url": "https://soilgrids.org/",
        "api_docs_url": "https://www.isric.org/explore/soilgrids",
        "status": "partially_integrated",
        "spatial_resolution": "250 meters",
        "temporal_resolution_fr": "Cartographie numérique statique des sols",
        "temporal_resolution_ar": "رسم خرائط رقمية ثابتة للتربة",
        "temporal_resolution_en": "Static digital soil mapping",
        "variables": [
            {"code": "clay", "name_fr": "Teneur en argile", "name_ar": "محتوى الطين", "name_en": "Clay Content", "unit": "g/kg (%)"},
            {"code": "sand", "name_fr": "Teneur en sable", "name_ar": "محتوى الرمل", "name_en": "Sand Content", "unit": "g/kg (%)"},
            {"code": "silt", "name_fr": "Teneur en limon", "name_ar": "محتوى الغرين", "name_en": "Silt Content", "unit": "g/kg (%)"},
            {"code": "phh2o", "name_fr": "pH du sol dans l'eau", "name_ar": "حموضة التربة في الماء", "name_en": "Soil pH in H2O", "unit": "pH scale"},
            {"code": "soc", "name_fr": "Carbone organique du sol", "name_ar": "الكربون العضوي للتربة", "name_en": "Soil Organic Carbon", "unit": "dg/kg"},
            {"code": "wv0033", "name_fr": "Capacité de rétention d'eau disponible", "name_ar": "سعة الاحتفاظ بالمياه المتاحة", "name_en": "Available Water Capacity", "unit": "cm³/cm³"},
        ],
        "processing_methods_fr": [
            "Modèles d'apprentissage automatique (Random Forest) entraînés sur des profils de sol mondiaux et des covariables environnementales",
        ],
        "processing_methods_ar": [
            "نماذج تعلم الآلة (Random Forest) المدربة على ملفات تعريف التربة العالمية والمتغيرات البيئية",
        ],
        "processing_methods_en": [
            "Machine learning random forest models trained on global soil profiles and environmental covariates",
        ],
        "limitations_fr": "La prédiction numérique des sols comporte une incertitude spatiale ; des tests en laboratoire sont recommandés pour une précision à l'échelle du champ.",
        "limitations_ar": "تحتوي التنبؤات الرقمية للتربة على عدم يقين مكاني ؛ يوصى بإجراء اختبارات معملية للحصول على دقة على مستوى الحقل.",
        "limitations_en": "Modelled digital soil prediction carries spatial uncertainty; laboratory soil tests are recommended for field-level precision.",
    },
]


def get_data_sources_registry() -> list[dict[str, Any]]:
    return NASA_DATA_SOURCES