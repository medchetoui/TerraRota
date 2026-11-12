"""explain.py - transforme le resultat du moteur en phrases claires, en francais.
Ollama ne fera que reformuler / traduire ce texte : il ne decide rien."""

CRITERIA = {
    "temp_c": ("La température", "°C"),
    "rain_mm": ("La pluie", "mm"),
    "ph": ("Le pH du sol", ""),
    "salinity_dsm": ("La salinité du sol", "dS/m"),
}
MISSING_NAMES = {
    "temp_c": "la température",
    "rain_mm": "la pluie",
    "ph": "le pH du sol",
    "salinity_dsm": "la salinité du sol",
}
STATUS_LABELS = {
    "ok": "bon choix",
    "risky": "choix à risque",
    "not_recommended": "à éviter",
    "not_evaluated": "non évaluable",
}
CONFIDENCE_LABELS = {"high": "élevée", "medium": "moyenne", "low": "faible"}
GLOSSARY = (
    "Définitions à respecter :\n"
    "- Adéquation au terrain : note de 0 à 100 qui mesure à quel point les conditions "
    "de la parcelle correspondent aux besoins de la culture. Ce n'est PAS un rendement "
    "et PAS une probabilité de réussite.\n"
    "- Après prise en compte de la rotation : la même note, réduite si la culture "
    "suit mal la précédente.\n"
    "- Points : écart entre deux notes sur 100 (par exemple +48 points). "
    "Ce n'est PAS un pourcentage de rendement.\n"
    "- Fiabilité des données : pourcentage qui indique si les données disponibles sont "
    "complètes et vérifiées. Ce n'est PAS la probabilité que la recommandation soit bonne.\n"
    "- Tous les nombres doivent être recopiés tels quels, sans arrondi ni changement."
)

ROTATION_TEXT = {
    "meme_culture_consecutive": "Cette culture a déjà été cultivée sur la parcelle la saison précédente.",
    "meme_famille_consecutive": "La saison précédente, une culture de la même famille a été cultivée, ce qui peut favoriser les maladies du sol.",
    "famille_repetee": "Cette famille de cultures est revenue plusieurs fois récemment sur la parcelle.",
    "culture_exigeante_consecutive": "Deux cultures exigeantes se suivent, ce qui peut fatiguer le sol.",
    "suite_a_legumineuse": "La culture précédente enrichit le sol en azote, ce qui aide celle-ci.",
    "culture_inconnue": "Une culture de l'historique n'est pas reconnue : elle a été ignorée.",
    "historique_absent": "Aucun historique exploitable : la rotation n'a pas pu être évaluée.",
}
ROTATION_CAUTION_RULES = {"culture_inconnue", "historique_absent"}


def _with_unit(value, unit):
    return f"{value} {unit}".strip()


def _suggestion(line):
    status = line["status"]
    if status not in ("ok", "risky", "not_recommended"):
        return None
    if not line["alternatives"]:
        if status == "ok":
            return None
        return "Aucune alternative meilleure n'a été trouvée avec les données disponibles."
    parts = []
    for alt in line["alternatives"]:
        text = f"{alt['name_fr']} (score {alt['score']} sur 100"
        if alt["gain"] is not None:
            text += f", {alt['gain']:+d} points"
        parts.append(text + ")")
    intro = "Une meilleure option existe : " if status == "ok" else "À envisager à la place : "
    return intro + ", ".join(parts) + "."


def explain_line(line, crops, standalone=True):
    """line : une ligne renvoyee par evaluate_plan. crops : la table des cultures.

    standalone=True  : la ligne est expliquee seule, donc on garde toutes les precautions.
    standalone=False : la ligne fait partie d'un plan. Les precautions communes a tout le plan
                       (seuils non verifies / non valides localement) sont dites une seule fois
                       au niveau du plan, et la fiabilite n'est rappelee que si elle n'est pas elevee.
    """
    empty = {"score_text": None, "reasons": [], "cautions": [], "suggestion": None}

    if line["status"] == "unknown_crop":
        return {**empty, "headline": f"Ligne ignorée : la culture « {line['crop']} » n'est pas connue du moteur."}
    if line["status"] == "unknown_parcel":
        return {**empty, "headline": f"Ligne ignorée : la parcelle « {line['parcel']} » n'a pas de données."}

    crop = crops[line["crop"]]
    status_label = STATUS_LABELS[line["status"]]
    if line["status"] == "ok" and any(
        issue["level"] == "warning" and issue["rule"] not in ROTATION_CAUTION_RULES
        for issue in line["rotation_issues"]
    ):
        status_label = "acceptable, avec une réserve"
    headline = f"{line['name_fr']} sur {line['parcel']} : {status_label}."

    # --- score (inutile si la culture est eliminee) ---
    score_text = None
    if line["score"] is not None and not line["exclusions"]:
        if line["rotation_note"] is not None and line["agro_score"] != line["score"]:
            score_text = (f"Adéquation au terrain : {line['agro_score']} sur 100 ; "
                          f"après prise en compte de la rotation : {line['score']} sur 100.")
        else:
            score_text = f"Adéquation au terrain : {line['score']} sur 100."

    # --- raisons ---
    reasons, cautions = [], []
    for ex in line["exclusions"]:
        crit_label, unit = CRITERIA.get(ex["criterion"], (ex["criterion"], ""))
        low, high = ex["allowed_range"]
        reasons.append(
            f"{crit_label} ({_with_unit(ex['value'], unit)}) est hors de ce que cette culture supporte "
            f"(de {_with_unit(low, unit)} à {_with_unit(high, unit)})."
        )
    # pourquoi la culture convient : valeur de la parcelle face aux seuils de la culture
    if not line["exclusions"]:
        for item in line.get("criteria", []):
            crit_label, unit = CRITERIA.get(item["criterion"], (item["criterion"], ""))
            opt_low, opt_high = item["optimal"]
            ideal = f"de {_with_unit(opt_low, unit)} à {_with_unit(opt_high, unit)}"
            value = _with_unit(item["value"], unit)
            if item["position"] == "optimal":
                reasons.append(f"{crit_label} ({value}) est dans la plage idéale de cette culture ({ideal}).")
            elif item["position"] == "tolerable":
                reasons.append(f"{crit_label} ({value}) est acceptable pour cette culture, "
                               f"mais pas idéale (idéal : {ideal}).")
    for issue in line["rotation_issues"]:
        text = ROTATION_TEXT.get(issue["rule"], issue["detail"])
        (cautions if issue["rule"] in ROTATION_CAUTION_RULES else reasons).append(text)
    for benefit in line["rotation_benefits"]:
        reasons.append(ROTATION_TEXT.get(benefit["rule"], benefit["detail"]))

    # --- precautions ---
    conf = line["confidence"]
    if standalone or conf["level"] != "high":
        cautions.insert(0, f"Fiabilité des données : {conf['percent']} % ({CONFIDENCE_LABELS[conf['level']]}).")
    if line["missing"]:
        names = [MISSING_NAMES.get(m, m) for m in line["missing"]]
        cautions.append("Données manquantes : " + ", ".join(names) + ".")
    if standalone:
        if not crop.get("verified", False):
            cautions.append("Les seuils de cette culture n'ont pas été vérifiés.")
        if not crop.get("locally_validated", False):
            cautions.append("Les seuils de cette culture n'ont pas encore été validés localement.")
    if any("irrigation" in reason for reason in conf["reasons"]):
        cautions.append("On ne sait pas si la parcelle est irriguée.")

    return {
        "headline": headline,
        "score_text": score_text,
        "reasons": reasons,
        "cautions": cautions,
        "suggestion": _suggestion(line),
    }


VERDICT_LABELS = {
    "viable": "viable",
    "partially_viable": "en partie viable",
    "not_viable": "non viable",
    "not_evaluated": "non évaluable",
}

FAMILY_NAMES = {
    "poaceae": "céréales",
    "fabaceae": "légumineuses",
    "solanaceae": "famille de la pomme de terre",
    "amaryllidaceae": "famille de l'oignon",
    "oleaceae": "famille de l'olivier",
    "rutaceae": "agrumes",
    "capparaceae": "famille du câprier",
}


def _plan_issue_text(issue):
    if issue["rule"] == "concentration_famille":
        family = FAMILY_NAMES.get(issue["family"], issue["family"])
        return (f"{issue['percent']} % du plan est dans la même famille de cultures ({family}), "
                "ce qui peut favoriser les maladies du sol.")
    if issue["rule"] == "ligne_non_evaluee":
        return f"La ligne « {issue['crop']} » sur {issue['parcel']} n'a pas pu être évaluée."
    return issue["detail"]
def _composition_text(composition):
    if not composition:
        return None
    parts = [f"{FAMILY_NAMES.get(c['family'], c['family'])} {c['percent']} %" for c in composition]
    return "Composition du plan : " + ", ".join(parts) + "."


def _tip_text(tip):
    if tip["rule"] == "une_seule_famille":
        family = tip["family"]
        if family == "poaceae":
            text = ("Votre plan ne contient que des céréales. Ajouter une légumineuse réduit les "
                    "maladies du sol et enrichit la terre en azote pour la saison suivante.")
        elif family == "fabaceae":
            text = ("Votre plan ne contient que des légumineuses. Alterner avec une céréale ou une "
                    "culture d'une autre famille limite les maladies du sol.")
        else:
            name = FAMILY_NAMES.get(family, family)
            text = (f"Votre plan ne contient qu'une seule famille de cultures ({name}). Alterner "
                    "avec une autre famille limite les maladies du sol.")
    else:
        text = ("Aucune légumineuse dans le plan. En ajouter une, cette saison ou la suivante, "
                "enrichit le sol en azote.")
    for pid, items in (tip.get("suggestions") or {}).items():
        names = ", ".join(f"{s['name_fr']} ({s['score']} sur 100)" for s in items)
        text += f" Légumineuses adaptées à {pid} : {names}."
    return text

def _plan_summary(lines):
    counts = {s: sum(1 for line in lines if line["status"] == s)
              for s in ("ok", "risky", "not_recommended")}
    evaluated = sum(counts.values())
    if evaluated == 0:
        return "Aucune ligne du plan n'a pu être évaluée."
    text = (f"Lignes évaluées : {evaluated} (bons choix : {counts['ok']}, "
            f"à risque : {counts['risky']}, à éviter : {counts['not_recommended']}).")
    ignored = len(lines) - evaluated
    if ignored:
        text += f" Lignes ignorées : {ignored}."
    return text


def _threshold_notes(lines, crops):
    """Remarques communes a tout le plan : seuils non verifies / non valides localement."""
    unverified, unvalidated, seen = [], [], set()
    for line in lines:
        if "name_fr" not in line or line["crop"] in seen:
            continue
        seen.add(line["crop"])
        crop = crops[line["crop"]]
        if not crop.get("verified", False):
            unverified.append(line["name_fr"])
        if not crop.get("locally_validated", False):
            unvalidated.append(line["name_fr"])
    notes = []
    if unverified:
        notes.append("Seuils non vérifiés pour : " + ", ".join(unverified) + ".")
    if unvalidated:
        notes.append("Seuils pas encore validés localement pour : " + ", ".join(unvalidated) + ".")
    return notes


def explain_plan(result, crops, proposed=False):
    """result : ce que renvoie evaluate_plan. proposed=True si le plan vient de recommend_plan."""
    conf = result.get("confidence")
    conf_text = None
    if conf:
        conf_text = (f"Fiabilité du plan : {conf['percent']} % ({CONFIDENCE_LABELS[conf['level']]}), "
                     "égale à celle de la ligne la plus fragile.")
    prefix = "Plan proposé" if proposed else "Plan"
    return {
        "verdict": result["verdict"],
        "headline": f"{prefix} : {VERDICT_LABELS[result['verdict']]}.",
        "summary": _plan_summary(result["lines"]),
        "confidence_text": conf_text,
        "composition_text": _composition_text(result.get("composition")),
        "issues": [_plan_issue_text(issue) for issue in result["plan_issues"]],
        "tips": [_tip_text(tip) for tip in result.get("tips", [])],
        "notes": _threshold_notes(result["lines"], crops),
        "lines": [explain_line(line, crops, standalone=False) for line in result["lines"]],
    }


def to_text(explanation, with_glossary=True):
    """Texte brut en francais, pret a etre donne a Ollama."""
    out = []
    if with_glossary:
        out += [GLOSSARY, ""]
    out += [explanation["headline"], explanation["summary"]]
    if explanation["confidence_text"]:
        out.append(explanation["confidence_text"])
    if explanation.get("composition_text"):
        out.append(explanation["composition_text"])    
    for issue in explanation["issues"]:
        out.append("Attention : " + issue)
    for note in explanation.get("notes", []):
        out.append("Remarque : " + note)
    for tip in explanation.get("tips", []):
        out.append("Astuce : " + tip)    
    for number, line in enumerate(explanation["lines"], start=1):
        out.append("")
        out.append(f"Ligne {number} - {line['headline']}")
        if line["score_text"]:
            out.append(line["score_text"])
        for reason in line["reasons"]:
            out.append("Raison : " + reason)
        for caution in line["cautions"]:
            out.append("Précaution : " + caution)
        if line["suggestion"]:
            out.append(line["suggestion"])
    return "\n".join(out)