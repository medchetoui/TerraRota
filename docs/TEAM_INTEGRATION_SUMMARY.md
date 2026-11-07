# 🌾 TerraRota — Team Integration & Responsibilities Guide
> **NASA Space Apps Challenge 2026 • Challenge: Field Shift**  
> Document de coordination, d'architecture et de validation des livrables pour les 4 membres de l'équipe.

---

## 🧭 1. Vision & Principe Directeur de l'Équipe (Shared Principles)

> **Règle d'or de la preuve (Evidence Rule)** :  
> *« Ne jamais inventer d'observations NASA, de faits agronomiques, de seuils non vérifiés ou de garanties de rendement. Si une donnée est synthétique ou manquante, elle doit être explicitement étiquetée. »*

**TerraRota** intègre 4 axes majeurs complémentaires :
1. **Connaissances Agronomiques Locales (Membre 1)** : INRA Maroc, FAO, ICARDA, rotation céréales-légumineuses.
2. **Ingestion & Validation NASA POWER (Membre 2)** : Observation de la terre quotidienne (`PRECTOTCORR`, `T2M`, `RH2M`, `GDD`).
3. **Couche Explication IA & Tests de Robustesse (Membre 3)** : Synthèse audio/vocale "Ami Ahmed" en Darija, tests de fiabilité sans hallucination.
4. **Application & Intégration Centrale (Membre 4)** : Plateforme web React/TypeScript + Django REST + MySQL (XAMPP).

---

## 👥 2. Matrice des Rôles, Livrables & Statut d'Intégration

```
                  ┌──────────────────────────────────────────────┐
                  │   MEMBER 4: Core Application & Integration   │
                  │   (React / TypeScript + Django REST + MySQL) │
                  └──────▲────────────────▲──────────────▲───────┘
                         │                │              │
       ┌─────────────────┴─┐     ┌────────┴────────┐    ┌┴──────────────────┐
       │     MEMBER 1      │     │    MEMBER 2     │    │     MEMBER 3      │
       │ Agronomic & Rules │     │ NASA Data Pipe  │    │  AI & Voice Guide │
       │  (INRA / FAO DB)  │     │ (NASA POWER AG) │    │  (Ami Ahmed / QA) │
       └───────────────────┘     └─────────────────┘    └───────────────────┘
```

---

### 🟢 MEMBRE 1 | Connaissances Agronomiques & Règles Métier (Agronomic Knowledge)
* **Objectif** : Fournir la logique agronomique marocaine, les règles de précédent cultural et les citations scientifiques.
* **Livrables attendus & où ils sont intégrés dans le projet** :
  - [`docs/AGRONOMIC_RULES.md`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/docs/AGRONOMIC_RULES.md) : Règles de rotation, besoins en eau, tolérance au calcaire et à l'aridité.
  - [`backend/recommendation/rules.py`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/backend/recommendation/rules.py) : Catalogue des cultures (`CROPS` : blé dur, blé tendre, orge, pois chiche, olive, argan, pomme de terre, amande).
  - [`backend/recommendation/engine.py`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/backend/recommendation/engine.py) : Algorithme de scoring appliquant la fixation d'azote (+40 à 80 kg N/ha par le pois chiche après le blé) et pénalisant la monoculture céréalière.
  - **Citations scientifiques visibles sur le frontend** : Chaque recommandation affiche la source exacte (INRA Settat, ICARDA, FAO, Conseil Oléicole International).

---

### 🔵 MEMBRE 2 | Pipeline de Données NASA (NASA Data Research & Readiness)
* **Objectif** : Connecter l'application aux observations réelles NASA POWER (Agroclimatology Community) avec gestion du cache et fallback d'urgence.
* **Livrables attendus & où ils sont intégrés dans le projet** :
  - [`backend/data_services/nasa_power.py`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/backend/data_services/nasa_power.py) : Requête vers l'API officielle NASA POWER (`https://power.larc.nasa.gov/api/temporal/daily/point`).
    - Variables récupérées sur 5 ans : `T2M` (Température à 2m), `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR` (Pluie corrigée), `RH2M` (Humidité relative), `ALLSKY_SFC_SW_DWN` (Rayonnement solaire), `WS2M` (Vent).
  - [`backend/indicators/calculator.py`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/backend/indicators/calculator.py) : Calculateurs déterministes d'indicateurs agronomiques :
    - Précipitations annuelles moyennes (`annual_rain_mm`).
    - Indice d'aridité UNEP ($AI = P / PET$).
    - Degrés-jours de croissance (`gdd_base10`).
    - Risque de gel annuel (`frost_days_per_year` avec $T_{min} < 0^\circ C$).
  - [`backend/data_services/fixtures/sample_power_response.json`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/backend/data_services/fixtures/sample_power_response.json) : Données de repli clairement étiquetées `sample` en cas d'indisponibilité réseau.
  - **Bannière de provenance sur `/weather`** : Affiche les coordonnées GPS réelles, la résolution 0.5°, les variables et l'état `LIVE` en temps réel.

---

### 🟣 MEMBRE 3 | IA, Guide Vocal & Validation des Tests (AI, Voice & Demo Testing)
* **Objectif** : Rendre la décision compréhensible pour le fellah marocain (sans jargon) et valider la rigueur des tests.
* **Livrables attendus & où ils sont intégrés dans le projet** :
  - **Conseiller Vocal "عمي أحمد / Ami Ahmed"** :
    - Accessible via `/advisor` et présent sous forme de synthèse vocale (Web Speech API) sur `/recommendation` et dans la barre latérale.
    - Explication claire et bienveillante en **Darija marocaine** adaptée aux agriculteurs analphabètes ou non techniciens.
  - [`docs/TEST_PLAN.md`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/docs/TEST_PLAN.md) & [`docs/DEMO_SCRIPT.md`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/docs/DEMO_SCRIPT.md) : Scénarios de démonstration (Fès-Meknès vs Marrakech-Tensift vs Souss-Massa).
  - [`backend/tests.py`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/backend/tests.py) : **43 tests unitaires et d'intégration réussis (100% Pass)** vérifiant :
    - Validation stricte des coordonnées et entrées.
    - Pas d'hallucination de données ou de dépassement des bornes [0-100].
    - Repli propre quand les données sont incomplètes (`insufficient_data`).

---

### 🟠 MEMBRE 4 | Développement de l'Application Centrale & Intégration
* **Objectif** : Construire l'interface React, le backend Django REST, la base MySQL et orchestrer les 3 autres modules.
* **Livrables réalisés & opérationnels** :
  - **Frontend React 18 / TypeScript / Vite** :
    - Workflow fluide en 3 étapes : (1) Localisation GPS automatique ou choix région → (2) Précédent cultural & eau → (3) Recommandation instantanée.
    - Navigation par URLs propres : `/`, `/recommendation`, `/weather`, `/advisor`.
    - Interface soignée aux teintes terre/agricoles (`#F4EFE6`, `#2D4A27`, `#8C3A27`).
  - **Backend Django REST Framework & MySQL (XAMPP)** :
    - Modèle de données [`backend/fields/models.py`](file:///c:/Users/moham/OneDrive/Bureau/TerraRota/backend/fields/models.py) pour la sauvegarde des parcelles.
    - Double authentification flexible par **Nom d'utilisateur OU Email** (`zakaria@gmail.com` / `123456`).
    - Cache local de 6 heures pour respecter les quotas de NASA POWER.

---

## ⚡ 3. Guide d'Exécution Rapide pour l'Équipe

### 1. Démarrer le Backend (Django)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
# Si vous utilisez XAMPP (MySQL démarré) ou SQLite :
python manage.py migrate
python manage.py runserver 8000
```
> *(Astuce : si un membre n'a pas XAMPP, il peut mettre `DB_ENGINE=sqlite` dans `backend/.env` et lancer sans configuration).*

### 2. Démarrer le Frontend (React)
```powershell
cd frontend
npm install
npm run dev
```
> Application disponible sur : **`http://localhost:5173`**

### 3. Exécuter les Tests de Validation
```powershell
# Backend (43 tests)
cd backend
.\.venv\Scripts\pytest.exe

# Frontend Build
cd frontend
npm run build
```

---

## 🌿 4. Protocole Git Obligatoire : Chacun sa Branche Personnelle

> ⚠️ **Consigne stricte pour l'équipe** : Ne jamais pousser directement sur `main`. Chacun crée sa branche personnelle par son nom :

```powershell
# 1. Se mettre à jour depuis le main officiel
git checkout main
git pull origin main

# 2. Créer sa branche personnelle par son nom (Ex: member/sarah ou member/amine)
git checkout -b member/<votre-nom>

# 3. Effectuer ses modifications, tester (pytest / npm run build), puis commit
git add .
git commit -m "feat(nom-tache): explication claire du travail réalisé"

# 4. Pousser sa branche vers GitHub
git push -u origin member/<votre-nom>

# 5. Ouvrir une Pull Request (PR) sur GitHub pour fusion
```

---

## 🎤 5. Structure de Présentation pour la Réunion d'Équipe (5 min par membre)

1. **Membre 1 (Agronomie)** : Présenter `AGRONOMIC_RULES.md`, la logique de rotation Blé-Pois chiche, et les sources INRA/FAO affichées sur l'écran des recommandations.
2. **Membre 2 (NASA Data)** : Démontrer l'écran `/weather`, la récupération en temps réel des coordonnées et des données climatiques sur 5 ans sans simulation.
3. **Membre 3 (IA & QA)** : Faire écouter le conseiller vocal "Ami Ahmed" en Darija et montrer les 43 tests `pytest` au vert.
4. **Membre 4 (Application & Lead)** : Parcourir le workflow complet de l'application en 3 clics, la sauvegarde d'une parcelle dans MySQL et la gestion des comptes.

