"""scenarios.py - charge les scenarios de test et verifie ce qu'on en attend."""
import json
from pathlib import Path

FILE = Path(__file__).resolve().parent.parent / "scenarios" / "scenarios.json"


def _resolve(obj, aliases):
    if isinstance(obj, str):
        return aliases.get(obj, obj)
    if isinstance(obj, list):
        return [_resolve(o, aliases) for o in obj]
    if isinstance(obj, dict):
        return {k: _resolve(v, aliases) for k, v in obj.items()}
    return obj


def load_scenarios(path=FILE):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    aliases = data.get("aliases", {})
    return [_resolve(s, aliases) for s in data["scenarios"]]


def check(scenario, report, crops):
    """Retourne la liste des ecarts entre ce qu'on attend et ce que le moteur a fait."""
    exp, problems = scenario.get("expect", {}), []
    farmer = report["farmer"]["evaluation"]
    if "farmer_verdict" in exp and farmer["verdict"] != exp["farmer_verdict"]:
        problems.append(f"verdict {farmer['verdict']} au lieu de {exp['farmer_verdict']}")
    if "farmer_verdict_in" in exp and farmer["verdict"] not in exp["farmer_verdict_in"]:
        problems.append(f"verdict {farmer['verdict']} pas dans {exp['farmer_verdict_in']}")
    if "has_better" in exp and (report["better"] is not None) != exp["has_better"]:
        problems.append(f"plan corrige present = {report['better'] is not None}")
    if "tip_rules" in exp:
        rules = [t["rule"] for t in farmer["tips"]]
        if rules != exp["tip_rules"]:
            problems.append(f"astuces {rules} au lieu de {exp['tip_rules']}")
    for rule in exp.get("plan_issue_rules_include", []):
        if rule not in [i["rule"] for i in farmer["plan_issues"]]:
            problems.append(f"probleme de plan attendu : {rule}")
    if "missing_history" in exp and report["missing_history"] != exp["missing_history"]:
        problems.append(f"historique manquant {report['missing_history']}")
    if "next_year_excludes_families" in exp:
        families = {crops[l["crop"]]["family"] for l in report["next_year"]["plan"]}
        bad = families & set(exp["next_year_excludes_families"])
        if bad:
            problems.append(f"annee suivante contient la famille {sorted(bad)}")
    return problems