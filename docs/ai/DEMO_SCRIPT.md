# TerraRota – Script de démo

Toutes les données et recommandations montrées sont **FICTIF**.
Durée totale : environ 3 minutes.

| N° | Qui | Écran | Durée | À dire |
| --- | --- | --- | --- | --- |
| 1 | Membre 2 | Scénario (personnage) | 30 s | « Voici Hassan, agriculteur fictif. Il a peu d'eau et ne sait pas lire. Il demande à l'oral : qu'est-ce que je peux planter cette saison avec peu d'eau ? » |
| 2 | Membre 2 | `sample_fictif.csv` | 20 s | « Voilà les données de test. Elles sont toutes fictives, car le dataset officiel n'est pas encore publié. » |
| 3 | Membre 2 | Sortie de `validate_dataset.py` | 40 s | « Le validateur accepte 4 lignes et en rejette 6 : valeur manquante, date invalide, doublon, coordonnée impossible, unité inattendue, observation trop ancienne. » |
| 4 | Membre 2 | `recommendation_stub.json` | 30 s | « Avec les données fiables, l'application produit cette recommandation. Elle est fictive et indique aussi ce qui manque. » |
| 5 | Membre 3 | Sortie du script Ollama | 40 s | « Ce JSON est envoyé à Ollama, qui l'explique simplement, sans rien inventer et en signalant ce qui manque. » |
| 6 | Membre 3 | Application ou capture | 20 s | « L'explication est lue à voix haute à Hassan. » |
| 7 | Membre 2 | — | 20 s | « Après le 28, nous adapterons le parseur au vrai dataset, puis nous calculerons les indicateurs et le moteur de recommandation. » |

## Plan B

- Ollama lent : montrer des captures de la sortie.
- Application non prête : lire l'explication à voix haute à la place de l'audio.