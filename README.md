# TerraRota 🌱

> **NASA Space Apps Challenge 2026 — Field Shift**
> Helping Moroccan farmers make informed, evidence-based crop-selection decisions using NASA Earth Observation data.

---

## What TerraRota Does

TerraRota is a decision-support tool that collects basic farm information (location, previous crops, water access, soil type), retrieves real environmental data from NASA POWER, calculates key agronomic indicators, and returns ranked crop recommendations with transparent explanations.

**It does not replace agronomic expertise.** All results include provenance, confidence levels, and explicit warnings when recommendations are provisional.

---

## MVP Scope

| Feature | Status |
|---|---|
| Farmer input form (location, constraints) | ✅ Implemented |
| NASA POWER climate data retrieval | ✅ Implemented |
| Indicator calculation (heat units, aridity, etc.) | ✅ Implemented |
| Rule-based recommendation engine | ✅ Implemented |
| Explainable ranked results | ✅ Implemented |
| Insufficient-data handling | ✅ Implemented |
| French + Arabic UI (RTL) | ✅ Implemented |
| Sample-data fallback when NASA unavailable | ✅ Implemented |
| Authentication / user accounts | ❌ Not in MVP |
| ML-based recommendations | ❌ Not in MVP |
| Mobile native app | ❌ Not in MVP |

**Pilot region:** Souss-Massa and Tensift plains, Morocco (31°N–34°N, 7°W–9°W).  
**Supported crops (provisional):** Wheat (hard/soft), Barley, Argan, Tomato, Olive, Cactus Pear, Chickpea.

---

## Architecture

```
React (Vite + TypeScript)
        │  HTTP/JSON
        ▼
Django REST Framework
   ├── Validation
   ├── NASA POWER data service
   ├── Indicator processor
   └── Recommendation engine
        │  SQLite (dev)
        ▼
   Local cache / DB
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.13, Django 5.x, Django REST Framework |
| External data | NASA POWER API (public, no key required) |
| Database | SQLite (dev), PostgreSQL-ready |
| Testing | pytest-django, Vitest |
| Dev tools | PowerShell scripts |

---

## Prerequisites

- Python 3.11+ (3.13.2 confirmed)
- Node.js 18+ (22.14 confirmed)
- npm 9+
- Git

---

## Project Structure

```
TerraRota/
├── README.md
├── .gitignore
├── .env.example
├── docs/
│   ├── PROJECT_SCOPE.md
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── NASA_DATA_SOURCES.md
│   ├── AGRONOMIC_RULES.md
│   ├── DATA_LIMITATIONS.md
│   ├── TEST_PLAN.md
│   ├── TEAM_TASKS.md
│   └── DEMO_SCRIPT.md
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── terrarota/         ← Django project settings
│   ├── api/               ← REST endpoints
│   ├── data_services/     ← NASA POWER client
│   ├── indicators/        ← Indicator calculation
│   ├── recommendation/    ← Recommendation engine
│   └── fields/            ← Field/farmer data models
├── frontend/
│   ├── package.json
│   ├── src/
│   └── ...
└── scripts/
    ├── setup.ps1
    └── run-dev.ps1
```

---

## Windows Setup

### 1. Clone / open the repository

```powershell
cd "C:\Users\moham\OneDrive\Bureau\TerraRota"
```

### 2. Run the setup script

```powershell
.\scripts\setup.ps1
```

This will:
- Create a Python virtual environment at `backend\.venv`
- Install all Python dependencies
- Copy `.env.example` to `backend\.env`
- Install Node dependencies in `frontend/`

### 3. Start development servers

```powershell
.\scripts\run-dev.ps1
```

Or manually:

```powershell
# Terminal 1 — Backend
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver

# Terminal 2 — Frontend
cd frontend
npm run dev
```

---

## Running Tests

```powershell
# Backend tests
cd backend
.\.venv\Scripts\Activate.ps1
pytest -v

# Frontend type check
cd frontend
npm run type-check

# Frontend tests
cd frontend
npm run test
```

---

## NASA Connectivity Check

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts/check_nasa.py
```

---

## Sample Demo

1. Open `http://localhost:5173` in your browser.
2. Enter coordinates: **Lat 31.52, Lon -8.75** (Marrakech region).
3. Select previous crop: **Wheat**, water access: **Rainfed**, soil: **Clay-loam**.
4. Submit → View climate indicators → Read ranked recommendations.

See `docs/DEMO_SCRIPT.md` for the full reproducible demo scenario.

---

## Known Limitations

- Agronomic rules are provisional and must be validated by domain experts before any operational use.
- NASA POWER spatial resolution is ~0.5° (~50 km) — not field-level precision.
- Soil data is self-reported and not validated against remote sensing.
- The recommendation engine does not account for pest pressure, market prices, or farmer labour capacity.
- Arabic translations are partial in the initial prototype.

---

## License

MIT — see LICENSE file. NASA data use is governed by NASA's open-data policy.
