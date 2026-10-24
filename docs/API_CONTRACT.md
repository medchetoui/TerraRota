# API Contract — TerraRota v1

Base URL (development): `http://localhost:8000/api/v1/`

All requests and responses use `application/json`.

---

## Endpoints

### GET /api/v1/health/

Returns the service status. No authentication required.

**Response 200**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "nasa_power_reachable": true,
  "timestamp": "2026-10-24T20:00:00Z"
}
```

---

### POST /api/v1/recommendations/

Accepts farmer inputs and returns ranked crop recommendations.

**Request body**
```json
{
  "latitude": 31.52,
  "longitude": -8.75,
  "previous_crop": "wheat",
  "water_access": "rainfed",
  "soil_type": "clay_loam",
  "field_size_ha": 2.5,
  "preferred_crops": ["barley", "chickpea"],
  "notes": "Sloped terrain, hand irrigation possible"
}
```

**Field definitions**

| Field | Type | Required | Values / Notes |
|---|---|---|---|
| `latitude` | float | yes | −90 to 90 |
| `longitude` | float | yes | −180 to 180 |
| `previous_crop` | string | no | See crop list below |
| `water_access` | string | no | `rainfed`, `irrigated`, `partial` |
| `soil_type` | string | no | `clay`, `clay_loam`, `loam`, `sandy_loam`, `sandy`, `unknown` |
| `field_size_ha` | float | no | >0 |
| `preferred_crops` | string[] | no | Subset of supported crop IDs |
| `notes` | string | no | Free text, max 500 chars |

**Crop IDs**
`wheat_hard`, `wheat_soft`, `barley`, `olive`, `argan`, `tomato`, `chickpea`, `cactus_pear`

**Response 200 — success**
```json
{
  "status": "ok",
  "data_status": "live",
  "provenance": {
    "source": "NASA POWER Daily v2.5.0",
    "retrieved_at": "2026-10-24T20:01:00Z",
    "period": {"start": "2021-01-01", "end": "2025-12-31"},
    "spatial_resolution_deg": 0.5,
    "variables": ["T2M", "PRECTOTCORR", "RH2M", "ALLSKY_SFC_SW_DWN"]
  },
  "indicators": {
    "annual_rain_mm": 312.5,
    "aridity_index": 0.34,
    "mean_annual_temp_c": 18.2,
    "gdd_base10": 2850,
    "frost_days_per_year": 4,
    "dry_months": 6
  },
  "recommendations": [
    {
      "crop_id": "barley",
      "crop_name_fr": "Orge",
      "crop_name_ar": "الشعير",
      "score": 82,
      "rank": 1,
      "eligible": true,
      "reasons": [
        "Aridity index (0.34) falls within barley's semi-arid tolerance range.",
        "GDD (2850) is sufficient for barley maturation.",
        "Rainfed water access is compatible with barley requirements."
      ],
      "cautions": [
        "4 frost days detected — monitor for late-frost risk during heading."
      ],
      "missing_data": [],
      "rules_applied": ["BARLEY_ARIDITY_001", "BARLEY_GDD_001", "BARLEY_WATER_001"],
      "is_provisional": true,
      "provisional_note": "Agronomic rules have not yet been validated by a domain expert."
    }
  ],
  "abstained_crops": [],
  "insufficient_data_reason": null
}
```

**Response 200 — insufficient data**
```json
{
  "status": "ok",
  "data_status": "insufficient_data",
  "insufficient_data_reason": "NASA POWER returned no data for this location and period.",
  "recommendations": [],
  "provenance": null,
  "indicators": null
}
```

**Response 400 — validation error**
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "errors": {
    "latitude": ["Ensure this value is less than or equal to 90."],
    "longitude": ["This field is required."]
  }
}
```

**Response 503 — NASA unavailable, no cache**
```json
{
  "status": "ok",
  "data_status": "sample",
  "sample_note": "NASA POWER is currently unreachable. Results are based on illustrative sample data and must not be used for real decisions.",
  "recommendations": [...]
}
```

---

### GET /api/v1/crops/

Returns the list of supported crops with their display names.

**Response 200**
```json
{
  "crops": [
    {"id": "barley", "name_fr": "Orge", "name_ar": "الشعير", "category": "cereal"},
    {"id": "wheat_hard", "name_fr": "Blé dur", "name_ar": "القمح الصلب", "category": "cereal"}
  ]
}
```

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input failed schema validation |
| `COORDINATES_OUT_OF_RANGE` | 400 | Lat/lon outside valid range |
| `NASA_UNAVAILABLE` | 503 | NASA POWER unreachable and no cache |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
