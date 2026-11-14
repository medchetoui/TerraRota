# Team Contributions & Roles

> **NASA Space Apps Challenge 2026 • Challenge: Field Shift**  
> **Project: TerraRota**  
> **Team Structure: 4 Members**

---

## Member 1 — Lead Full-Stack Architect & Core System Integrator
- **Name / GitHub**: Mohamed Chetoui (@medchetoui)
- **Primary Domain**: Full-Stack Architecture, Django REST Framework, React 19 Frontend, System Integration
- **Key Deliverables**:
  - **Full-Stack Architecture & Integration:** Designed and implemented the overarching end-to-end architecture unifying the Django 5.1 / DRF backend and the React 19 / TypeScript / Vite / Tailwind CSS 4 frontend.
  - **NASA Earth Observation Data Services:**
    - Integrated the operational **NASA POWER Daily v2.0** API client (`backend/data_services/nasa_power.py`) with automatic fill-value cleaning (`-999.0`), network resilience, and caching.
    - Built the NASA indicators engine (`backend/indicators/calculator.py`) calculating Growing Degree Days (GDD Base-10), De Martonne Aridity Index, and seasonal rainfall envelopes.
    - Authored the official Earth Observation catalog in `backend/data_services/registry.py` (NASA POWER, MODIS MOD13Q1, SMAP, GPM IMERG, SoilGrids 250m).
  - **Production-Ready Recommendation, Scenario & Simulator APIs:**
    - Integrated the agronomic recommendation and rotation pipeline directly into Django (`backend/recommendation/engine.py`, `rules.py`, `scenarios.py`, `whatif.py`, `priorities.py`).
    - Extended database persistence and migrations (`Parcel`, `RotationHistory`, `FarmerPriority`, `FarmPlan`) supporting multi-tenant authenticated farmers and public demo visitors.
    - Designed REST API serialization and views (`/api/v1/recommendations/`, `/api/v1/scenarios/`, `/api/v1/whatif/`, `/api/v1/crops/detail/`, `/api/v1/plans/`, `/api/v1/reports/decision-report/`).
  - **Interactive Frontend Application:**
    - Built the interactive Leaflet map component (`frontend/src/components/FarmMap.tsx`) with Moroccan pilot presets and custom coordinate picking.
    - Built dedicated interactive pages: NASA Environmental Charts with Recharts (`NASADataPage.tsx`), Multi-Year Rotation Planner (`RotationPlannerPage.tsx`), What-If Simulator with sliders (`SimulatorPage.tsx`), and the official Decision Report viewer with one-click `jsPDF` export (`ReportsPage.tsx`).
    - Created the one-click **"Mode Démo (Chaouia) ⭐"** header evaluation flow for live judging.
  - **Quality Assurance & Testing:** Authored the automated test suite (`backend/tests.py`, 50/50 passing tests) and ensured zero-error TypeScript production builds.

---

## Member 2 — Agronomic Engine & Rotation Logic Specialist
- **Name / GitHub**: Hiba Sefraoui (@hibasefraoui)
- **Primary Domain**: Agronomic Rules, Rotation Logic, Decision Algorithms, Darija Agricultural Terminology
- **Key Deliverables (via `member/hiba_sefraoui` & integrated into production core)**:
  - **Core Agronomic Knowledge & Crop Specifications:**
    - Researched and authored baseline crop specifications (`crops_reference.json`) including cycle durations, water envelopes, and agro-climatic boundaries.
    - Formulated the agronomic rotation logic (`rotation.py`), penalizing monoculture (cereal-after-cereal) and rewarding pulse-cereal alternation based on Moroccan farming practices.
  - **Provisional Recommendation & Multi-Year Planning Algorithms:**
    - Designed algorithmic prototypes for provisional crop scoring (`scoring.py`, `plan.py`) and multi-year rotation sequencing (`scenarios.py`).
    - Established early concept validation for the What-If simulation rules (`whatif.py`), analyzing drought sensitivity and water regimes.
  - **Agricultural Explainability & Moroccan Darija Translation:**
    - Authored explainability templates (`explain.py`, `report.py`) translating agronomic rationale into farmer-friendly vocabulary.
    - Built the agricultural Darija terminology lexicon (`traduction/termes_darija.json`, `translate.py`) to ensure accessible communication with Moroccan smallholders.
  - **Algorithmic Verification:** Developed standalone scenario test suites and test cases (`moteur/tests/`) validating crop rules, rotation logic, and translation mappings.

---

## Member 3 — AI & Machine Learning Engineer (Crop & Climate Modeling)
- **Name / GitHub**: [Team Member Name] (@github_username)
- **Primary Domain**: AI/ML Modeling, Yield Prediction, Satellite Feature Extraction
- **Key Deliverables**:
  - **Predictive Yield & Risk Modeling:** Researched and trained lightweight machine learning models (gradient boosting / regression) correlating historical NASA POWER climate variables (precipitation, temperature anomalies) with Moroccan crop yields.
  - **Vegetation Index Modeling:** Analyzed MODIS (MOD13Q1) NDVI and EVI time-series features to benchmark seasonal crop phenology curves against theoretical growing cycles.
  - **Model Evaluation & Explainability:** Conducted model validation and feature importance analysis (SHAP/permutation importance) to ensure the ML pipeline remains scientifically explainable and transparent.

---

## Member 4 — AI & NLP Engineer (Agronomic Advisory & Local LLM Integration)
- **Name / GitHub**: [Team Member Name] (@github_username)
- **Primary Domain**: Conversational AI, Retrieval-Augmented Generation (RAG), Local LLM Inference
- **Key Deliverables**:
  - **Local Agronomic Advisor (RAG):** Designed the local AI advisor framework using lightweight open-source models (e.g. Qwen 2.5 / Ollama) to answer farmers' agronomic queries in Moroccan Darija, Arabic, and French without hallucinations.
  - **Contextual Prompt Engineering & Grounding:** Built prompt guardrails grounding the AI assistant exclusively in INRA Morocco bulletins, FAO Paper 56, and verified TerraRota recommendation outputs.
  - **Voice & Accessibility Interface:** Researched voice-to-text integration and speech guidance (`VoiceAdvisor`) to make satellite-derived decisions easily accessible to non-literate farmers.
