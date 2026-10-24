# TerraRota UML & Architectural Models

This directory contains the 6 formal UML diagrams representing the architecture, data structures, and runtime workflows of TerraRota for the NASA Space Apps Challenge 2026.

| Diagram File | Type | Description & System Mapping |
| :--- | :--- | :--- |
| `mermaid-diagram.png` | **Class Diagram** | Models `RecommendationService`, `FarmerInput`, `Field`, `EnvironmentalData`, `Indicator`, `AgronomicRule`, `Crop`, and `Recommendation`. Matches `backend/indicators/calculator.py`, `backend/recommendation/rules.py`, and `backend/recommendation/engine.py`. |
| `mermaid-diagram (1).png` | **Sequence Diagram** | Step-by-step API interaction: Client input -> Validation (400 if invalid) -> Check cache -> Query NASA POWER API (fallback on timeout) -> Calculate indicators -> Execute rule engine -> Return JSON payload. |
| `mermaid-diagram (2).png` | **Activity Diagram** | Farmer workflow: Input farm specs & GPS -> System validates -> Parallel retrieval & computation of Agro-Climatic Indicators -> Agronomic Rule Evaluation -> Rank & format recommendations with rotational alerts. |
| `mermaid-diagram (3).png` | **Component Diagram** | System architecture: Mobile-first React Frontend, Django REST API, Data Service Layer (NASA POWER client + fallback cache), Indicator Calculation Engine, Rule-Based Recommendation Engine, and PostgreSQL Storage. |
| `mermaid-diagram (4).png` | **ER Diagram** | Relational data schema: `USER` -> `PARCEL/FIELD` (1:N) -> `RECOMMENDATION_RUN` (1:N) -> `RECOMMENDATION_ITEM` (1:N) and `CROP` catalogue. |
| `mermaid-diagram (5).png` | **Deployment Diagram** | Production runtime nodes: Client Web Browser (React SPA) over HTTPS -> Web Server / Reverse Proxy (Vite / Nginx) -> Application Server (Django REST Framework) -> Database Server (PostgreSQL) + Remote NASA POWER API. |
