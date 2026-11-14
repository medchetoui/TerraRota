# 🌍 Terrarota Data - Module de Traduction Agricole (Darija & Anglais)

Ce module fait partie du projet **Terrarota Data** (NASA Space Apps 2026). Il permet de traduire les rapports générés par le moteur de recommandation agricole (initialement en français) vers deux langues cibles :
- **Darija marocaine** (écriture arabe).
- **Anglais**.

**Principe fondamental :** Le moteur agricole reste le seul responsable des calculs et des décisions. Le module de traduction ne modifie **jamais** les scores, les verdicts ou les noms de cultures. En cas d'échec, le rapport français original est conservé.

---

## 🏗️ Architecture

Le projet propose deux approches complémentaires :

1. **Approche Déterministe (Recommandée)** : Basée sur des règles et des dictionnaires. C'est la méthode la plus fiable, instantanée, et garantit une fidélité de 100 % aux données du moteur.
2. **Approche par IA (Ollama)** : Utilise des modèles de langage locaux (ex: `llama3.2`). Conservée en secours pour les phrases libres ou imprévues. Un contrôle de fidélité strict rejette les traductions erronées.

### Structure des fichiers

| Fichier | Rôle |
| :--- | :--- |
| `ollama/rules_translate.py` | **Moteur principal** de traduction déterministe (Darija & Anglais). |
| `ollama/phrases_darija.json` | Dictionnaire des phrases types en Darija. |
| `ollama/phrases_anglais.json` | Dictionnaire des phrases types en Anglais. |
| `ollama/termes_darija_base.json` | Vocabulaire agricole (cultures, termes techniques) en Darija. |
| `ollama/termes_anglais.json` | Vocabulaire agricole en Anglais. |
| `ollama/translate.py` | Module de traduction via Ollama (IA), avec fallback. |
| `scripts/try_rules.py` | Script de test et de démonstration pour l'approche par règles. |
| `scripts/try_translate.py` | Script de test pour l'approche IA (Ollama). |

---

## 🚀 Utilisation

### Prérequis
- Python 3.10+
- (Optionnel) [Ollama](https://ollama.com/) installé et lancé pour l'approche IA.

### Test de l'approche par règles (Déterministe)

```bash
# Traduire un scénario en Anglais
python -m scripts.try_rules 0 en

# Traduire un scénario en Darija
python -m scripts.try_rules 0 darija
