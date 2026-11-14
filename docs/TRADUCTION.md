# Traduction des rapports avec Ollama (darija et anglais)

Le moteur écrit le rapport en **français**. Ce module le traduit en **darija** (écriture arabe) ou en **anglais**.
Le modèle **traduit, il ne décide jamais** : tous les calculs et verdicts viennent du moteur.

## Fichiers

| Fichier                               | Rôle                                                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ollama/translate.py`                 | Module de traduction : choix de la langue, appel à Ollama, contrôles de fidélité, retour au français                          |
| `ollama/termes_darija.json`           | Vocabulaire darija **de l'équipe** (validé) : il **gagne toujours** sur les deux fichiers ci-dessous                          |
| `ollama/termes_darija_base.json`      | Copie du dictionnaire d'origine : filet de sécurité si un terme ou le groupe « cultures » a été retiré du fichier de l'équipe |
| `ollama/termes_darija_a_valider.json` | **Propositions** de vocabulaire darija, à relire par un locuteur natif                                                        |
| `ollama/termes_anglais.json`          | Vocabulaire anglais (termes techniques et noms de cultures)                                                                   |
| `tests/test_traduction_fidelite.py`   | Tests de fidélité avec un faux modèle (pas besoin d'Ollama)                                                                   |
| `scripts/try_translate.py`            | Essai rapide en ligne de commande                                                                                             |

## 1. Installer Ollama

1. Télécharger et installer Ollama depuis le site officiel (ollama.com).
2. Vérifier : `ollama --version`, puis `ollama list` (modèles installés).
3. Ollama écoute par défaut sur `http://localhost:11434`.
4. Télécharger un modèle : `ollama pull <nom>` (ou `ollama run hf.co/<utilisateur>/<modèle>` pour un modèle GGUF de Hugging Face).

## 2. Choisir et documenter le modèle

Tester **plusieurs** modèles sur les mêmes rapports (`python -m scripts.try_translate darija 0`, etc.) et noter :

| Modèle (nom exact) | Version / taille | RAM / GPU nécessaire | Darija : contrôle auto | Darija : relecture humaine | Anglais : contrôle auto | Remarques |
| ------------------ | ---------------- | -------------------- | ---------------------- | -------------------------- | ----------------------- | --------- |
|                    |                  |                      |                        |                            |                         |           |

Le nom exact à copier est celui de `ollama list`. À documenter ici : nom, version, conditions d'exécution.

## 3. Configurer

Variables d'environnement (facultatives sauf le modèle) :

```bash
# Linux / Mac
export OLLAMA_MODEL="nom-exact-du-modele"
# Windows PowerShell
$env:OLLAMA_MODEL="nom-exact-du-modele"
```

Autres variables (facultatives) : `OLLAMA_URL` (défaut `http://localhost:11434/api/generate`), `OLLAMA_TIMEOUT` (secondes par requête, défaut 300),
`OLLAMA_CHUNK_CHARS` (taille maximale d'un bloc, défaut 700), `OLLAMA_VERBOSE=1` (affiche blocs, durées et tokens).

**Modèle par défaut : `llama3.2:latest`.** C'est un petit modèle généraliste : il est **très faible en Darija** (langues mélangées, mots faux).
Il sert à faire tourner le système, pas à juger la qualité. Compare avec d'autres modèles avant de conclure (voir tableau plus haut).
Si le modèle est introuvable (`ollama list`), Ollama répond 404 : la traduction est refusée et **le français est affiché**.

## 4. Utiliser

```python
from engine.report import analyze, report_to_text
from ollama.translate import translate_report

text = report_to_text(analyze(plan, parcels), with_glossary=False)
result = translate_report(text, lang="darija")      # "darija", "en" (ou "fr")
afficher(result["text"])                            # traduction, ou français si échec
# result["translated"] : True / False   |   result["reason"] : pourquoi le français a été gardé
```

`translate_report` **ne lève jamais d'erreur** et ne rappelle jamais le moteur agronomique.

## 5. Comportement de secours

| Situation                                                                           | Résultat            |
| ----------------------------------------------------------------------------------- | ------------------- |
| Ollama fonctionne et la traduction passe les contrôles                              | Traduction affichée |
| Ollama éteint ou délai dépassé (3 tentatives), modèle introuvable, réponse tronquée | Rapport français    |
| Réponse vide ou invalide                                                            | Rapport français    |
| Un contrôle de fidélité échoue (après un seul nouvel essai)                         | Rapport français    |

## 6. Contrôles de fidélité automatiques (section par section)

- Le rapport est envoyé **bloc par bloc** (700 caractères au plus ; une ligne n'est jamais coupée en deux). Chaque bloc est contrôlé séparément.
- Même nombre de lignes que le texte source, dans le même ordre.
- Nombres identiques **ligne par ligne et dans le même ordre** (attrape deux scores échangés).
- Verdicts (« viable », « en partie viable », « non viable », bon choix, à risque, à éviter) conservés. « non viable » n'est jamais accepté à la place de « viable ».
- Marqueurs conservés : Ligne, Raison, **Précaution**, Attention, Remarque, Astuce. Une précaution supprimée ou transformée est refusée.
- Noms de cultures présents sur chaque ligne.
- Libellés et nombres restent associés (résumé « bons choix / à risque / à éviter », composition par famille).
- Niveau de fiabilité (élevée / moyenne / faible) conservé : une faible fiabilité ne peut pas devenir « élevée ».
- Aucune donnée manquante ne disparaît (« Données manquantes : la pluie, le pH du sol… »).
- Aucun mot de probabilité ou de rendement ajouté (liste dans `LANGUAGES[...]["forbidden"]`).
- Consigne du prompt non recopiée dans la réponse.

**Ce que ces contrôles ne garantissent pas :** le sens complet des phrases (par exemple « idéale » devenue « acceptable »), la qualité de la Darija, ni qu'une faible fiabilité ne soit pas présentée comme une mauvaise recommandation. Il faut donc aussi une **relecture humaine** sur les 9 cas de la fiche de mission.

**Les 9 cas de la fiche et les scénarios qui les couvrent :** plan viable (`plan_equilibre`), en partie viable (`cereales_apres_cereale`), cultures déconseillées (`cereales_apres_cereale`, `forte_chaleur`), problèmes de rotation (`cereales_apres_cereale`), alternatives (lignes « À envisager à la place »), nombres et unités (tous), historique absent (`sans_historique`). **Données manquantes** et **confiance faible** ne sont dans aucun des 8 scénarios : les deux rapports de test sont construits directement dans `tests/test_traduction_fidelite.py` (parcelle avec seulement la température, ou sans pH ni salinité).

## 7. Tests

```bash
python -m pytest -q
```

Les tests utilisent un **faux modèle** (remplacement par dictionnaire) : ils prouvent que les contrôles acceptent une traduction fidèle et refusent une traduction infidèle. Ils ne mesurent **pas** la qualité d'un vrai modèle : pour cela, lancer `scripts/try_translate.py` avec Ollama et comparer le français, la darija et l'anglais.

## 8. Dictionnaire darija : ordre de chargement et validation

Les fichiers sont lus dans cet ordre, le suivant écrase le précédent : `termes_darija_base.json`, puis `termes_darija_a_valider.json`, puis `termes_darija.json`.

`termes_darija_a_valider.json` contient des propositions (verdicts, marqueurs, niveaux de fiabilité, familles de cultures…) non relues. Elles sont chargées pour que le système fonctionne, mais **doivent être validées par un locuteur natif**. Une fois relues : copier les termes corrigés dans `termes_darija.json`, puis supprimer le fichier `..._a_valider`.

## 9. Adaptation du modèle : vocabulaire de ce qui a été fait

Actuellement : **prompt + dictionnaire + contrôles**. Ce n'est **pas** un fine-tuning. Un fine-tuning exige un jeu de données de paires français / darija / anglais ; s'il est réalisé, documenter le jeu de données, la méthode, les paramètres et les résultats avant/après.
