# Data Provenance & Traceability

> **Project: TerraRota**  
> **NASA Space Apps Challenge 2026 • Challenge: Field Shift**

---

## 1. Traceability Architecture

Every piece of environmental intelligence in TerraRota has a traceable lineage. We do not invent, smooth without notification, or fabricate measurements.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. NASA Earth Observation Satellites (Terra, Aqua, GPM)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Daily assimilation
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. NASA POWER Agroclimatology API (Langley Research Center) │
│    - Endpoint: /api/temporal/daily/point?community=AG       │
│    - Parameters: PRECTOTCORR, T2M, T2M_MAX, T2M_MIN, etc.  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS JSON GET Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. TerraRota Ingestion Pipeline (backend/data_services/)    │
│    - Fill-value filtering (-999.0 values counted)           │
│    - Spatial resolution verification (0.5°)                 │
│    - Local cache layer (6-hour TTL via LocMemCache)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Clean Data Stream
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Deterministic Indicator Engine (backend/indicators/)     │
│    - Rainfall totals & seasonal dry months                  │
│    - GDD Base 10°C calculation                              │
│    - UNEP Aridity Index & Frost count                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Verified Indicators
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Recommendation & Scenario Engines                        │
│    - INRA Maroc / FAO Crop Compatibility Checks             │
│    - Provenance envelope attached to every API response     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. The Provenance Response Envelope

Every recommendation returned by the backend includes a `provenance` metadata block:

```json
{
  "provenance": {
    "source": "NASA POWER Daily v2.0",
    "retrieved_at": "2026-11-14T01:00:00Z",
    "period": {
      "start": "20210101",
      "end": "20251231"
    },
    "spatial_resolution_deg": 0.5,
    "variables": ["PRECTOTCORR", "T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN"],
    "latitude": 33.00,
    "longitude": -7.60
  }
}
```

---

## 3. Data Status Values

TerraRota explicitly informs the user about the origin of every metric:

| `data_status` | Meaning | User Presentation |
|---|---|---|
| `live` | Directly retrieved from NASA POWER servers in the last 6 hours | Green pulse: *"NASA Direct Live"* |
| `cached` | Valid response served from local server cache ($TTL = 6\text{h}$) | Blue badge: *"Données NASA en cache local"* |
| `sample` | Offline fallback snapshot used when NASA API is unreachable | Amber banner: *"Mode Simulation / Données d'illustration"* |
| `insufficient_data` | Fill values exceed 40-60% of expected calendar points | Red notice: *"Données satellitaires insuffisantes pour ce lieu"* |

---

## 4. Fill-Value & Outlier Filtering

NASA POWER uses `-999.0` as a sentinel fill value for missing or corrupt telemetry:
1. TerraRota filters all values $\le -999.0$ during response parsing (`_parse_power_response`).
2. Missing day percentages are monitored per variable.
3. If critical variables (`T2M` or `PRECTOTCORR`) contain less than the minimum required observations, the engine raises `InsufficientDataError` and safely abstains from issuing recommendations.
