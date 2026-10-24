# Agronomic Rules — TerraRota

> ⚠️ **ALL RULES IN THIS DOCUMENT ARE PROVISIONAL.**
> They have not been validated by an agronomist or domain expert.
> They must not be used for real operational decisions until validated.
> Sources are cited where possible; where no source is cited, the rule is entirely provisional.

---

## Indicator Definitions

### Growing Degree Days (GDD)
- **Definition:** Σ max(0, (T_max + T_min)/2 − T_base) over the growing season
- **Base temperature used:** 10°C (standard for many cereal crops)
- **Period:** Annual (calendar year)
- **Source:** USDA crop GDD standards

### Aridity Index (AI)
- **Definition:** Annual precipitation (mm) / Potential evapotranspiration (mm)
- **Classification:**
  - AI < 0.05: Hyper-arid
  - 0.05 ≤ AI < 0.20: Arid
  - 0.20 ≤ AI < 0.50: Semi-arid
  - 0.50 ≤ AI < 0.65: Dry sub-humid
  - AI ≥ 0.65: Humid
- **Source:** UNEP aridity classification

### Frost Days
- **Definition:** Days per year where T_min < 0°C
- **Source:** Standard meteorological definition

---

## Crop Rules (Provisional)

### WHEAT_HARD (Blé Dur / القمح الصلب)

| Rule ID | Type | Condition | Action | Source |
|---|---|---|---|---|
| WHEAT_HARD_GDD_001 | Eligibility | GDD < 1500 | Ineligible | Provisional |
| WHEAT_HARD_GDD_002 | Rank | 1500 ≤ GDD ≤ 3500 | +20 pts | Provisional |
| WHEAT_HARD_RAIN_001 | Rank | 300 ≤ annual_rain ≤ 600 mm | +15 pts | Provisional |
| WHEAT_HARD_FROST_001 | Caution | frost_days > 10 | Warn: frost risk | Provisional |
| WHEAT_HARD_WATER_001 | Rank | water_access = rainfed | +10 pts | Provisional |
| WHEAT_HARD_ROT_001 | Caution | previous_crop = wheat_hard | Warn: rotation needed | Provisional |

### BARLEY (Orge / الشعير)

| Rule ID | Type | Condition | Action | Source |
|---|---|---|---|---|
| BARLEY_ARIDITY_001 | Eligibility | AI < 0.05 | Ineligible | Provisional |
| BARLEY_ARIDITY_002 | Rank | 0.10 ≤ AI ≤ 0.50 | +20 pts | Provisional |
| BARLEY_GDD_001 | Rank | GDD ≥ 1200 | +15 pts | Provisional |
| BARLEY_DROUGHT_001 | Rank | water_access = rainfed AND AI ≥ 0.10 | +10 pts (drought tolerance) | Provisional |
| BARLEY_FROST_001 | Caution | frost_days > 15 | Warn: frost risk at heading | Provisional |

### OLIVE (Olive / الزيتون)

| Rule ID | Type | Condition | Action | Source |
|---|---|---|---|---|
| OLIVE_TEMP_001 | Eligibility | mean_annual_temp < 10°C | Ineligible | Provisional |
| OLIVE_TEMP_002 | Rank | 15 ≤ mean_temp ≤ 22°C | +25 pts | Provisional |
| OLIVE_RAIN_001 | Rank | annual_rain ≥ 200 mm | +15 pts | Provisional |
| OLIVE_FROST_001 | Caution | frost_days > 20 | Warn: severe frost risk | Provisional |
| OLIVE_NOTE_001 | Info | always | Note: long-term investment (5–8 yr to production) | N/A |

### TOMATO (Tomate / الطماطم)

| Rule ID | Type | Condition | Action | Source |
|---|---|---|---|---|
| TOMATO_WATER_001 | Eligibility | water_access = rainfed AND annual_rain < 500 mm | Ineligible | Provisional |
| TOMATO_TEMP_001 | Rank | 18 ≤ mean_temp ≤ 26°C | +25 pts | Provisional |
| TOMATO_GDD_001 | Rank | GDD ≥ 1800 | +15 pts | Provisional |
| TOMATO_FROST_001 | Eligibility | frost_days > 5 | Warn: frost-sensitive | Provisional |

### CHICKPEA (Pois Chiche / الحمص)

| Rule ID | Type | Condition | Action | Source |
|---|---|---|---|---|
| CHICKPEA_GDD_001 | Rank | GDD ≥ 1000 | +15 pts | Provisional |
| CHICKPEA_RAIN_001 | Rank | 300 ≤ annual_rain ≤ 600 mm | +15 pts | Provisional |
| CHICKPEA_ROT_001 | Rank | previous_crop in [wheat_hard, wheat_soft, barley] | +10 pts (rotation benefit) | Provisional |
| CHICKPEA_FROST_001 | Caution | frost_days > 10 | Warn: frost during flowering | Provisional |

### ARGAN

| Rule ID | Type | Condition | Action | Source |
|---|---|---|---|---|
| ARGAN_REGION_001 | Eligibility | latitude < 28°N OR latitude > 33°N | Ineligible (outside endemic range) | Provisional |
| ARGAN_RAIN_001 | Rank | annual_rain ≤ 400 mm | +20 pts (drought-adapted) | Provisional |
| ARGAN_NOTE_001 | Info | always | Note: 15+ years to production | N/A |

### CACTUS_PEAR (Figuier de Barbarie / الهندية)

| Rule ID | Type | Condition | Action | Source |
|---|---|---|---|---|
| CACTUS_ARIDITY_001 | Rank | AI < 0.35 | +25 pts | Provisional |
| CACTUS_FROST_001 | Caution | frost_days > 30 | Warn: severe frost risk | Provisional |

---

## Scoring System

- **Maximum score:** 100 (before bonuses/penalties)
- **Ranking:** Crops sorted by descending score; only crops with score ≥ 30 are shown
- **Ineligible crops:** Excluded from results, reason logged
- **Abstention:** If no crop scores ≥ 30, system returns insufficient-data or abstention result

**Scores are relative decision-support values, not probabilities of success.**

---

## Rules Requiring Expert Validation

All rules above are marked provisional. Priority items for agronomist review:

1. GDD thresholds for Moroccan varieties (not global averages)
2. Aridity tolerance bounds for semi-arid Morocco
3. Frost thresholds for local cultivars
4. Rotation compatibility matrix
5. Regional suitability of argan outside Souss-Massa
