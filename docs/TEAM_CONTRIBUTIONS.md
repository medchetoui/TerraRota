# Team Contributions & Roles

> **NASA Space Apps Challenge 2026 • Challenge: Field Shift — Adapting Farms with NASA Data**  
> **Project: TerraRota**  
> **Team Structure: Multidisciplinary Agricultural & AI Engineering Team**

---

## 👨‍💻 Member 1 — Lead Full-Stack Architect & AI System Integrator
- **Name / GitHub**: Mohamed Chetoui ([@medchetoui](https://github.com/medchetoui))
- **Primary Domain**: System Architecture, Agentic AI, Neural Voice Engineering, Full-Stack Integration, Django REST Framework, React 19 Frontend
- **Key Deliverables & Innovations**:
  - **Conversational & Agentic AI Agricultural Advisor (`backend/advisor/` & `/advisor`):**
    - Designed and implemented the complete **Intelligent Agricultural Advisor Engine** (`chat.py`, `context.py`, `views.py`).
    - **Dual Personas with Moroccan Neural Voices:** Integrated Edge Neural TTS providing ultra-realistic Moroccan voices for **Ami Ahmed (👨‍🌾 عمي أحمد)** via `ar-MA-JamalNeural` and **Mi Fatima (👩‍🌾 مي فاطمة)** via `ar-MA-MounaNeural`, along with natural French and English accents (`Henri/Denise`, `Guy/Jenny`).
    - **True Agentic Action Execution (Voice-to-Plan):** Enabled autonomous database actions where spoken requests (e.g. *"صافي غير ربطها بالخطة الرسمية"* / *"peux-tu insérer cela dans mon plan"*) automatically create verified `FarmPlan` proposals in the database (`status='proposed'`) with strict human-in-the-loop confirmation.
    - **Colloquial Darija Agronomic NLU:** Built intent recognition supporting authentic Moroccan farming vernacular (*"نفرع البطاطا"*, *"نغرس"*, *"تيرس"*, *"البلان"*), gratitude, and detailed follow-up technical reasoning while eliminating abrupt out-of-scope errors.
    - **Real-Time Duplex Voice Call (`VoiceCallScreen.tsx`):** Engineered live voice interaction with continuous listening (`ar-MA` SpeechRecognition streaming), a 2.2s intelligent silence detection timer, and interactive acoustic interruption (*tap-to-interrupt / echo cancellation*).
  - **Full-Stack Architecture & Integration:**
    - Unified the Django 5.1 / DRF backend and React 19 / TypeScript / Vite / Tailwind CSS 4 frontend into a high-performance, responsive platform.
    - Designed multi-tenant authenticated farmer sessions and public demo workflows.
    - Built interactive visual dashboards: Leaflet Map selector (`FarmMap.tsx`), Recharts NASA climate time-series (`NASADataPage.tsx`), Multi-Year Rotation Planner (`RotationPlannerPage.tsx`), and What-If Climate Simulator (`SimulatorPage.tsx`).
    - Implemented official Decision Support PDF reporting with instant export (`ReportsPage.tsx`).
  - **NASA Earth Observation Data Services:**
    - Operationalized the **NASA POWER Daily v2.0** API client (`nasa_power.py`) with caching, error-fallback, and automated fill-value filtering (`-999.0`).
    - Engineered agroclimatological indicator algorithms (`indicators/calculator.py`): Growing Degree Days (GDD Base 10), De Martonne Aridity Index, and frost risk.
  - **Quality Assurance & Automated Verification:**
    - Authored and maintained the automated test suite with **101 passing backend tests** (`pytest`, 100% pass rate) and zero-error TypeScript production builds.

---

## 👩‍🔬 Member 2 — Agronomic Engine & Rotation Logic Specialist
- **Name / GitHub**: Hiba Sefraoui ([@hibasefraoui](https://github.com/hibasefraoui8))
- **Primary Domain**: Agronomic Rules, Rotation Logic, Decision Algorithms, Scientific What-If Modeling
- **Key Deliverables (via `member/hiba_sefraoui` & integrated into core)**:
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

## 🎙️ Member 3 — Speech Accessibility & Darija Audio Specialist
- **Name / GitHub**: Ranya Salmi ([@Ranya-Salmi](https://github.com/Ranya-Salmi))
- **Primary Domain**: Darija Audio Curation, In-Browser Voice Workshop, Fellah Audio Integration
- **Key Deliverables (via `member/ranya` & integrated into core)**:
  - **Darija Audio Clips & Speech Synthesis:**
    - Curated and cataloged **50 synthetic Moroccan Darija audio clips** (`public/audio/darija/`) for standard agronomic phrases and advice with metadata manifests (`enregistrements.json`).
    - Recorded reference human audio clips (`hiba_verdict_partiel.wav`) and established transparent labeling (*"صوت اصطناعي · voix de synthèse"*).
  - **Interactive Voice Workshop Tools:**
    - Developed `/advisor?enregistrer` (`FellahEnregistrement.tsx`) for in-browser high-fidelity 16 kHz WAV microphone recording.
    - Developed `/advisor?relire` (`FellahRelecture.tsx`) for textual validation and proofreading of Darija agricultural phrases.
  - **Fellah Quick-Question Component (`FellahQuestion.tsx`):**
    - Built dual-mode question interface allowing farmers to switch between "الأرض ديالي" (Real Parcel) and "أمثلة" (Demo Scenarios).
    - Connected questions to deterministic agronomic responses preventing hallucinations or ungrounded statistics.
  - **End-to-End Test Suite:** Developed browser-based test routines (`frontend/e2e/fellah.e2e.mjs`) testing fallback states (microphone permission denied, offline resilience, and audio playback order).

---

## 🤖 Member 4 — Local NLP & Agricultural Translation Specialist
- **Name / GitHub**: Hajar Ghanam ([@hajarghanam393-hue](https://github.com/hajarghanam393-hue))
- **Primary Domain**: Agricultural Translation, Local LLM Fine-Tuning, Ollama Integration
- **Key Deliverables (via `feature/ollama-translation`)**:
  - **Hybrid Agricultural Translation Framework (`ollama/`):**
    - Formulated a two-tier translation architecture translating agronomic reports and recommendations from French to Moroccan Darija and English.
    - **Deterministic Translation Engine (`rules_translate.py`):** Rule-based instant translation mapping technical agro-meteorological indicators and crop names with 100% fidelity.
    - **Local LLM Integration via Ollama (`translate.py`):** Integrated lightweight open-source models (**Atlas-Chat-2B** and **Llama 3.2**) running locally via Ollama for dynamic and complex phrasing.
    - **Fidelity & Safety Guardrails:** Implemented strict post-generation verification preventing hallucinated crop scores, yields, or non-certified agronomic claims.
