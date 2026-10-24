# Demo Script — TerraRota

## Setup (before demo)

1. Backend running: `http://localhost:8000`
2. Frontend running: `http://localhost:5173`
3. Internet access available (for live NASA data)
4. Browser open to `http://localhost:5173`

---

## Scenario: Farmer Ahmed in the Marrakech Region

**Narrative:** Ahmed farms 2 hectares of clay-loam soil near Marrakech. He grew wheat last year and wants to know what to plant this season. He has rainfed-only water access.

---

## Step 1 — Landing Page (30 seconds)

- Show the TerraRota landing page.
- Explain: "TerraRota uses real NASA satellite data to help farmers choose the right crop for their land."
- Click "Get Started" / "Commencer".

**Key talking point:** The tool is transparent — it shows exactly which data it uses and where it comes from.

---

## Step 2 — Location Entry (1 minute)

- Enter coordinates:
  - **Latitude:** 31.52
  - **Longitude:** -8.75
- Explain: "These are Ahmed's farm coordinates near Marrakech."
- Point out: "The tool supports manual coordinate entry so it works even without GPS."

---

## Step 3 — Farm Details (1 minute)

- Previous crop: **Wheat (hard)**
- Water access: **Rainfed**
- Soil type: **Clay-loam**
- Field size: **2 ha**

---

## Step 4 — Submit and Loading (30 seconds)

- Click "Get Recommendations" / "Obtenir des recommandations".
- Show the loading state.
- Explain: "The system is now calling NASA's POWER API to fetch 5 years of climate data for this location."

---

## Step 5 — Environmental Indicators (1 minute)

- Show the indicators panel:
  - Annual rainfall
  - Aridity index
  - Growing degree days
  - Frost days
- Explain: "These are calculated from real NASA data. The system shows the source, the time period, and the spatial resolution."
- **Point out:** "NASA POWER covers ~50km grid cells — this is climate data, not field-level precision."

---

## Step 6 — Recommendations (2 minutes)

- Show the ranked recommendations.
- Walk through the top result (expected: Barley or Wheat).
  - Read out the score and the reasons.
  - Show the caution (rotation warning for wheat if wheat was previous crop).
  - Show the rules applied (e.g., `BARLEY_ARIDITY_001`).
- Explain: "Every recommendation is fully transparent. The farmer can see exactly why each crop was ranked."

**Key talking point:** The score is a relative support index, not a guarantee of yield.

---

## Step 7 — Provisional Warning (30 seconds)

- Point to the provisional badge.
- Explain: "The agronomic rules have not yet been validated by a domain expert. The system is honest about this."

---

## Step 8 — Revise Inputs (30 seconds)

- Click "Revise inputs" / "Modifier les données".
- Change water access to **Irrigated**.
- Resubmit.
- Show how Tomato now appears in the results.

---

## Step 9 — Fallback Demo (if NASA unavailable)

- If internet is unavailable, the system shows:
  - A clear warning: "Results based on illustrative sample data."
  - The same recommendation structure, but clearly labeled.
- Explain: "The system never silently substitutes fake data. If real data is unavailable, it says so."

---

## Talking Points Summary

1. **Real NASA data** — not invented, not estimated
2. **Transparent rules** — every decision is explained
3. **Honest limitations** — provisional warnings, sample-data flags
4. **Farmer-first UI** — French and Arabic support, simple language
5. **Extensible** — rules can be improved by agronomists without code changes

---

## Duration: ~7–8 minutes

Questions to anticipate:
- "What if the farmer doesn't know their coordinates?" → Manual entry + future map feature
- "How accurate is the data?" → Explain 50km resolution limitation
- "Are the recommendations proven?" → Explain provisional rules, need for expert validation
