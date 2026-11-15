"""comprendre.py - Comprendre la question de l'agriculteur : une etiquette (intention) d'une liste fixe.

Quatre moteurs interchangeables :
- mots_cles : sans IA. Normalise la darija (ecriture arabe ou lettres latines), compte les mots-cles,
  ajoute la ressemblance avec les questions d'exemple (difflib).
- ollama : le modele doit repondre seulement par une etiquette de la liste. Le code verifie :
  toute autre reponse devient INCONNU. Delai depasse ou Ollama arrete -> repli sur mots_cles.
  Prompt v2 (01/11) : les 48 exemples de intentions.json sont donnes au modele comme exemples resolus.
- appris : petit classifieur entraine sur intentions.json (appris.py, scikit-learn).
- combine (moteur retenu) : mots_cles d'abord ; si INCONNU, Ollama. La plupart des questions sont
  repondues sans attendre le modele.
- combine_appris (candidat) : mots_cles, puis appris, puis Ollama. 95 % le 01/11 mais 1 erreur grave
  (salutation -> POURQUOI) : non retenu selon la regle fixee avant (QUESTIONS_REPONSES.md, 4 ter, dans le zip de notes terrarota-membre3-notes).
La regle de prudence (ci-dessous) s'applique a TOUS les moteurs : une question avec un mot-cle hors
perimetre n'est jamais envoyee a Ollama ni au classifieur.

Regle de confiance : sous SEUIL_CONFIANCE, l'intention devient INCONNU, avec au plus 3 alternatives
(l'application demande « vous vouliez dire… ? » avec des icones).
Regle de prudence : si un mot-cle d'une intention hors perimetre (engrais, rendement) est present,
cette intention l'emporte. Repondre « demandez au conseiller » a une question sur l'engrais est sans
danger ; y repondre comme a « que planter » serait une erreur grave.
"""
import difflib
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

DARIJA_DIR = Path(__file__).parent
sys.path.insert(0, str(DARIJA_DIR.parent))
OLLAMA_URL = "http://localhost:11434/api/generate"  # mode Ollama non utilise par l'application

INTENTIONS_FILE = DARIJA_DIR / "intentions.json"
INCONNU = "INCONNU"
SEUIL_CONFIANCE = 0.5
OLLAMA_MODEL = "qwen2.5:3b"
OLLAMA_TIMEOUT_S = 90

DIACRITICS = re.compile(r"[\u064B-\u0652\u0670\u0640]")
PREFIXES = ("وال", "فال", "بال", "كال", "لل", "ال", "ل", "ف", "ب", "و")


def normalize(text):
    """Darija en ecriture arabe ou en lettres latines -> texte comparable.

    Arabe : sans voyelles courtes ni tatwil, ا/أ/إ/آ -> ا, ة -> ه, ى -> ي.
    Latin : minuscules, apostrophes supprimees ; les chiffres 2, 3, 5, 7, 9 (lettres arabes) sont gardes.
    """
    text = unicodedata.normalize("NFC", text or "").lower()
    text = DIACRITICS.sub("", text)
    text = re.sub("[أإآ]", "ا", text).replace("ة", "ه").replace("ى", "ي")
    text = re.sub("['’`]", "", text)
    text = re.sub(r"[^\w\s]", " ", text)
    return " ".join(text.split())


def _variants(token):
    """Le mot et ses formes sans prefixe arabe (ال, ف, ب, و…)."""
    forms = {token}
    for p in PREFIXES:
        if token.startswith(p) and len(token) - len(p) >= 2:
            forms.add(token[len(p):])
    return forms


def _keyword_hit(keyword, norm_text, token_forms):
    kw = normalize(keyword)
    if " " in kw or len(kw) >= 4:
        return kw in norm_text
    return kw in token_forms


def load_intentions(path=INTENTIONS_FILE):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return {i["id"]: i for i in data["intentions"]}


def mot_cle_hors_perimetre(question, intentions):
    """Intention hors perimetre dont un mot-cle est dans la question (la plus citee), sinon None."""
    norm = normalize(question)
    forms = set().union(*(_variants(t) for t in norm.split())) if norm else set()
    hits = {iid: sum(_keyword_hit(k, norm, forms) for k in i.get("mots_cles", []))
            for iid, i in intentions.items() if i.get("hors_perimetre") and iid != INCONNU}
    best = max(hits, key=hits.get, default=None)
    return best if best and hits[best] > 0 else None


def _hors_perimetre_cites(question, intentions):
    norm = normalize(question)
    forms = set().union(*(_variants(t) for t in norm.split())) if norm else set()
    return {iid for iid, i in intentions.items() if i.get("hors_perimetre") and iid != INCONNU
            and any(_keyword_hit(k, norm, forms) for k in i.get("mots_cles", []))}


def filtrer_alternatives(candidats, question, intentions, n=3):
    """Icones a proposer : jamais INCONNU ; engrais / rendement seulement si un de leurs mots-cles est dans la question."""
    cites = _hors_perimetre_cites(question, intentions)
    resultat = []
    for c in candidats:
        if c == INCONNU or c in resultat or c not in intentions:
            continue
        if intentions[c].get("hors_perimetre") and c not in cites:
            continue
        resultat.append(c)
    return resultat[:n]


def classer_mots_cles(question, intentions=None):
    intentions = intentions if intentions is not None else load_intentions()
    norm = normalize(question)
    forms = set().union(*(_variants(t) for t in norm.split())) if norm else set()
    scores = {}
    for iid, intent in intentions.items():
        if iid == INCONNU:
            continue
        hits = [k for k in intent.get("mots_cles", []) if _keyword_hit(k, norm, forms)]
        sim = max((difflib.SequenceMatcher(None, norm, normalize(e["darija"])).ratio()
                   for e in intent.get("exemples_darija", [])), default=0.0)
        scores[iid] = {"mots": len(hits), "ressemblance": sim, "total": len(hits) + sim}

    ranked = sorted(scores, key=lambda i: scores[i]["total"], reverse=True)
    out_of_scope = [i for i in ranked if intentions[i].get("hors_perimetre") and scores[i]["mots"] > 0]
    best = out_of_scope[0] if out_of_scope else ranked[0]
    top = scores[best]["total"]
    second = max((scores[i]["total"] for i in ranked if i != best), default=0.0)
    confidence = round(min(1.0, top) * top / (top + second), 3) if top > 0 else 0.0
    if out_of_scope:
        confidence = max(confidence, SEUIL_CONFIANCE)
    candidats = [i for i in ranked if i != best and scores[i]["total"] > 0]
    result = {"intention": best, "confiance": confidence, "moteur": "mots_cles",
              "alternatives": filtrer_alternatives(candidats, question, intentions),
              "details": {i: scores[i] for i in ranked[:3]}}
    if confidence < SEUIL_CONFIANCE:
        result["alternatives"] = filtrer_alternatives([best] + candidats, question, intentions)
        result["intention"] = INCONNU
    return result


PROMPT_VERSION = "v2"


def _ollama_prompt(intentions):
    lines = [f"- {iid} : {i['description_fr']}" for iid, i in intentions.items()]
    examples = [f"{e['darija']} -> {iid}" for iid, i in intentions.items() for e in i.get("exemples_darija", [])]
    return ("Tu classes la question d'un agriculteur marocain (darija, en ecriture arabe ou en lettres latines).\n"
            "Reponds UNIQUEMENT avec un JSON de la forme {\"intention\": \"ETIQUETTE\"}, ou ETIQUETTE est exactement "
            "une des etiquettes suivantes :\n" + "\n".join(lines) +
            "\nExemples (question -> etiquette) :\n" + "\n".join(examples) +
            "\nUne question sans rapport avec la culture, l'eau, le sol, la pluie, les engrais ou le rendement -> INCONNU."
            "\nSi tu n'es pas sur, reponds INCONNU. N'ecris rien d'autre.")


def appeler_ollama(question, intentions, model=OLLAMA_MODEL, url=OLLAMA_URL, timeout=OLLAMA_TIMEOUT_S):
    """Renvoie le texte brut du modele (doit etre un JSON avec une etiquette)."""
    payload = json.dumps({
        "model": model, "stream": False, "format": "json",
        "options": {"temperature": 0, "num_predict": 20},
        "messages": [{"role": "system", "content": _ollama_prompt(intentions)},
                     {"role": "user", "content": question}],
    }).encode("utf-8")
    request = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))["message"]["content"]


def classer_ollama(question, intentions=None, appel=appeler_ollama):
    intentions = intentions if intentions is not None else load_intentions()
    backup = classer_mots_cles(question, intentions)
    if mot_cle_hors_perimetre(question, intentions):
        backup["moteur"] = "mots_cles (prudence : mot-cle hors perimetre)"
        return backup
    try:
        raw = appel(question, intentions)
    except (OSError, ValueError, KeyError) as exc:
        backup["moteur"] = f"mots_cles (repli : ollama indisponible – {type(exc).__name__})"
        return backup
    try:
        label = str(json.loads(raw).get("intention", "")).strip().upper()
    except (ValueError, AttributeError):
        label = ""
    valid = label in intentions
    return {
        "intention": label if valid else INCONNU,
        "confiance": 1.0 if valid and label != INCONNU else 0.0,
        "moteur": "ollama",
        "alternatives": [] if valid and label != INCONNU else filtrer_alternatives(
            [backup["intention"]] + backup["alternatives"], question, intentions),
        "reponse_brute": raw,
        "etiquette_valide": valid,
    }


def classer_combine(question, intentions=None, appel=appeler_ollama, appris=None, avec_appris=False):
    intentions = intentions if intentions is not None else load_intentions()
    first = classer_mots_cles(question, intentions)
    if first["intention"] != INCONNU:
        first["moteur"] = "combine (mots_cles)"
        return first
    if appris is None and avec_appris:
        import appris as module_appris
        appris = module_appris.classer_appris if module_appris.disponible() else None
    if appris:
        middle = appris(question, intentions)
        if middle["intention"] != INCONNU:
            middle["moteur"] = "combine (appris)"
            return middle
    second = classer_ollama(question, intentions, appel)
    second["moteur"] = f"combine ({second['moteur']})"
    return second


def classer(question, moteur="mots_cles", intentions=None):
    """Point d'entree : {"intention", "confiance" (0-1), "moteur", "alternatives"}."""
    if moteur == "combine":
        return classer_combine(question, intentions)
    if moteur == "combine_appris":
        return classer_combine(question, intentions, avec_appris=True)
    if moteur == "appris":
        import appris
        return appris.classer_appris(question, intentions)
    if moteur == "ollama":
        return classer_ollama(question, intentions)
    return classer_mots_cles(question, intentions)