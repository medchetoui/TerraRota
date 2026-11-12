# TerraRota – Scénario de démo

NASA Space Apps Challenge 2026 – Field Shift
Toutes les données et recommandations de ce scénario sont **FICTIF**.

## 1. Personnage

- **Nom :** Hassan (FICTIF)
- **Lieu :** zone agricole rurale du Maroc (FICTIF)
- **Situation :** petite parcelle, peu d'eau disponible
- **Particularité :** ne sait pas lire, utilise l'application à l'oral (audio, darija)

## 2. Question

« Qu'est-ce que je peux planter cette saison avec peu d'eau ? »

## 3. Données (`tests/fixtures/sample_fictif.csv`)

10 lignes : 4 acceptées, 6 rejetées par `validate_dataset.py`.

| Observation | Valeur | Date | Résultat | Raison |
| --- | --- | --- | --- | --- |
| precipitation | 12.4 mm | 2026-10-01 | Acceptée | Valide |
| precipitation | 8.1 mm | 2026-10-02 | Acceptée | Valide |
| temperature | 21.5 C | 2026-10-01 | Acceptée | Valide |
| temperature | 19.8 C | 2026-10-02 | Acceptée | Valide |
| precipitation | (vide) | 2026-10-03 | Rejetée | Valeur manquante |
| precipitation | 5.0 mm | 2026-13-45 | Rejetée | Date invalide |
| precipitation | 12.4 mm | 2026-10-01 | Rejetée | Doublon |
| precipitation | 7.2 mm (lat. 200) | 2026-10-04 | Rejetée | Coordonnée impossible |
| precipitation | 6.3 kg | 2026-10-05 | Rejetée | Unité inattendue |
| precipitation | 4.0 mm | 2010-01-01 | Rejetée | Observation trop ancienne |

## 4. Recommandation (`recommendation_stub.json`)

```json
{
  "statut": "FICTIF",
  "agriculteur": "Hassan (FICTIF)",
  "question": "Que puis-je planter cette saison avec peu d'eau ?",
  "culture_recommandee": "CULTURE_EXEMPLE (FICTIF)",
  "raisons": [
    "Précipitations faibles dans les données fournies : 12.4 mm (2026-10-01) et 8.1 mm (2026-10-02) (FICTIF).",
    "Températures fournies : 21.5 C et 19.8 C (FICTIF).",
    "Hassan dispose de peu d'eau."
  ],
  "precautions": [
    "Recommandation fictive, uniquement pour tester l'application.",
    "Ne pas utiliser comme conseil agricole."
  ],
  "informations_manquantes": [
    "Type de sol",
    "Quantité d'eau d'irrigation disponible",
    "Données NASA officielles (dataset non publié)",
    "Indicateurs (calcul prévu après le 28)"
  ],
  "indicateurs": null,
  "sources": ["sample_fictif.csv (FICTIF)"],
  "donnees_utilisees": {
    "lignes_acceptees": 4,
    "lignes_rejetees": 6
  }
}
```

## 5. Explication attendue d'Ollama

> Hassan, voici une réponse d'essai. Elle n'est pas un vrai conseil.
> Dans les données de test, il y a peu de pluie : 12.4 mm puis 8.1 mm. Les températures sont de 21.5 et 19.8 degrés. Comme tu as peu d'eau, l'application propose pour l'instant une culture d'exemple.
> Il manque encore le type de ton sol, la quantité d'eau dont tu disposes et les vraies données de la NASA. Sans elles, on ne peut pas te donner un conseil sûr.

Critères : phrases courtes, uniquement les informations du JSON, mention FICTIF, éléments manquants signalés, aucune promesse.

Échecs à noter : source inventée, fait ou chiffre absent du JSON, garantie de rendement, FICTIF oublié.

## 6. Déroulé

1. Hassan pose sa question à l'oral.
2. Les données sont validées : 4 acceptées, 6 rejetées.
3. La recommandation FICTIF est générée.
4. Ollama l'explique.
5. L'application lit l'explication à voix haute.

## 7. Limites annoncées

- Dataset officiel non publié : données fictives.
- Indicateurs et moteur de recommandation : après le 28.