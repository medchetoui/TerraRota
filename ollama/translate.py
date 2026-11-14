
"""
translate.py
Traduction sécurisée des rapports agronomiques avec Ollama.

Le moteur agronomique prend toutes les décisions.
Ollama traduit uniquement le rapport existant.
Toute traduction non fidèle est rejetée.
En cas d'échec, le rapport français original est conservé.
"""

import hashlib
import json
import os
import re
import socket
import time
import urllib.error
import urllib.request

from pathlib import Path


# ============================================================
# 1. CONFIGURATION
# ============================================================

HERE = Path(__file__).resolve().parent

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434/api/generate"
)

MODEL = os.getenv(
    "OLLAMA_MODEL",
    "llama3.2:latest"
)

TIMEOUT = 300
MAX_ATTEMPTS = 3
MAX_RETRIES = MAX_ATTEMPTS
RETRY_PAUSE = 2
CHUNK_CHARS = 5000

CACHE_FILE = HERE / "cache_traductions.json"
USE_CACHE = False

LANGUAGES = {
    "darija": {
        "name": "Moroccan Darija written in Arabic script",
        "terms_files": [
            "termes_darija.json",
            "termes_darija_base.json",
            "termes_darija_a_valider.json"
        ],
        "forbidden": ["احتمال"]
    },
    "en": {
        "name": "English",
        "terms_files": ["termes_anglais.json"],
        "forbidden": ["probability"]
    }
}


# ============================================================
# 2. LABELS ET MARQUEURS
# ============================================================

# Ces collections contiennent les termes français du moteur.
# Les traductions correspondantes sont dans les dictionnaires JSON.

LABELS = {
    "Ligne",
    "Culture",
    "Adéquation au terrain",
    "Après prise en compte de la rotation",
    "Fiabilité des données",
    "Fiabilité du plan",
    "Précaution",
    "Raison",
    "Historique non renseigné",
    "Données manquantes",
    "Seuils non vérifiés",
    "Seuils pas encore validés localement",
    "bons choix",
    "à risque",
    "à éviter"
}

MARKERS = (
    "•",
    "-",
    "⚠",
    "✓",
    "✗",
    "→"
)

PAIR_LABELS = {
    "bons choix",
    "à risque",
    "à éviter"
}


# ============================================================
# 3. CULTURES DE SECOURS
# ============================================================

CROP_FALLBACK = {
    "Blé tendre": {
        "en": "Soft wheat",
        "darija": "القمح اللين"
    },
    "Blé dur": {
        "en": "Durum wheat",
        "darija": "القمح الصلب"
    },
    "Orge": {
        "en": "Barley",
        "darija": "الشعير"
    },
    "Pois chiche": {
        "en": "Chickpea",
        "darija": "الحمص"
    },
    "Fève": {
        "en": "Fava bean",
        "darija": "الفول"
    },
    "Lentille": {
        "en": "Lentil",
        "darija": "العدس"
    },
    "Oignon": {
        "en": "Onion",
        "darija": "البصلة"
    },
    "Pomme de terre": {
        "en": "Potato",
        "darija": "البطاطا"
    },
    "Olivier": {
        "en": "Olive tree",
        "darija": "الزيتون"
    },
    "Oranger": {
        "en": "Orange tree",
        "darija": "البرتقال"
    },
    "Clémentinier": {
        "en": "Clementine tree",
        "darija": "الكليمونتين"
    },
    "Câprier": {
        "en": "Caper bush",
        "darija": "الكبار"
    }
}


# ============================================================
# 4. EXCEPTIONS
# ============================================================

class FidelityError(Exception):
    """La traduction ne respecte pas le rapport original."""


class TranslationError(ValueError):
    """Erreur de communication ou de traduction Ollama."""


# ============================================================
# 5. LANGUES
# ============================================================

def language_key(lang):
    if not lang:
        return "darija"

    lang = str(lang).strip().lower()

    aliases = {
        "darija": "darija",
        "darija marocaine": "darija",
        "ar": "darija",
        "arabic": "darija",
        "arabe": "darija",
        "en": "en",
        "english": "en",
        "anglais": "en",
        "fr": "fr",
        "french": "fr",
        "français": "fr",
        "francais": "fr"
    }

    return aliases.get(lang, lang)


def language_name(lang):
    lang = language_key(lang)

    return LANGUAGES.get(
        lang,
        {"name": "French"}
    )["name"]


# ============================================================
# 6. CHARGEMENT DES FICHIERS JSON
# ============================================================

def _read_json(path):
    with open(
        Path(path),
        "r",
        encoding="utf-8-sig"
    ) as file:
        return json.load(file)


def _normalize_group(data):
    if not isinstance(data, dict):
        return {}

    result = {}

    known_groups = {
        "termes",
        "cultures",
        "labels",
        "marqueurs"
    }

    for key, value in data.items():
        if key in known_groups and isinstance(value, dict):
            result[key] = dict(value)

    flat = {}

    for key, value in data.items():
        if (
            key not in known_groups
            and key != "_commentaire"
            and isinstance(value, str)
        ):
            flat[key] = value

    if flat:
        result.setdefault("termes", {})
        result["termes"].update(flat)

    return result


def load_terms(lang="darija", terms_file=None):
    """
    Fusionne les dictionnaires.

    Priorité :
    1. Dictionnaire d'équipe, s'il existe.
    2. Dictionnaire de base.
    3. Dictionnaire de propositions.

    Le dictionnaire d'équipe est facultatif.
    """

    if isinstance(lang, (list, tuple)):
        paths = list(lang)

    elif terms_file is not None:
        paths = (
            list(terms_file)
            if isinstance(terms_file, (list, tuple))
            else [terms_file]
        )

    elif (
        isinstance(lang, (str, Path))
        and Path(str(lang)).suffix.lower() == ".json"
    ):
        paths = [lang]

    else:
        key = language_key(lang)

        if key not in LANGUAGES:
            return {}

        paths = [
            HERE / filename
            for filename in LANGUAGES[key]["terms_files"]
        ]

    result = {}

    for path in paths:
        path = Path(path)

        if not path.is_absolute():
            path = HERE / path

        if not path.exists():
            continue

        try:
            data = _normalize_group(_read_json(path))
        except (OSError, json.JSONDecodeError):
            continue

        for group_name, group_values in data.items():
            if not isinstance(group_values, dict):
                continue

            result.setdefault(group_name, {})

            for source, target in group_values.items():
                # Le premier fichier rencontré est prioritaire.
                if source not in result[group_name]:
                    result[group_name][source] = target

    return result


def flat_terms(data):
    if not isinstance(data, dict):
        return {}

    result = {}

    if isinstance(data.get("termes"), dict):
        result.update(data["termes"])

    for group_name, values in data.items():
        if group_name in ("termes", "cultures"):
            continue

        if isinstance(values, dict):
            for key, value in values.items():
                result.setdefault(key, value)

    return result


def flatten_terms(data):
    return flat_terms(data)


def get_cultures(data):
    if not isinstance(data, dict):
        return {}

    cultures = data.get("cultures", {})

    return cultures if isinstance(cultures, dict) else {}


def format_terms(data):
    terms = flat_terms(data)

    if not terms:
        return "No specific terminology dictionary."

    return "\n".join(
        f"- {source} = {target}"
        for source, target in terms.items()
    )


# ============================================================
# 7. CULTURES
# ============================================================

def load_crop_names():
    try:
        from engine.config import load_crops

        crops = load_crops()

        if isinstance(crops, dict):
            return list(crops.keys())

        if isinstance(crops, list):
            result = []

            for crop in crops:
                if isinstance(crop, str):
                    result.append(crop)

                elif isinstance(crop, dict):
                    name = (
                        crop.get("nom")
                        or crop.get("name")
                        or crop.get("culture")
                    )

                    if name:
                        result.append(name)

            return result

    except Exception:
        pass

    return list(CROP_FALLBACK.keys())


def get_crop_dictionary(lang, groups=None):
    lang = language_key(lang)

    if groups is None:
        groups = load_terms(lang)

    result = {}
    stored_crops = get_cultures(groups)

    for crop in load_crop_names():
        if crop in stored_crops:
            result[crop] = stored_crops[crop]

        elif crop in CROP_FALLBACK:
            result[crop] = CROP_FALLBACK[crop].get(lang, crop)

    for crop, translated in stored_crops.items():
        result.setdefault(crop, translated)

    return result


def format_crops(lang, groups=None):
    crops = get_crop_dictionary(lang, groups)

    if not crops:
        return "No crop names available."

    return "\n".join(
        f"- {source} = {target}"
        for source, target in crops.items()
    )


# ============================================================
# 8. NOMBRES ET CHIFFRES ARABES
# ============================================================

ARABIC_DIGITS = str.maketrans(
    "٠١٢٣٤٥٦٧٨٩",
    "0123456789"
)

PERSIAN_DIGITS = str.maketrans(
    "۰۱۲۳۴۵۶۷۸۹",
    "0123456789"
)

NUMBER_PATTERN = re.compile(
    r"(?<![\w])[-+]?\d+(?:[.,]\d+)?"
)


def normalize_digits(text):
    if not isinstance(text, str):
        return ""

    return text.translate(
        ARABIC_DIGITS
    ).translate(
        PERSIAN_DIGITS
    )


def extract_numbers(text):
    text = normalize_digits(text or "")
    return NUMBER_PATTERN.findall(text)


def _number_sequence(text):
    """
    Extrait les nombres dans leur ordre d'apparition.

    Les chiffres arabes sont convertis en chiffres latins.
    Les virgules décimales sont normalisées en points.

    Exemple :
    5.5 == 5,5
    87 == ٨٧
    """

    text = normalize_digits(text or "")

    numbers = NUMBER_PATTERN.findall(text)

    return [
        number.replace(",", ".")
        for number in numbers
    ]


def numbers_preserved(original, translated):
    return (
        _number_sequence(original)
        == _number_sequence(translated)
    )


def validate_translation(original, translated):
    if not isinstance(translated, str) or not translated.strip():
        raise FidelityError("La traduction est vide.")

    if not numbers_preserved(original, translated):
        raise FidelityError(
            "Les nombres ou leur ordre ont été modifiés."
        )

    return True


# ============================================================
# 9. RECONNAISSANCE DES LABELS
# ============================================================

def _contains(text, phrase):
    if not text or not phrase:
        return False

    pattern = (
        r"(?<![\w])"
        + re.escape(str(phrase))
        + r"(?![\w])"
    )

    return bool(
        re.search(
            pattern,
            text,
            flags=re.IGNORECASE
        )
    )


def _labels_in(text, mapping):
    found = set()

    if not isinstance(mapping, dict):
        return found

    for source, translated in mapping.items():
        if isinstance(translated, str) and _contains(text, translated):
            found.add(source)

    return found


def _source_target(source, target, dictionary):
    for french, translated in dictionary.items():
        if _contains(source, french):
            if not _contains(target, translated):
                return french, translated

    return None


# ============================================================
# 10. STRUCTURE DU RAPPORT
# ============================================================

def split_sections(text):
    """
    Sépare les sections sans supprimer les caractères du texte.

    La concaténation des sections restitue le texte original.
    """

    if not text:
        return []

    sections = re.split(
        r"(?m)(?=^=== )",
        text
    )

    return [
        section
        for section in sections
        if section
    ]


# ============================================================
# 11. ASSOCIATION DES LABELS ET DES VALEURS
# ============================================================

def _values_after_label(text, label):
    text = normalize_digits(text or "")

    patterns = [
        re.escape(label)
        + r".{0,80}?([-+]?\d+(?:[.,]\d+)?\s*%?)",

        r"([-+]?\d+(?:[.,]\d+)?\s*%?).{0,80}?"
        + re.escape(label)
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE
        )

        if match:
            number = re.search(
                NUMBER_PATTERN,
                match.group(1)
            )

            if number:
                return number.group(0).replace(",", ".")

    return None


def _same_label_value(text, label, expected):
    if not expected:
        return True

    actual = _values_after_label(text, label)
    expected_number = re.search(NUMBER_PATTERN, expected)

    return (
        actual is not None
        and expected_number is not None
        and actual == expected_number.group(0).replace(",", ".")
    )


def _check_association(source, target, source_label, target_label):
    expected = _values_after_label(source, source_label)

    if not expected:
        return True

    actual = _values_after_label(target, target_label)

    if actual == expected:
        return True

    return _natural_count_association(
        target,
        target_label,
        expected
    )


def _natural_count_association(text, label, expected):
    """
    Accepte notamment :
    1 good choice
    0 at risk
    1 to avoid

    et les formulations classiques :
    good choices: 1
    """

    if not label or not expected:
        return False

    normalized = normalize_digits(text).lower()
    label = label.lower()

    expected = expected.replace(",", ".")

    number_first = re.search(
        r"(?<!\d)"
        + re.escape(expected)
        + r"\s+"
        + re.escape(label.rstrip("s"))
        + r"s?(?!\w)",
        normalized
    )

    label_first = re.search(
        re.escape(label)
        + r".{0,35}?"
        + re.escape(expected)
        + r"(?!\d)",
        normalized
    )

    return bool(number_first or label_first)


# ============================================================
# 12. GLOSSAIRE AGRONOMIQUE FIXE
# ============================================================

def _load_engine_glossary():
    """
    Récupère le glossaire défini par le moteur.
    Le module de traduction ne modifie jamais le moteur.
    """

    try:
        from engine.explain import GLOSSARY

        if isinstance(GLOSSARY, (str, dict, list, tuple)):
            return GLOSSARY

    except Exception:
        pass

    return {}


def _format_engine_glossary():
    glossary = _load_engine_glossary()

    # Certains projets définissent le glossaire comme une chaîne
    # déjà formatée. On conserve son contenu exact.
    if isinstance(glossary, str):
        return glossary

    if isinstance(glossary, dict):
        lines = ["Définitions à respecter :"]

        for term, definition in glossary.items():
            lines.append(f"- {term} : {definition}")

    elif isinstance(glossary, (list, tuple)):
        lines = ["Définitions à respecter :"]

        for item in glossary:
            lines.append(f"- {item}")

    else:
        lines = []

    lines.append(
        "- Tous les nombres doivent être recopiés tels quels, "
        "sans arrondi ni changement."
    )

    return "\n".join(lines)


# ============================================================
# 13. FIDÉLITÉ TERMINOLOGIQUE
# ============================================================
def check_fidelity(source, target, groups, forbidden=None):
    problems = []

    if not isinstance(target, str) or not target.strip():
        return ["Traduction vide."]

    if not numbers_preserved(source, target):
        problems.append("Nombres ou ordre des nombres modifiés.")

    # --- DÉTECTION DES FUITES DE PROMPT ---
    prompt_leaks = [
        "Texte à traduire :", "Table de termes :", 
        "FIXED RULES:", "TERMINOLOGY TABLE:", "Return only the translated report"
    ]
    for leak in prompt_leaks:
        if _contains(target, leak):
            problems.append("Instructions du prompt présentes dans la réponse.")
            break

    for word in forbidden or []:
        if _contains(target, word):
            problems.append(f"Terme interdit détecté : {word}")

    dictionary = flat_terms(groups)
    cultures = get_cultures(groups)

    # --- VÉRIFICATION DES CULTURES (tolérante) ---
    crop_dictionary = dict(cultures)
    for crop, translation in CROP_FALLBACK.items():
        crop_dictionary.setdefault(crop, translation.get("en", crop))

    for crop, translated_crop in crop_dictionary.items():
        if not _contains(source, crop):
            continue
        if isinstance(translated_crop, str) and translated_crop:
            if not _contains(target, translated_crop):
                # On accepte si la culture est présente en français ou en anglais
                if not _contains(target, crop):
                    problems.append(f"Culture manquante ou modifiée : {crop}")

    # --- VÉRIFICATION DES TERMES CRITIQUES (tolérante) ---
    critical_terms = [
        "Précaution", "Raison", "Ligne",
        "Historique non renseigné", "Données manquantes",
        "La température", "La pluie", "Le pH du sol", "La salinité du sol",
        "Seuils non vérifiés", "Seuils pas encore validés localement"
    ]

    for term in critical_terms:
        if _contains(source, term):
            # On cherche la traduction OU le mot français
            translated_term = dictionary.get(term)
            if translated_term and not _contains(target, translated_term):
                if not _contains(target, term):
                    # On vérifie aussi si le modèle a utilisé une variante (ex: "Temperature" au lieu de "La température")
                    # On accepte si le mot-clé principal est présent
                    keyword = term.split()[-1]  # "température", "pluie", "pH", "salinité", etc.
                    if not _contains(target, keyword):
                        problems.append(f"Terme important manquant : {term}")

    # --- VÉRIFICATION DES VERDICTS (tolérante) ---
    verdicts = [
        "non viable", "en partie viable", 
        "acceptable, avec une réserve", "non évaluable", "viable"
    ]
    for verdict in verdicts:
        if _contains(source, verdict):
            translated_verdict = dictionary.get(verdict)
            if translated_verdict and not _contains(target, translated_verdict):
                if not _contains(target, verdict):
                    # On accepte si le mot principal du verdict est présent
                    keyword = verdict.split()[-1]  # "viable", "évaluable", "réserve"
                    if not _contains(target, keyword):
                        problems.append(f"Verdict modifié ou absent : {verdict}")

    # --- VÉRIFICATION DE LA FIABILITÉ ---
    for term in ["faible", "moyenne", "élevée"]:
        if _contains(source, term):
            translated_term = dictionary.get(term)
            if translated_term and not _contains(target, translated_term):
                if not _contains(target, term):
                    problems.append(f"Fiabilité modifiée : {term}")

    # --- VÉRIFICATION DES SCORES ASSOCIÉS (tolérante) ---
    score_labels = [
        "Fiabilité des données", "Fiabilité du plan", "Adéquation au terrain"
    ]
    for label in score_labels:
        translated_label = dictionary.get(label)
        if translated_label and _contains(source, label):
            # On vérifie que le nombre est présent, sans exiger la traduction exacte
            expected = _values_after_label(source, label)
            if expected:
                if not _contains(target, expected):
                    problems.append(f"Score non trouvé pour {label}.")

    # --- VÉRIFICATION DES COMPTES DU RÉSUMÉ (tolérante) ---
    count_labels = ["bons choix", "à risque", "à éviter"]
    for label in count_labels:
        translated_label = dictionary.get(label)
        if translated_label and _contains(source, label):
            expected = _values_after_label(source, label)
            if expected:
                if not _contains(target, expected):
                    problems.append(f"Nombre non trouvé pour {label}.")

    return list(dict.fromkeys(problems))

# ============================================================
# 14. PROMPT
# ============================================================

PROMPT = """
You are a professional agricultural report translator.

TARGET LANGUAGE:
{language}

FIXED RULES:
- Translate only the supplied report.
- Never make agricultural decisions.
- Never change recommendations or scores.
- Preserve every number, percentage, date and unit.
- Preserve the association between each label and its value.
- Preserve the verdict and confidence level.
- Preserve missing-data warnings and precautions.
- Never invent information.
- Never summarize or shorten the report.
- Preserve all information and its order.
- Return only the translated report.
- Do not add explanations, comments or advice.

GLOSSARY:
{glossary}

FIXED CROP NAMES:
{crops}

TERMINOLOGY TABLE:
{terms}

STYLE:
Use natural, clear agricultural language.
For Darija, use Moroccan Darija in Arabic script.
Do not use formal classical Arabic unnecessarily.

Texte à traduire :
{text}
"""


def build_prompt(text, lang, terms_data):
    lang = language_key(lang)
    dictionary = flat_terms(terms_data)

    relevant_terms = {
        key: value
        for key, value in dictionary.items()
        if _contains(text, key)
    }

    glossary = _format_engine_glossary()

    terms = format_terms({
        "termes": relevant_terms
    })

    return PROMPT.format(
        language=language_name(lang),
        glossary=glossary,
        crops=format_crops(lang, terms_data),
        terms=terms,
        text=text
    )


# ============================================================
# 15. DÉCOUPAGE EN BLOCS
# ============================================================

def _split_long_line(line, max_chars):
    if len(line) <= max_chars:
        return [line]

    sentences = re.split(
        r"(?<=[.!?])\s+",
        line
    )

    chunks = []
    current = ""

    for sentence in sentences:
        if not sentence:
            continue

        candidate = (
            current + " " + sentence
            if current else sentence
        )

        if len(candidate) <= max_chars:
            current = candidate
            continue

        if current:
            chunks.append(current)
            current = ""

        if len(sentence) <= max_chars:
            current = sentence
            continue

        words = sentence.split(" ")
        word_chunk = ""

        for word in words:
            candidate = (
                word_chunk + " " + word
                if word_chunk else word
            )

            if len(candidate) <= max_chars:
                word_chunk = candidate
            else:
                if word_chunk:
                    chunks.append(word_chunk)

                if len(word) <= max_chars:
                    word_chunk = word
                else:
                    for start in range(0, len(word), max_chars):
                        chunks.append(
                            word[start:start + max_chars]
                        )

                    word_chunk = ""

        if word_chunk:
            chunks.append(word_chunk)

    if current:
        chunks.append(current)

    return chunks


def split_into_chunks(text, max_chars=None):
    if not text:
        return []

    if max_chars is None:
        max_chars = CHUNK_CHARS

    if max_chars <= 0:
        raise ValueError("max_chars doit être positif.")

    lines = text.splitlines()

    chunks = []
    current = []

    def flush():
        nonlocal current

        if current:
            chunks.append("\n".join(current))
            current = []

    for line in lines:
        if len(line) > max_chars:
            flush()
            chunks.extend(
                _split_long_line(line, max_chars)
            )
            continue

        current_text = "\n".join(current)

        if current and (
            len(current_text) + 1 + len(line) > max_chars
        ):
            flush()

        current.append(line)

    flush()

    return chunks


# ============================================================
# 16. LIGNES ENVELOPPÉES
# ============================================================

def _merge_wrapped_lines(source, wrapped):
    source_lines = source.splitlines()
    wrapped_lines = wrapped.splitlines()

    if len(source_lines) != 1:
        return wrapped

    if len(wrapped_lines) <= 1:
        return wrapped

    new_content_pattern = (
        r"^\s*(?:"
        r"[-•*]"
        r"|(?:Tip|Note|Warning|Precaution|Advice|"
        r"Astuce|Précaution|Attention|Remarque)\s*:"
        r"|==="
        r")"
    )

    for line in wrapped_lines[1:]:
        if re.match(
            new_content_pattern,
            line,
            flags=re.IGNORECASE
        ):
            return wrapped

    return " ".join(
        line.strip()
        for line in wrapped_lines
        if line.strip()
    )


# ============================================================
# 17. CACHE
# ============================================================

def _cache_key(lang, text, terms):
    payload = {
        "model": MODEL,
        "language": language_key(lang),
        "text": text,
        "terms": terms
    }

    serialized = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        default=str
    )

    return hashlib.sha256(
        serialized.encode("utf-8")
    ).hexdigest()


def _read_cache():
    if not CACHE_FILE.exists():
        return {}

    try:
        data = _read_json(CACHE_FILE)

        return data if isinstance(data, dict) else {}

    except Exception:
        return {}


def _write_cache(cache):
    try:
        with open(
            CACHE_FILE,
            "w",
            encoding="utf-8"
        ) as file:
            json.dump(
                cache,
                file,
                ensure_ascii=False,
                indent=2
            )

    except Exception:
        pass


# ============================================================
# 18. COMMUNICATION AVEC OLLAMA
# ============================================================

def ask(prompt):
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0,
            "num_predict": 4096
        }
    }

    body = json.dumps(
        payload,
        ensure_ascii=False
    ).encode("utf-8")

    last_error = None

    for attempt in range(MAX_ATTEMPTS):
        try:
            request = urllib.request.Request(
                OLLAMA_URL,
                data=body,
                headers={
                    "Content-Type": "application/json"
                },
                method="POST"
            )

            with urllib.request.urlopen(
                request,
                timeout=TIMEOUT
            ) as response:
                raw = response.read().decode("utf-8")

            try:
                result = json.loads(raw)
            except json.JSONDecodeError as error:
                raise TranslationError(
                    "Réponse Ollama invalide : JSON incorrect."
                ) from error

            if not isinstance(result, dict):
                raise TranslationError(
                    "Réponse Ollama invalide."
                )

            if result.get("done_reason") == "length":
                raise TranslationError(
                    "La traduction Ollama est tronquée."
                )

            translated = result.get("response")

            if not isinstance(translated, str):
                raise TranslationError(
                    "Réponse Ollama invalide : champ response absent."
                )

            translated = translated.strip()

            if not translated:
                raise TranslationError(
                    "Réponse Ollama vide ou invalide."
                )

            translated = re.sub(
                r"^(?:Here is the translated text|"
                r"Here is the translation|"
                r"Translation|"
                r"Voici la traduction)\s*:\s*",
                "",
                translated,
                flags=re.IGNORECASE
            )

            return translated.strip()

        except urllib.error.HTTPError as error:
            last_error = error

            if error.code == 404:
                raise TranslationError(
                    f"Ollama : erreur HTTP 404. "
                    f"Modèle introuvable : {MODEL}"
                ) from error

        except TranslationError as error:
            last_error = error

        except (
            urllib.error.URLError,
            TimeoutError,
            socket.timeout,
            ConnectionError,
            OSError
        ) as error:
            last_error = error

        except Exception as error:
            last_error = error

        if attempt < MAX_ATTEMPTS - 1:
            time.sleep(RETRY_PAUSE)

    raise TranslationError(
        f"Ollama indisponible après {MAX_ATTEMPTS} tentatives : "
        f"{last_error}"
    )


# ============================================================
# 19. TRADUCTION D'UN BLOC AVEC CONTRÔLES STRICTS
# ============================================================

def _translate_block(chunk, lang, terms_data):
    forbidden = LANGUAGES[lang]["forbidden"]
    last_error = None

    for attempt in range(MAX_ATTEMPTS):
        try:
            prompt = build_prompt(
                chunk,
                lang,
                terms_data
            )

            if attempt > 0:
                prompt += (
                    "\n\nIMPORTANT: Your previous translation "
                    "failed the fidelity checks. Translate again "
                    "and preserve every number, label, verdict, "
                    "precaution and recommendation exactly. "
                    "Do not add or remove any information."
                )

            translated = ask(prompt)

            translated = _merge_wrapped_lines(
                chunk,
                translated
            )

            validate_translation(
                chunk,
                translated
            )

            problems = check_fidelity(
                chunk,
                translated,
                terms_data,
                forbidden
            )

            if problems:
                raise FidelityError("; ".join(problems))

            return translated

        except (FidelityError, TranslationError) as error:
            last_error = error

            if attempt < MAX_ATTEMPTS - 1:
                time.sleep(RETRY_PAUSE)

    raise TranslationError(
        f"Échec après {MAX_ATTEMPTS} tentatives : {last_error}"
    )


# ============================================================
# 20. TRADUCTION SIMPLE
# ============================================================

def translate(text, lang="darija", terms_file=None):
    """
    Traduction simple utilisée notamment pour les tests.

    Cette fonction vérifie la conservation des nombres.
    La vérification agronomique complète est appliquée par
    translate_report(), qui constitue l'interface sécurisée.
    """

    if not isinstance(text, str):
        raise TypeError(
            "Le rapport doit être une chaîne de caractères."
        )

    if not text.strip():
        return ""

    lang = language_key(lang)

    if lang == "fr":
        return text

    if lang not in LANGUAGES:
        raise ValueError(
            f"Langue non supportée : {lang}"
        )

    if not MODEL or MODEL.strip().lower() in (
        "à choisir",
        "a choisir",
        "none",
        "null"
    ):
        raise TranslationError(
            "Modèle Ollama non configuré."
        )

    terms_data = load_terms(
        lang,
        terms_file
    )

    chunks = split_into_chunks(
        text,
        CHUNK_CHARS
    )

    translated_chunks = []

    for chunk in chunks:
        last_error = None

        for attempt in range(2):
            try:
                prompt = build_prompt(
                    chunk,
                    lang,
                    terms_data
                )

                if attempt > 0:
                    prompt += (
                        "\n\nIMPORTANT: Preserve every number "
                        "and its order exactly. Correct the "
                        "previous translation."
                    )

                translated = ask(prompt)

                translated = _merge_wrapped_lines(
                    chunk,
                    translated
                )

                validate_translation(
                    chunk,
                    translated
                )

                translated_chunks.append(translated)
                last_error = None
                break

            except (FidelityError, TranslationError) as error:
                last_error = error

                if attempt < MAX_ATTEMPTS - 1:
                    time.sleep(RETRY_PAUSE)

        if last_error is not None:
            raise TranslationError(
                f"Échec de traduction : {last_error}"
            )

    return "\n".join(translated_chunks)


# ============================================================
# 21. TRADUCTION SÉCURISÉE AVEC CACHE
# ============================================================

def _translate_report_core(text, lang, terms_file=None):
    terms_data = load_terms(
        lang,
        terms_file
    )

    sections = split_sections(text)

    if not sections:
        sections = [text]

    translated_sections = []

    cache = _read_cache() if USE_CACHE else {}

    total_sections = len(sections)

    for section_index, section in enumerate(
        sections,
        start=1
    ):
        chunks = split_into_chunks(
            section,
            CHUNK_CHARS
        )

        translated_chunks = []
        total_blocks = len(chunks)

        for block_index, chunk in enumerate(
            chunks,
            start=1
        ):
            key = _cache_key(
                lang,
                chunk,
                terms_data
            )

            translated = None

            if USE_CACHE and key in cache:
                candidate = cache[key]

                try:
                    validate_translation(
                        chunk,
                        candidate
                    )

                    problems = check_fidelity(
                        chunk,
                        candidate,
                        terms_data,
                        LANGUAGES[lang]["forbidden"]
                    )

                    if not problems:
                        translated = candidate

                except Exception:
                    translated = None

            if translated is None:
                try:
                    translated = _translate_block(
                        chunk,
                        lang,
                        terms_data
                    )

                except Exception as error:
                    raise TranslationError(
                        f"section {section_index}/{total_sections}, "
                        f"bloc {block_index}/{total_blocks} : {error}"
                    ) from error

                if USE_CACHE:
                    cache[key] = translated
                    _write_cache(cache)

            translated_chunks.append(translated)

        translated_sections.append(
            "\n".join(translated_chunks)
        )

    return "\n".join(translated_sections)


# ============================================================
# 22. TRADUCTION SÉCURISÉE PUBLIQUE
# ============================================================

def translate_report(text, lang="darija", terms_file=None):
    if not isinstance(text, str):
        return {
            "text": text,
            "lang": "fr",
            "requested_lang": language_key(lang),
            "translated": False,
            "reason": "Le rapport fourni est invalide.",
            "model": MODEL
        }

    requested_lang = language_key(lang)

    if requested_lang == "fr":
        return {
            "text": text,
            "lang": "fr",
            "requested_lang": "fr",
            "translated": False,
            "reason": "Le rapport est déjà en français.",
            "model": None
        }

    if requested_lang not in LANGUAGES:
        return {
            "text": text,
            "lang": "fr",
            "requested_lang": requested_lang,
            "translated": False,
            "reason": "Langue non prise en charge.",
            "model": None
        }

    if not MODEL or MODEL.strip().lower() in (
        "à choisir",
        "a choisir",
        "none",
        "null"
    ):
        return {
            "text": text,
            "lang": "fr",
            "requested_lang": requested_lang,
            "translated": False,
            "reason": "Modèle Ollama non configuré.",
            "model": MODEL
        }

    try:
        translated_text = _translate_report_core(
            text,
            requested_lang,
            terms_file
        )

        validate_translation(
            text,
            translated_text
        )

        terms_data = load_terms(
            requested_lang,
            terms_file
        )

        problems = check_fidelity(
            text,
            translated_text,
            terms_data,
            LANGUAGES[requested_lang]["forbidden"]
        )

        if problems:
            raise FidelityError("; ".join(problems))

        return {
            "text": translated_text,
            "lang": requested_lang,
            "requested_lang": requested_lang,
            "translated": True,
            "reason": None,
            "model": MODEL
        }

    except Exception as error:
        return {
            "text": text,
            "lang": "fr",
            "requested_lang": requested_lang,
            "translated": False,
            "reason": str(error),
            "model": MODEL
        }


# ============================================================
# 23. COMPATIBILITÉ
# ============================================================

def translate_report_text(text, lang="darija"):
    return translate_report(
        text,
        lang
    )["text"]
