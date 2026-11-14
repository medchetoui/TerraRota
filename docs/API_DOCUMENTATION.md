# TerraRota REST API Documentation

> **Base URL**: `http://localhost:8000/api/v1/`  
> **Authentication**: JWT Bearer Token (`Authorization: Bearer <access_token>`)

---

## 1. Core Agroclimatology & Recommendations

### `POST /recommendations/`
Calculates environmental indicators from NASA POWER and returns ranked crop recommendations.

**Request Body**:
```json
{
  "latitude": 33.00,
  "longitude": -7.60,
  "previous_crop": "wheat_hard",
  "water_access": "rainfed",
  "soil_type": "clay_loam",
  "field_size_ha": 5.2,
  "farmer_priorities": {
    "soil_health": 0.8,
    "water_conservation": 0.6
  }
}
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "data_status": "live",
  "provenance": { ... },
  "indicators": {
    "annual_rain_mm": 342.5,
    "mean_annual_temp_c": 19.8,
    "gdd_base10": 2180.0,
    "aridity_index": 0.29,
    "frost_days_per_year": 1.2,
    "dry_months": 6.0,
    "missing_data_pct": 0.1
  },
  "recommendations": [
    {
      "crop_id": "chickpea",
      "crop_name_fr": "Pois chiche",
      "crop_name_ar": "الحمص",
      "crop_name_en": "Chickpea",
      "score": 92,
      "rank": 1,
      "eligible": true,
      "reasons": [
        "Rotation céréale-légumineuse : fixation symbiotique de l'azote.",
        "Pluviométrie mesurée par NASA compatible (342 mm)."
      ],
      "cautions": [],
      "evidences": [ ... ]
    }
  ],
  "abstained_crops": []
}
```

---

### `POST /scenarios/`
Generates 4–5 multi-year crop rotation alternatives with soil health, water savings, and profitability metrics.

**Response (200 OK)**:
```json
{
  "status": "ok",
  "scenarios": [
    {
      "id": "scenario_legume_rotation",
      "title_fr": "Régénération Biologique (Légumineuse - Céréale)",
      "badge": "Recommandé INRA Maroc",
      "crop_sequence": [
        {"year": 1, "season": "2026/2027", "crop_id": "chickpea"},
        {"year": 2, "season": "2027/2028", "crop_id": "wheat_hard"},
        {"year": 3, "season": "2028/2029", "crop_id": "lentil"}
      ],
      "water_savings_pct": 25,
      "n_fixation_kg_ha": "50 - 90 kg N/ha",
      "soil_health_score": 92,
      "resilience_score": 85,
      "profitability_score": 78
    }
  ]
}
```

---

### `POST /whatif/`
Runs a hypothetical what-if scenario comparing baseline results against user-defined environmental or management variations.

**Request Body**:
```json
{
  "latitude": 33.00,
  "longitude": -7.60,
  "previous_crop": "wheat_hard",
  "water_access": "rainfed",
  "simulated_changes": {
    "rain_factor": 0.8,
    "temp_delta": 2.0,
    "water_access": "irrigated"
  }
}
```

---

### `GET /crops/detail/`
Returns the full Moroccan agronomic knowledge base with botanical families, water needs, sowing/harvesting seasons, and scientific citations.

---

### `GET /data-sources/`
Returns the official NASA Earth Observation registry with spatial/temporal resolutions and integration statuses.

---

### `POST /reports/decision-report/`
Assembles complete decision report payload for PDF rendering.

---

## 2. Authentication & JWT

- `POST /auth/register/` — Register new farmer account (`username`, `password`, `email`)
- `POST /auth/login/` — Authenticate via username OR email, returns JWT tokens
- `POST /auth/refresh/` — Refresh access token
- `GET /auth/me/` — Retrieve user profile (Requires Bearer token)

---

## 3. Parcel & Plan Management

- `GET /parcels/` — List saved fields of logged-in user
- `POST /parcels/` — Create new field record
- `DELETE /parcels/<id>/` — Delete field record
- `GET /plans/` — List saved farm rotation plans
- `POST /plans/` — Save plan (`parcel`, `title`, `status`, `crop_sequence`)
- `PATCH /plans/<id>/` — Update plan status (`status: approved | rejected | modified`, `farmer_feedback`, `rejection_reason`)
