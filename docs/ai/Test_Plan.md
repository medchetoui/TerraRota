# TerraRota – Plan de test

NASA Space Apps Challenge 2026 – Field Shift
Toutes les données de test sont **FICTIF**.

## 1. Objectif

Vérifier deux choses avant la réunion du 28 octobre :
- la validation des données fonctionne ;
- l'IA locale (Ollama) explique la recommandation sans rien inventer.

## 2. Périmètre

| Inclus | Hors périmètre (après le 28) |
| --- | --- |
| Validation des données (fixture fictif) | Calcul des indicateurs |
| Explication IA sur recommandation fictive | Moteur de recommandation |
| Comparaison de 2 à 3 modèles Ollama | Tests sur le vrai dataset |

## 3. Tests de données

- **Fichiers :** `validate_dataset.py`, `tests/fixtures/sample_fictif.csv`, `tests/test_dataset_validation.py`
- **Méthode :** au moins un test par type d'erreur.
- **Types d'erreur :** valeur manquante, date invalide, doublon, coordonnée impossible, unité inattendue, observation trop ancienne.
- **Résultat attendu :** 10 lignes, 4 acceptées, 6 rejetées.
- **Réussite :** tous les tests passent.

## 4. Tests de l'IA

- **Cas de test :** `AI_TEST_CASES.md` (TC-01 à TC-08).
- **Méthode :** même prompt, même JSON de base, seul le modèle change.
- **Mesures par cas :** réponse réelle, temps de réponse, résultat (Réussi, Partiel ou Échec) selon la grille de notation de `AI_TEST_CASES.md`.
- **Échecs critiques :** source inventée, affirmation non supportée par le JSON, excès de confiance.
- **Résultats détaillés :** `AI_EVALUATION.md`.

## 5. Responsables et dates

| Test | Responsable | Date |
| --- | --- | --- |
| Tests de données | Membre 2 | 26 oct (fait) |
| Rédaction des cas IA | Membre 2 | 26 oct (fait) |
| Exécution des cas IA | Membre 3 | 27 oct |
| Résultats IA transmis au Membre 2 | Membre 3 | 27 oct, fin de journée |

## 6. Critères de validation

- Tous les tests de données passent.
- Aucun échec critique sur le modèle retenu.
- Les limites constatées (dont la darija) sont documentées dans `AI_EVALUATION.md`.

## 7. Après le 28

- Relancer les tests de données sur le vrai dataset.
- Ajouter des tests pour les indicateurs et le moteur de recommandation.