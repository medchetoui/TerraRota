# TerraRota — Competition Pitch Presentation

> **NASA Space Apps Challenge 2026 • Challenge: Field Shift**  
> **Pitch Duration: 5 Minutes (7 Slides / Screens)**

---

## Slide 1: The Hook & The Crisis
- **Title**: *Field Shift: Breaking the Monoculture Trap in Moroccan Agriculture*
- **Visual**: Satellite image of parched agricultural fields in Chaouia juxtaposed with a struggling Moroccan wheat farmer.
- **Narrative**:
  - Morocco has experienced 6 consecutive drought years.
  - 70% of arable rainfed land is locked into continuous cereal monoculture (wheat after wheat).
  - Monoculture rapidly depletes soil nitrogen and organic carbon, leaving crops vulnerable to water stress.
  - Farmers want to adapt, but satellite data feels distant and complex.

---

## Slide 2: The Solution — TerraRota
- **Title**: *From Earth Observations to Field Decisions*
- **Core Value Proposition**:
  - TerraRota turns raw NASA satellite measurements into actionable, explainable crop-rotation alternatives.
  - Combines: NASA Earth observations + Moroccan Soil Intelligence + INRA/FAO Agronomic Rules + Farmer Priorities.
  - Not an ungrounded chatbot. A deterministic, scientifically verified decision-support engine.

---

## Slide 3: The NASA Data Pipeline
- **Title**: *Real Satellite Data Driving Real Decisions*
- **Visual**: Architecture flow from NASA POWER to indicators.
- **Key Points**:
  - Direct connection to NASA POWER Daily Agroclimatology (0.5° grid).
  - 5-year climatological window tracking `PRECTOTCORR`, `T2M`, `T2M_MAX`, `T2M_MIN`, and solar irradiance.
  - Deterministic calculations: GDD Base 10°C, UNEP Aridity Index ($P/PET$), and annual frost-risk days.
  - Zero data fabrication: transparent provenance tracking with verified fallback snapshots.

---

## Slide 4: Agronomic Truth — Biological Nitrogen Fixation
- **Title**: *The INRA / FAO Scientific Engine*
- **Visual**: Rhizobium nodules on chickpea roots vs exhausted wheat soil.
- **Key Points**:
  - Rotations backed by INRA Settat and ICARDA Mediterranean trials.
  - Food legumes (Chickpea, Faba Bean, Lentil) fix 40 to 100 kg of pure biological nitrogen per hectare.
  - 20% to 30% yield boost on the subsequent wheat season without buying synthetic chemical fertilizers.
  - Strict hard constraints: automatic exclusion of water-intensive crops in arid zones.

---

## Slide 5: The Product Live Demo
- **Title**: *Designed for Moroccan Farmers*
- **Visual**: Interactive Leaflet map, What-If Simulator, and Decision Report PDF.
- **Key Points**:
  - 1-Click GPS or interactive Morocco map selection.
  - 5 multi-year rotation scenarios (Biological Regeneration, Water Saving, High Market Value, Agrobiodiversity).
  - Interactive What-If Simulator allowing farmers to test rainfall drops (-20%) or drip irrigation before investing.
  - Voice assistance ("Ami Ahmed") speaking Moroccan Darija for maximum accessibility.

---

## Slide 6: Traceability & The Decision Report
- **Title**: *Accountability & Complete Provenance*
- **Visual**: Downloadable PDF report preview with official NASA & INRA citations.
- **Key Points**:
  - Every recommendation is traceable: *NASA Variable $\to$ Calculated Indicator $\to$ Agronomic Rule $\to$ Crop Selection*.
  - Exportable branded PDF report ready for agricultural cooperatives and micro-credit institutions.

---

## Slide 7: Vision & Real-World Impact
- **Title**: *Resilient Agriculture for Morocco and the Global South*
- **Closing Message**:
  - *"TerraRota turns NASA space observations into real-world food security and climate resilience for Moroccan farmers. Thank you!"*
- **Team**: Mohamed Chetoui (Lead), Hiba Sefraoui, and team members.
