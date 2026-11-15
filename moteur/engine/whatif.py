"""whatif.py - 'et si' : change une donnee d'entree, relance le moteur, compare les deux sorties."""
import copy

from .config import load_config, load_crops
from .explain import STATUS_LABELS, VERDICT_LABELS
from .report import analyze

PRESETS = {
    "moins_de_pluie": {"label": "Et s'il pleut 20 % de moins ?", "changes": {"rain_factor": 0.8}},
    "plus_de_pluie": {"label": "Et s'il pleut 20 % de plus ?", "changes": {"rain_factor": 1.2}},
    "plus_chaud": {"label": "Et s'il fait 2 °C de plus ?", "changes": {"temp_delta": 2}},
    "irrigation": {"label": "Et si j'irrigue la parcelle ?", "changes": {"irrigated": True}},
    "apres_legumineuse": {"label": "Et si la culture précédente était une légumineuse ?",
                          "changes": {"previous_crop": "pois_chiche"}},
    "apres_cereale": {"label": "Et si la culture précédente était une céréale ?",
                      "changes": {"previous_crop": "ble_tendre"}},
    "sol_plus_sale": {"label": "Et si le sol est plus salé (6 dS/m) ?",
                      "changes": {"set": {"salinity_dsm": 6}}},
    "secheresse": {"label": "Et s'il y a une sécheresse (30 % de pluie en moins, +2 °C) ?",
                   "changes": {"rain_factor": 0.7, "temp_delta": 2}},
}


def list_presets():
    return [{"id": key, "label": preset["label"]} for key, preset in PRESETS.items()]


def apply_changes(parcels, changes, previous_year):
    """Copie des parcelles avec les changements appliques. Tous optionnels :
    parcels (ids concernes, defaut toutes), rain_factor, temp_delta, set ({"ph": 8}),
    irrigated, previous_crop (remplace la culture de l'annee precedente)."""
    out = copy.deepcopy(parcels)
    for pid in [p for p in (changes.get("parcels") or list(out)) if p in out]:
        parcel = out[pid]
        cond = parcel.setdefault("conditions", {})
        if "rain_factor" in changes and cond.get("rain_mm") is not None:
            cond["rain_mm"] = round(cond["rain_mm"] * changes["rain_factor"], 1)
        if "temp_delta" in changes and cond.get("temp_c") is not None:
            cond["temp_c"] = round(cond["temp_c"] + changes["temp_delta"], 1)
        monthly = parcel.get("monthly")
        if monthly:
            if "rain_factor" in changes:
                monthly["rain_mm"] = [round(v * changes["rain_factor"], 1) for v in monthly["rain_mm"]]
            if "temp_delta" in changes:
                monthly["temp_c"] = [round(v + changes["temp_delta"], 1) for v in monthly["temp_c"]]    
        cond.update(changes.get("set", {}))
        if "irrigated" in changes:
            parcel["irrigated"] = changes["irrigated"]
        if "previous_crop" in changes:
            history = [h for h in parcel.get("history", []) if h.get("year") != previous_year]
            history.append({"crop": changes["previous_crop"], "year": previous_year})
            parcel["history"] = history
    return out


def _next_names(report, crops):
    return [crops[l["crop"]]["name_fr"] for l in report["next_year"]["plan"] if l["crop"] in crops]


def compare(base, variant, crops):
    b, v = base["farmer"]["evaluation"], variant["farmer"]["evaluation"]
    before = {(l["parcel"], l["crop"]): l for l in b["lines"]}
    lines = []
    for line in v["lines"]:
        old = before.get((line["parcel"], line["crop"]), {})
        s0, s1 = old.get("score"), line.get("score")
        lines.append({
            "parcel": line["parcel"], "crop": line["crop"],
            "name_fr": line.get("name_fr", line["crop"]),
            "score_before": s0, "score_after": s1,
            "delta": s1 - s0 if s0 is not None and s1 is not None else None,
            "status_before": old.get("status"), "status_after": line["status"],
        })
    c0, c1 = b.get("confidence"), v.get("confidence")
    result = {
        "verdict": {"before": b["verdict"], "after": v["verdict"]},
        "confidence": {"before": c0["percent"] if c0 else None,
                       "after": c1["percent"] if c1 else None},
        "tips": {"before": [t["rule"] for t in b["tips"]], "after": [t["rule"] for t in v["tips"]]},
        "lines": lines,
        "next_year": {"before": _next_names(base, crops), "after": _next_names(variant, crops)},
    }
    result["changed"] = (
        result["verdict"]["before"] != result["verdict"]["after"]
        or result["tips"]["before"] != result["tips"]["after"]
        or result["next_year"]["before"] != result["next_year"]["after"]
        or any(l["delta"] not in (0, None) or l["status_before"] != l["status_after"]
               for l in lines))
    return result


def what_if(farmer_plan, parcels, changes, crops=None, config=None, plan_year=None, label=None):
    config = load_config() if config is None else config
    crops = load_crops() if crops is None else crops
    base = analyze(farmer_plan, parcels, crops=crops, config=config, plan_year=plan_year)
    year = base["year"]
    variant = analyze(changes.get("plan", farmer_plan),
                      apply_changes(parcels, changes, previous_year=year - 1),
                      crops=crops, config=config, plan_year=year)
    return {"label": label or "changement", "changes": changes, "base": base,
            "variant": variant, "comparison": compare(base, variant, crops)}


def compare_to_text(result):
    """Texte français pour Ollama. La section commence par '=== ' comme les autres."""
    c = result["comparison"]
    out = [f"=== ET SI : {result['label']} ==="]
    if not c["changed"]:
        out.append("Ce changement ne modifie pas le résultat du plan.")
    v = c["verdict"]
    if v["before"] == v["after"]:
        out.append(f"Plan : reste {VERDICT_LABELS[v['after']]}.")
    else:
        out.append(f"Plan : {VERDICT_LABELS[v['before']]} avant, {VERDICT_LABELS[v['after']]} après.")
    cf = c["confidence"]
    if None not in (cf["before"], cf["after"]) and cf["before"] != cf["after"]:
        out.append(f"Fiabilité du plan : {cf['before']} % avant, {cf['after']} % après.")
    for number, line in enumerate(c["lines"], start=1):
        if line["score_after"] is None:
            continue
        if line["delta"] is None:
            text = f"{line['score_after']} sur 100 après."
        elif line["delta"] == 0:
            text = f"{line['score_after']} sur 100, inchangé."
        else:
            text = (f"{line['score_before']} sur 100 avant, {line['score_after']} sur 100 après "
                    f"({line['delta']:+d} points).")
        s0, s1 = line["status_before"], line["status_after"]
        if s0 not in (None, s1):
            text += f" Verdict de la ligne : {STATUS_LABELS.get(s0, s0)} avant, {STATUS_LABELS.get(s1, s1)} après."
        out.append(f"Ligne {number} - {line['name_fr']} sur {line['parcel']} : {text}")
    ny = c["next_year"]
    if ny["before"] != ny["after"]:
        out.append("Année suivante : " + (", ".join(ny["before"]) or "aucune culture")
                   + " avant, " + (", ".join(ny["after"]) or "aucune culture") + " après.")
    return "\n".join(out)