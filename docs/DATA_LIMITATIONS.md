# Data Limitations — TerraRota

## Summary

TerraRota uses publicly available NASA POWER reanalysis data to support crop-selection decisions. Users and developers must understand the following limitations before using or extending the system.

---

## Spatial Resolution

| Source | Resolution | Implication |
|---|---|---|
| NASA POWER | ~0.5° (~50 km) | A single value represents ~2500 km². Local topography (hills, valleys, irrigation canals) is not captured. |
| Soil type | User-reported | Not validated against satellite or lab data |

**Consequence:** Two farmers 5 km apart will receive identical climate data.

---

## Temporal Limitations

- Data has a 3–7 day latency; not suitable for real-time alerts.
- A 5-year window (2021–2025) captures recent trends but may miss multi-decadal patterns.
- Climate change means historical averages may underestimate future risk.
- Years with extreme events (drought, anomalous rainfall) are not separately flagged.

---

## What NASA POWER Does Not Measure

- Actual soil moisture
- Groundwater availability
- Irrigation infrastructure
- Pest and disease pressure
- Market access and prices
- Farmer labour availability
- Micro-climate effects

---

## Agronomic Rules

All rules in `AGRONOMIC_RULES.md` are **provisional** until validated by an agronomist familiar with Moroccan varieties and farming systems.

Specific risks:
- Thresholds derived from global literature may not match local cultivar performance.
- Crop rotation rules are incomplete (missing disease pressure, soil depletion effects).
- Water-access categories are self-reported and not verified.

---

## Recommendation Score Interpretation

The score (0–100) is a **relative decision-support index**, not:
- A probability of harvest success
- A yield prediction
- A guarantee of agronomic suitability
- An expert recommendation

**Do not use TerraRota recommendations as the sole basis for planting decisions.**

---

## Sample Data

When NASA POWER is unreachable, TerraRota falls back to illustrative sample data. Sample data:
- Is clearly labeled `data_status: "sample"` in all API responses
- Is displayed with a prominent warning in the UI
- Uses realistic but not location-specific values
- Must never be treated as real climate data for the entered location

---

## Missing Data Handling

- NASA fill value (`-999`) is detected and excluded from all calculations.
- If more than 20% of daily values in the analysis period are missing, the system raises an `insufficient_data` flag.
- The system will return an honest abstention rather than produce a recommendation from insufficient data.

---

## Geographic Scope

TerraRota is designed for Morocco. It may technically accept coordinates anywhere, but:
- Agronomic rules are calibrated (provisionally) for Moroccan conditions.
- Results outside Morocco (especially the Souss-Massa and Haouz regions) are less reliable.
- The pilot does not cover the Sahara desert or High Atlas areas, where conditions are extreme.
