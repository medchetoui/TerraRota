import json

import pytest

from engine.config import load_crops
from engine.report import analyze, report_to_text
from engine.scenarios import check, load_scenarios

CROPS = load_crops()
SCENARIOS = load_scenarios()


@pytest.mark.parametrize("scenario", SCENARIOS, ids=[s["id"] for s in SCENARIOS])
def test_scenario(scenario):
    if not scenario.get("allow_unknown"):
        keys = [i["crop"] for i in scenario["plan"]]
        keys += [h["crop"] for p in scenario["parcels"].values() for h in p.get("history", [])]
        unknown = [k for k in keys if k not in CROPS and k != "quinoa"]
        assert not unknown, f"cultures absentes de crops_reference.json : {unknown}"
    report = analyze(scenario["plan"], scenario["parcels"], crops=CROPS, plan_year=2026)
    assert check(scenario, report, CROPS) == []
    json.dumps(report)                                   # le rapport doit rester du JSON valide
    assert report["farmer"]["explanation"]["headline"] in report_to_text(report)