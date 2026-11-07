# 🤝 TerraRota — Team Collaboration & Architecture Guide
> **NASA Space Apps Challenge 2026 — Track: Field Shift**  
> Guide complet d'intégration, d'architecture et de prise en main pour toute l'équipe.

---

## 📌 1. Vision & Objectif du Projet

**TerraRota** est une plateforme d'aide à la décision agricole conçue pour les agriculteurs et ingénieurs agronomes au Maroc. Elle combine :
1. **Les données d'observation de la Terre de la NASA** (projet **NASA POWER Agroclimatology**) pour extraire l'historique climatique réel sur 5 ans (précipitations, températures, indice d'aridité, risque de gel).
2. **Les règles de rotation des cultures** homologuées par l'**INRA Maroc** et la **FAO** (fixation biologique de l'azote par les légumineuses après céréales).
3. **Une interface bilingue (Darija / Français)** épurée pour les agriculteurs (parcours 3 étapes + assistant vocal "Ami Ahmed") et rigoureuse pour les ingénieurs (preuves scientifiques et citations).

---

## 🏛️ 2. Architecture Technique Globale

```
TerraRota/
├── backend/                       # Python 3.13 / Django 5.1 / DRF
│   ├── terrarota/                 # Paramètres (Settings, URLs, WSGI)
│   ├── data_services/             # Client NASA POWER API + Cache 6h + Fallback
│   ├── indicators/                # Calculateur agrométéorologique (Rain, GDD, Aridity)
│   ├── recommendation/            # Moteur agronomique de scoring & Preuves INRA/FAO
│   ├── fields/                    # Modèles MySQL / Django ORM (Parcelles sauvegardées)
│   ├── api/                       # Vues DRF, Serializers, Auth JWT (User/Email)
│   └── tests.py                   # Suite de tests (43/43 tests validés)
├── frontend/                      # React 18 / TypeScript / Vite / Tailwind
│   ├── src/App.tsx                # Navigation (Router), Workflow 3 étapes & Pages
│   ├── src/api/client.ts          # Client HTTP Axios + Injection JWT Bearer Token
│   ├── src/types/api.ts           # Types TypeScript stricts synchronisés avec le backend
│   └── src/i18n/translations.ts   # Dictionnaire bilingue (Arabe marocain / Français)
└── docs/                          # Documentation technique & agronomique détaillée
```

---

## 🚀 3. Guide de Démarrage Rapide (Pour l'équipe)

### Prérequis
- **Python 3.11+**
- **Node.js 18+** & npm
- **XAMPP (MySQL)** ou **SQLite** (activable en 1 clic)

### A. Lancer le Backend (Django)

Chaque membre peut choisir **l'Option 1 (avec environnement virtuel)** ou **l'Option 2 (directement sans environnement virtuel)** :

#### Option 1 (Recommandée : avec environnement virtuel)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

#### Option 2 (Directe : sans environnement virtuel sur votre Python global)
Si vous ne voulez pas créer de virtualenv, installez simplement les dépendances sur votre machine :
```powershell
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```
   > 📍 API disponible sur : `http://127.0.0.1:8000/api/v1/`

---

### B. Lancer le Frontend (React + Vite)

1. Ouvrez un deuxième terminal dans le dossier `frontend` :
   ```bash
   cd frontend
   ```
2. Installez les packages Node :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
   > 📍 Application accessible sur : `http://localhost:5173/`

---

## 🧪 4. Validation & Tests Automatisés

Avant de modifier du code ou de commiter, assurez-vous que les tests passent :

- **Tester le Backend** :
  ```bash
  cd backend
  pytest
  # Résultat attendu : 43 passed in ~2.3s (100% de réussite)
  ```
- **Vérifier le build Frontend** :
  ```bash
  cd frontend
  npm run build
  # Résultat attendu : ✓ built in ~500ms sans aucune erreur TypeScript
  ```

---

## 🌐 5. Les Routes Principales de l'Application

| URL Frontend | Rôle & Description |
|---|---|
| `/` | **Workflow guidé en 3 étapes** pour l'agriculteur : (1) Localisation GPS 1-clic ou choix région → (2) Précédent cultural & irrigation → (3) Résultat. |
| `/recommendation` | **Détail de la culture recommandée** : Score d'affinité %, alternatives #2, #3, et encart des **Preuves Scientifiques INRA/FAO/NASA**. |
| `/weather` | **Données Climatiques Réelles** : Précipitations annuelles NASA (`PRECTOTCORR`), Température moyenne (`T2M`), Degrés-jours (`GDD`), et bannière officielle de traçabilité NASA. |
| `/advisor` | **Conseiller Vocal Interactif** : Guide audio vocal "Ami Ahmed" en Darija marocaine. |

---

## 🛡️ 6. Comptes & Authentification

L'application intègre un système d'authentification complet et sécurisé par JWT (JSON Web Token) :
- N'importe quel membre ou testeur peut créer son propre compte en 5 secondes en cliquant sur **"دخول / تسجيل" (Connexion)** puis sur l'onglet **"إنشاء حساب جديد" (Créer un compte)**.
- Le système accepte indifféremment la connexion par **Nom d'utilisateur** ou par **Adresse Email**.
- Une fois connecté, chaque utilisateur peut sauvegarder ses parcelles agricoles et retrouver ses analyses personnalisées.

---

## 🌿 7. Protocole Git Obligatoire pour l'Équipe (Chacun sa Branche)

> ⚠️ **RÈGLE IMPORTANTE DE L'ÉQUIPE** :  
> **Il est formellement interdit de push directement sur la branche `main` !**  
> Chaque membre de l'équipe **doit créer et travailler sur sa propre branche nommée avec son prénom ou nom**.

### Les étapes que chaque membre doit suivre sur son PC :

1. **Récupérer la dernière version propre de `main`** :
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Créer et basculer sur sa propre branche personnelle** :
   ```bash
   # Remplacez <votre-nom> par votre prénom (ex: member/amine, member/hiba, etc.)
   git checkout -b member/<votre-nom>
   ```

3. **Travailler, tester et commiter ses modifications sur sa branche** :
   ```bash
   git add .
   git commit -m "feat(module): description claire de votre travail"
   ```

4. **Pousser sa branche personnelle vers GitHub** :
   ```bash
   git push -u origin member/<votre-nom>
   ```

5. **Ouvrir une Pull Request (PR)** :  
   Sur l'interface web de GitHub, cliquez sur **"Compare & pull request"** pour que le Lead ou l'équipe valide et fusionne votre travail dans `main`.

Bon travail d'équipe à tous pour le NASA Space Apps Challenge 2026 ! 🚀🌾

