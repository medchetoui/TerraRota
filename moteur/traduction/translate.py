import json
import re
import urllib.request
from collections import Counter
from pathlib import Path

from engine.explain import GLOSSARY

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "à choisir"           # remplace par le nom exact du modèle (ollama list)
TERMS_FILE = Path(__file__).resolve().parent / "termes_darija.json"

PROMPT = """Tu reformules en {lang} un texte technique en français produit par un moteur de
recommandation agricole.
Règles :
1. Tu ne décides rien : tu ne changes ni les cultures, ni les scores, ni les verdicts.
2. Tous les nombres, unités (°C, mm, dS/m, %) et noms de cultures sont recopiés tels quels.
   Écris les chiffres en chiffres occidentaux (0-9).
3. Garde l'ordre des sections et des lignes. Les marqueurs (=== ... ===, Ligne N, Raison,
   Précaution, Astuce, Remarque, Attention) sont traduits mais gardent leur rôle.
4. Pour les mots techniques, utilise EXACTEMENT la table de termes fournie.
5. Phrases courtes et simples : le texte sera écouté en audio.
6. N'ajoute aucun conseil, aucune culture, aucune information absente du texte source.
   Si une section est absente, ne l'invente pas.

Définitions (consignes pour toi, à ne pas traduire ni lire) :
{glossary}

Table de termes :
{terms}

Texte à traduire :
{text}
"""

ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩٫", "0123456789.")


def numbers(text):
    text = text.translate(ARABIC_DIGITS).replace(",", ".")
    return Counter(re.findall(r"\d+(?:\.\d+)?", text))


def numbers_preserved(french, translated):
    return not (numbers(french) - numbers(translated))      # aucun nombre ne manque


def ask(prompt, temperature=0):
    body = json.dumps({"model": MODEL, "prompt": prompt, "stream": False,
                       "options": {"temperature": temperature, "num_ctx": 4096}}).encode("utf-8")
    req = urllib.request.Request(OLLAMA_URL, data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())["response"].strip()


def split_sections(text):
    return [p for p in re.split(r"(?m)^(?==== )", text) if p.strip()]


def translate(text, lang="darija marocaine (écriture arabe)", terms_file=TERMS_FILE):
    with open(terms_file, encoding="utf-8") as f:
        terms = json.dumps(json.load(f), ensure_ascii=False)
    out = []
    for section in split_sections(text):
        prompt = PROMPT.format(lang=lang, glossary=GLOSSARY, terms=terms, text=section)
        result = ask(prompt)
        if not numbers_preserved(section, result):          # un seul nouvel essai
            result = ask(prompt + "\nATTENTION : recopie tous les nombres du texte source.",
                         temperature=0.3)
            if not numbers_preserved(section, result):
                raise ValueError("nombres perdus dans la traduction")
        out.append(result)
    return "\n\n".join(out)