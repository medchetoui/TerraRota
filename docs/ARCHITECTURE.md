# Architecture — TerraRota

## Overview

TerraRota follows a classic two-tier web architecture with a clear separation between the React client and the Django API server.

```
┌─────────────────────────────────────────────────┐
│  React 18 + TypeScript + Vite (port 5173)       │
│  ┌────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │ Input Form │→ │ Results View │  │ i18n    │  │
│  └────────────┘  └──────────────┘  └─────────┘  │
└──────────────────────────┬──────────────────────┘
                           │ HTTP/JSON (REST)
                           ▼
┌─────────────────────────────────────────────────┐
│  Django 5 + DRF (port 8000)                     │
│  ┌──────────┐ ┌────────────┐ ┌────────────────┐ │
│  │   api/   │ │ indicators/│ │recommendation/ │ │
│  └──────────┘ └────────────┘ └────────────────┘ │
│       │              ▲              ▲            │
│       ▼              │              │            │
│  ┌─────────────────────────────────┐            │
│  │       data_services/            │            │
│  │  NASA POWER client + cache      │            │
│  └──────────────┬──────────────────┘            │
└─────────────────┼───────────────────────────────┘
                  │ HTTPS
                  ▼
        NASA POWER API (public)
        https://power.larc.nasa.gov/api/
```

## Module Responsibilities

### `api/`
- Django REST Framework views and serializers
- Input validation (coordinates, crop list, constraints)
- Response envelope construction
- CORS and error handling

### `data_services/`
- `nasa_power.py` — HTTP client for NASA POWER
- Response schema validation
- Cache wrapper (in-memory for dev, Redis-ready)
- Provenance metadata construction
- Sample fixture loader (fallback when NASA unavailable)

### `indicators/`
- `calculator.py` — converts raw NASA variables into agronomic indicators
- Growing Degree Days (GDD)
- Aridity Index (AI)
- Frost-risk days
- Seasonal rainfall totals
- All calculations are unit-tested independently

### `recommendation/`
- `engine.py` — deterministic, rule-based scoring
- `rules.py` — crop-specific eligibility and ranking rules
- `explainer.py` — human-readable explanation generation
- No ML dependencies

### `fields/`
- Django models for field records (optional persistence)
- Farmer input schema

## Data Flow

```
POST /api/v1/recommendations/
  {lat, lon, previous_crop, water_access, soil_type, ...}
  │
  ├── Validate inputs (serializer)
  │
  ├── data_services.nasa_power.fetch_climate_data(lat, lon)
  │   ├── Try live NASA POWER API
  │   ├── On failure → try local cache
  │   └── On cache miss → return sample fixture + status='sample'
  │
  ├── indicators.calculator.calculate(climate_data)
  │   → {gdd, aridity_index, frost_days, annual_rain, ...}
  │
  ├── recommendation.engine.rank(indicators, farmer_inputs)
  │   → [{crop, score, reasons, cautions, rules_applied}, ...]
  │
  └── Return JSON response with provenance
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Rule-based engine (no ML) | No validated training dataset exists |
| NASA POWER only (initial) | Free, documented, global reanalysis |
| 5-year climate window | Captures recent trends without requiring long records |
| Sample fallback | Enables demo when NASA is unreachable |
| Monolith (not microservices) | Appropriate scale for MVP |
| SQLite for dev | Zero setup; PostgreSQL-ready via DATABASE_URL |

## Security Considerations

- Secrets loaded from environment variables only
- CORS restricted to known frontend origins
- No stack traces exposed to clients
- Input data validated and sanitised before external calls
- Geolocation consent handled in the frontend
- No personal data persisted beyond the request

## Scalability Path

For production beyond MVP:
1. Replace SQLite with PostgreSQL
2. Replace in-memory cache with Redis
3. Add task queue (Celery) for long NASA fetches
4. Deploy Django behind gunicorn + nginx
5. Deploy React to CDN (Vercel, Netlify, or S3)
