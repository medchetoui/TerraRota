# Project Scope — TerraRota MVP

## Challenge Alignment

**Challenge:** NASA Space Apps 2026 — Field Shift  
**Problem statement:** Help smallholder farmers in Morocco adapt crop selection to shifting climate patterns using NASA Earth Observation data.

## Problem Context

Moroccan smallholder farmers face increasing climate variability (shifting rainfall patterns, rising temperatures, more frequent droughts) that makes traditional crop calendars unreliable. They often lack access to processed climate information in a usable form.

TerraRota bridges NASA satellite and reanalysis data with practical agricultural decision support.

## MVP Boundaries

### In scope

- Location-based climate data retrieval (NASA POWER)
- 5-year historical climate indicator calculation
- Rule-based crop suitability scoring
- Explainable ranked recommendations (top 3–5 crops)
- Insufficient-data and low-confidence handling
- French-language UI with Arabic structure (RTL)
- Sample-data fallback for offline/demo use

### Out of scope (MVP)

- Machine learning recommendations
- Real-time market price integration
- Pest and disease risk modelling
- Irrigation scheduling
- Field-level soil mapping
- User accounts and saved fields
- Mobile native app
- Production deployment

## Pilot Geography

**Region:** Souss-Massa and Haouz plains, Morocco  
**Approximate bounding box:** 29°N–34°N, 5°W–10°W  
**Rationale:** High agricultural activity, available reference data, climate diversity (arid to semi-arid).

**Status:** Provisional. Team confirmation required before hard-coding region constraints.

## Supported Crops (Provisional)

| Crop | Category | Notes |
|---|---|---|
| Hard wheat (blé dur) | Cereal | Most common Moroccan staple |
| Soft wheat (blé tendre) | Cereal | Also common |
| Barley (orge) | Cereal | Drought-tolerant |
| Olive | Tree crop | Long-term investment |
| Argan | Tree crop | Endemic, drought-tolerant |
| Tomato | Vegetable | Water-intensive |
| Chickpea (pois chiche) | Legume | Nitrogen-fixing |
| Cactus pear (figuier de Barbarie) | Cactus | Arid resilient |

**Status:** These are initial candidates. Agronomic rules must be validated before the recommendation engine is used operationally.

## Success Criteria for Demo Day

1. A farmer can enter a location in Morocco and receive ≥1 ranked crop recommendation with explanations within 30 seconds.
2. The UI displays which data came from NASA and which is provisional.
3. The system returns an honest insufficient-data message when inputs are incomplete.
4. All scores are accompanied by the rules that generated them.
