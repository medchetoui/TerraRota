"""report.py - analyse d'une saison : plan de l'agriculteur, plan corrige si besoin,
puis plan de l'annee suivante."""
import datetime

from .config import load_config, load_crops
from .explain import explain_plan,to_text, GLOSSARY
from .plan import evaluate_plan, recommend_plan



def _plan_year(parcels):
    years = [h["year"] for p in parcels.values() for h in p.get("history", []) if "year" in h]
    return max(years) + 1 if years else datetime.date.today().year


def _after(parcels, plan, year, crops):
    """Copie des parcelles ou `plan` devient la saison `year` (historique + surface)."""
    out = {pid: {**p, "history": list(p.get("history", []))} for pid, p in parcels.items()}
    for item in plan:
        pid, crop = item.get("parcel"), item.get("crop")
        if pid in out and crop in crops:
            out[pid]["history"].append({"crop": crop, "year": year})
    for pid, parcel in out.items():
        total = sum(i.get("area_ha") or 0 for i in plan if i.get("parcel") == pid)
        if total and "area_ha" not in parcel:
            parcel["area_ha"] = total
    return out


def _proposal(parcels, crops, config, year, **options):
    plan, unplanned = recommend_plan(parcels, crops=crops, config=config, **options)
    evaluation = evaluate_plan(plan, parcels, crops=crops, config=config)
    return {"year": year, "plan": plan, "unplanned": unplanned, "evaluation": evaluation,
            "explanation": explain_plan(evaluation, crops, proposed=True)}

def report_to_text(report, with_glossary=True):
    out = [GLOSSARY, ""] if with_glossary else []
    if report["missing_history"]:
        out += ["Historique non renseigné pour : " + ", ".join(report["missing_history"])
                + ". La rotation est donc moins fiable.", ""]
    out += [f"=== PLAN DE L'AGRICULTEUR ({report['year']}) ===",
            to_text(report["farmer"]["explanation"], with_glossary=False)]
    if report["better"]:
        out += ["", f"=== PLAN CORRIGÉ POUR {report['year']} ===",
                to_text(report["better"]["explanation"], with_glossary=False)]
        if report["better"]["unplanned"]:
            out.append("Aucune culture viable pour : " + ", ".join(report["better"]["unplanned"]) + ".")
    nxt = report["next_year"]
    base = "plan corrigé" if nxt["based_on"] == "proposed" else "plan de l'agriculteur"
    out += ["", f"=== PLAN SUGGÉRÉ POUR {nxt['year']} (à partir du {base}) ===",
            to_text(nxt["explanation"], with_glossary=False)]
    if nxt["unplanned"]:
        out.append("Aucune culture viable pour : " + ", ".join(nxt["unplanned"]) + ".")
    return "\n".join(out)

def analyze(farmer_plan, parcels, crops=None, config=None, plan_year=None,
            retained="auto", **options):
    """
    retained : "farmer", "proposed" ou "auto" -> quel plan sert de base pour l'annee suivante.
               "auto" = celui de l'agriculteur s'il tient, sinon le plan propose.
    options  : transmises a recommend_plan (wanted, max_lines, include_perennials, ...)
    """
    config = load_config() if config is None else config
    crops = load_crops() if crops is None else crops
    year = _plan_year(parcels) if plan_year is None else plan_year

    # 1. plan de l'agriculteur (les alternatives sont dans chaque ligne)
    farmer = evaluate_plan(farmer_plan, parcels, crops=crops, config=config)

    # 2. plan corrige pour cette annee, seulement si celui de l'agriculteur ne tient pas
    better = None
    if farmer["verdict"] != "viable" or farmer["plan_issues"]:
        better = _proposal(parcels, crops, config, year, **options)

    # 3. annee suivante, calculee a partir du plan retenu
    if retained == "auto":
        retained = "proposed" if better and better["plan"] else "farmer"
    base_plan = better["plan"] if retained == "proposed" else farmer_plan
    next_year = _proposal(_after(parcels, base_plan, year, crops), crops, config,
                          year + 1, **options)
    next_year["based_on"] = retained

    return {
        "schema_version": 1,
        "year": year,
        "missing_history": [pid for pid, p in parcels.items() if not p.get("history")],
        "farmer": {"plan": farmer_plan, "evaluation": farmer,
                   "explanation": explain_plan(farmer, crops)},
        "better": better,
        "retained": retained,
        "next_year": next_year,
    }