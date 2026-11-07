# TerraRota 🌱 — بوابة الفلاح الذكي
> **NASA Space Apps Challenge 2026 • Challenge: Field Shift**  
> Plateforme intelligente d'aide à la décision agricole combinant les observations satellitaires de la NASA (NASA POWER), les règles de rotation des sols (INRA Maroc / FAO) et l'assistance vocale en Darija.

---

## 🌟 Présentation du Projet

**TerraRota** ("La rotation de la terre") résout un défi critique pour l'agriculture marocaine : **la dégradation des sols et la sécheresse récurrente**. 

Au lieu de pratiquer une monoculture céréalière épuisante, TerraRota permet à tout agriculteur ou ingénieur agronome de :
1. **Géolocaliser son champ** en 1 clic (par GPS automatique ou sélection de région).
2. **Interroger en temps réel les satellites de la NASA (NASA POWER AG)** pour extraire l'historique climatique sur 5 ans (précipitations cumulées, températures à 2m, degrés-jours de croissance GDD, risque de gel).
3. **Appliquer les règles agronomiques de rotation INRA / FAO** (ex: fixation biologique de 40 à 80 kg d'azote pur par hectare par le pois chiche après le blé).
4. **Recevoir des recommandations scientifiquement prouvées et expliquées vocalement en Darija** par le conseiller interactif **"Ami Ahmed"**.

---

## 🚀 Fonctionnalités Implémentées (Full MVP Status)

| Fonctionnalité | Statut | Description |
|---|:---:|---|
| **Workflow Guidé en 3 Étapes** | ✅ | Parcours épuré et accessible aux non-techniciens : (1) Parcelle → (2) Précédent cultural → (3) Résultat. |
| **Intégration NASA POWER Directe** | ✅ | Connexion API directe avec fallback et cache local de 6h (pas de fausses données). |
| **Moteur d'Indicateurs Agro-Climatiques** | ✅ | Calculs déterministes : `PRECTOTCORR`, `T2M`, `GDD Base 10°C`, `Indice d'Aridité UNEP`. |
| **Preuves Scientifiques & Traçabilité** | ✅ | Citations agronomiques complètes (INRA Settat, ICARDA, FAO, COI) affichées pour chaque culture. |
| **Conseiller Vocal "عمي أحمد"** | ✅ | Synthèse vocale interactive en Darija marocaine et en français. |
| **Authentification & Gestion des Parcelles** | ✅ | Inscription/Connexion JWT (par Email ou Username) et sauvegarde de parcelles dans MySQL. |
| **Interface Responsive & Bilingue** | ✅ | Arabe marocain (RTL) et Français (LTR) avec palette terre/agricole (`#2D4A27`, `#8C3A27`, `#F4EFE6`). |

---

## 🏛️ Architecture Technique

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + TS + Vite)          │
│   - Guided 3-Step Flow (/)                             │
│   - Crop Recommendations & Scientific Evidences (/rec) │
│   - Real Climate & NASA Provenance Banner (/weather)   │
│   - Ami Ahmed Voice Advisor (/advisor)                 │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP / JSON / JWT
┌───────────────────────────▼────────────────────────────┐
│          Backend (Django 5.1 + REST Framework)         │
│   ├── /api/v1/recommendations/                         │
│   │     ├── data_services/nasa_power.py (NASA API)     │
│   │     ├── indicators/calculator.py (Rain, GDD, Arid) │
│   │     └── recommendation/engine.py (INRA/FAO Rules)  │
│   ├── /api/v1/auth/ (JWT Login/Register par email/user)│
│   └── /api/v1/parcels/ (Gestion des parcelles)         │
└───────────────────────────▲────────────────────────────┘
                            │ MySQL / SQLite
┌───────────────────────────▼────────────────────────────┐
│      Base de Données : MySQL (XAMPP) ou SQLite         │
└────────────────────────────────────────────────────────┘
```

---

## 📦 Stack Technologique

- **Frontend** : React 18, TypeScript, Tailwind CSS, Lucide Icons, React Router v6, Vite.
- **Backend** : Python 3.13, Django 5.1, Django REST Framework, SimpleJWT.
- **Base de données** : MySQL (XAMPP sur port 3306) ou SQLite (commutable via `.env`).
- **Données Satellites** : NASA POWER Daily Agroclimatology API v2.
- **Tests & Qualité** : Pytest-django (43 tests validés à 100%), Vite TypeScript Compiler.

---

## 🛠️ Installation & Démarrage Rapide

### 1. Cloner le projet
```powershell
git clone https://github.com/medchetoui/TerraRota.git
cd TerraRota
```

### 2. Démarrer le Backend (Django)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Si vous utilisez XAMPP (MySQL actif) :
python manage.py migrate

# Lancer le serveur Django :
python manage.py runserver 8000
```
> 💡 *Astuce : Si vous préférez SQLite sans XAMPP, ajoutez simplement `DB_ENGINE=sqlite` dans votre fichier `backend/.env`.*

### 3. Démarrer le Frontend (React)
Dans un second terminal :
```powershell
cd frontend
npm install
npm run dev
```
> 📍 Ouvrez **`http://localhost:5173`** dans votre navigateur.

---

## 🧪 Tests & Validation

Le projet intègre une suite de tests rigoureuse garantissant l'absence d'hallucinations de données :

```powershell
# Exécuter les 43 tests du backend
cd backend
pytest -v
# Résultat : 43 passed in 2.2s (100% de réussite)

# Vérifier la compilation TypeScript du frontend
cd frontend
npm run build
# Résultat : ✓ built in ~500ms sans aucune erreur
```

---

## 👥 Guide de Travail d'Équipe (Git Policy)

Pour maintenir la qualité de la branche principale :
- **Il est interdit de pousser directement sur `main`**.
- Chaque membre crée sa branche personnelle par son nom :
  ```bash
  git checkout -b member/<votre-nom>
  git push -u origin member/<votre-nom>
  ```
- Ouvrir une **Pull Request** sur GitHub pour fusion.
- Consultez [`TEAM_GUIDE.md`](./TEAM_GUIDE.md) et [`docs/TEAM_INTEGRATION_SUMMARY.md`](./docs/TEAM_INTEGRATION_SUMMARY.md) pour les détails par rôle (Membre 1, 2, 3, 4).

---

## 📜 Licence & Données

- Développé dans le cadre du **NASA Space Apps Challenge 2026** (Field Shift).
- Les données satellites sont fournies gracieusement par le projet **NASA POWER** (Langley Research Center).
- Code sous licence MIT.
