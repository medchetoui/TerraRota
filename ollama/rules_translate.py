
"""rules_translate.py - Traduction déterministe basée sur des règles et des dictionnaires."""

import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent


# ============================================================
# 1. CHARGEMENT DES FICHIERS JSON
# ============================================================

def load_json(filename):
    """Charge un fichier JSON situé dans le dossier ollama."""
    path = HERE / filename

    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_phrases(lang):
    """Charge les modèles de phrases selon la langue."""
    if lang == "en":
        return load_json("phrases_anglais.json")

    if lang == "darija":
        return load_json("phrases_darija.json")

    raise ValueError("Langue non supportée : utilisez 'darija' ou 'en'.")


def get_termes(lang):
    """Charge le dictionnaire de traduction selon la langue."""
    if lang == "en":
        return load_json("termes_anglais.json")

    if lang == "darija":
        return load_json("termes_darija_base.json")

    raise ValueError("Langue non supportée : utilisez 'darija' ou 'en'.")


# ============================================================
# 2. DICTIONNAIRE DES CULTURES
# ============================================================

def get_cultures(lang):
    """Récupère les noms des cultures et ajoute les formes courtes."""

    termes_data = get_termes(lang)
    cultures = termes_data.get("cultures", {}).copy()

    if lang == "en":
        cultures.update({
            "blé": "wheat",
            "orge": "barley",
        })
    else:
        cultures.update({
            "blé": "القمح",
            "orge": "الشعير",
        })

    return cultures


def traduire_culture(nom_culture, lang):
    """Traduit un nom de culture sans modifier les autres valeurs."""

    cultures = get_cultures(lang)
    nom = nom_culture.strip()

    for nom_fr, nom_traduit in cultures.items():
        if nom_fr.casefold() == nom.casefold():
            return nom_traduit

    return nom_culture


# ============================================================
# 3. CONSTRUCTION DU DICTIONNAIRE COMPLET
# ============================================================

def get_dictionnaire(lang):
    """Fusionne les termes généraux et les noms des cultures."""

    termes_data = get_termes(lang)
    dictionnaire = {}

    for valeurs in termes_data.values():
        if isinstance(valeurs, dict):
            dictionnaire.update(valeurs)

    dictionnaire.update(get_cultures(lang))

    return dictionnaire


# ============================================================
# 4. REMPLACEMENT DES TERMES
# ============================================================

def apply_dico(text, dico_termes):
    """
    Remplace les expressions françaises par leurs traductions.

    Les expressions les plus longues sont traitées en premier.
    La recherche ne distingue pas les majuscules et minuscules.
    Les mots ne sont pas remplacés à l'intérieur d'autres mots.
    """

    termes_tries = sorted(
        dico_termes.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    )

    for terme_fr, terme_cible in termes_tries:

        if not terme_fr:
            continue

        pattern = r"(?<!\w)" + re.escape(terme_fr) + r"(?!\w)"

        text = re.sub(
            pattern,
            lambda match: terme_cible,
            text,
            flags=re.IGNORECASE,
        )

    return text


# ============================================================
# 5. RECONNAISSANCE DES MODÈLES DE PHRASES
# ============================================================

def construire_pattern(source_pattern):
    """
    Transforme une phrase contenant {0}, {1}, etc.
    en expression régulière.

    Chaque paramètre est capturé séparément.
    """

    morceaux = re.split(
        r"(\{\d+\})",
        source_pattern,
    )

    regex_parts = []
    indices = []

    for morceau in morceaux:

        match = re.fullmatch(r"\{(\d+)\}", morceau)

        if match:
            indices.append(int(match.group(1)))
            regex_parts.append(r"(.*?)")
        else:
            regex_parts.append(re.escape(morceau))

    regex = "^" + "".join(regex_parts) + "$"

    return re.compile(regex, re.IGNORECASE), indices


# ============================================================
# 6. TRADUCTION DES PARAMÈTRES
# ============================================================

def traduire_argument(argument, lang, dictionnaire):
    """
    Traduit un paramètre sans modifier les nombres,
    les unités ou les espaces autour de sa valeur.
    """

    debut = len(argument) - len(argument.lstrip())
    fin = len(argument.rstrip())

    if fin <= debut:
        return argument

    prefixe = argument[:debut]
    contenu = argument[debut:fin]
    suffixe = argument[fin:]

    contenu = traduire_culture(contenu, lang)
    contenu = apply_dico(contenu, dictionnaire)

    return prefixe + contenu + suffixe


# ============================================================
# 7. TRADUCTION D'UNE LIGNE
# ============================================================

def translate_line(line, lang="darija"):
    """
    Traduit une ligne en utilisant les modèles de phrases.

    Priorité :
    1. Les modèles les plus spécifiques.
    2. Traduction de leurs paramètres.
    3. Traduction mot à mot si aucun modèle ne correspond.
    """

    if lang not in ("darija", "en"):
        raise ValueError("Langue non supportée : utilisez 'darija' ou 'en'.")

    original_line = line
    line = line.strip()

    if not line:
        return original_line

    phrases = get_phrases(lang)
    dictionnaire = get_dictionnaire(lang)

    # Récupération des modèles
    modeles = []

    for categorie, phrases_cat in phrases.items():

        if categorie.startswith("_"):
            continue

        if not isinstance(phrases_cat, dict):
            continue

        for source_pattern, target_template in phrases_cat.items():

            placeholders = re.findall(r"\{\d+\}", source_pattern)

            longueur_fixe = len(source_pattern) - sum(
                len(placeholder) for placeholder in placeholders
            )

            nombre_placeholders = len(placeholders)

            modeles.append((
                longueur_fixe,
                -nombre_placeholders,
                source_pattern,
                target_template,
            ))

    # Les modèles les plus spécifiques passent en premier.
    modeles.sort(
        key=lambda modele: (modele[0], modele[1]),
        reverse=True,
    )

    # Recherche et traduction
    for _, _, source_pattern, target_template in modeles:

        pattern, indices = construire_pattern(source_pattern)
        match = pattern.fullmatch(line)

        if not match:
            continue

        valeurs = match.groups()

        parametres = {}

        for indice, valeur in zip(indices, valeurs):
            parametres[indice] = traduire_argument(
                valeur,
                lang,
                dictionnaire,
            )

        placeholders_cibles = [
            int(x)
            for x in re.findall(r"\{(\d+)\}", target_template)
        ]

        tous_indices = indices + placeholders_cibles
        max_index = max(tous_indices, default=-1)

        args = [
            parametres.get(i, "")
            for i in range(max_index + 1)
        ]

        try:
            return target_template.format(*args)

        except (IndexError, KeyError, ValueError):
            continue

    # Aucun modèle ne correspond : traduction du dictionnaire.
    return apply_dico(line, dictionnaire)


# ============================================================
# 8. TRADUCTION DU RAPPORT COMPLET
# ============================================================

def translate_report_rules(text, lang="darija"):
    """
    Traduit un rapport complet ligne par ligne.

    Les lignes vides sont conservées.
    La structure du rapport reste inchangée.
    """

    if lang not in ("darija", "en"):
        raise ValueError(
            "Langue non supportée. Utilisez 'darija' ou 'en'."
        )

    lines = text.splitlines()
    translated_lines = []

    for line in lines:

        if not line.strip():
            translated_lines.append(line)
            continue

        translated_lines.append(
            translate_line(line, lang)
        )

    return "\n".join(translated_lines)
