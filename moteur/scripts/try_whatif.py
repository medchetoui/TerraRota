import json
import sys

from engine.config import load_crops
from engine.scenarios import load_scenarios
from engine.whatif import PRESETS, apply_changes, compare_to_text, what_if

crops = load_crops()
scenarios = {s["id"]: s for s in load_scenarios()}
args = sys.argv[1:]
scenario = scenarios[args[0] if args else "cereales_apres_legumineuse"]
rest = args[1:]

DIRECT = ("rain_factor", "temp_delta", "irrigated", "previous_crop")
CONDITIONS = ("ph", "salinity_dsm", "temp_c", "rain_mm")


def parse(value):
    try:
        return json.loads(value)
    except ValueError:
        return value


def run(label, changes):
    result = what_if(scenario["plan"], scenario["parcels"], changes,
                     crops=crops, plan_year=2026, label=label)
    print(compare_to_text(result), end="\n\n")


custom = [a for a in rest if "=" in a]
if custom:
    changes = {}
    for item in custom:
        key, value = item.split("=", 1)
        if key == "plan":                       # plan=orge,lentille
            parcel = next(iter(scenario["parcels"]))
            changes["plan"] = [{"parcel": parcel, "crop": c, "area_ha": 1}
                               for c in value.split(",")]
        elif key in DIRECT:
            changes[key] = parse(value)
        elif key in CONDITIONS:
            changes.setdefault("set", {})[key] = parse(value)
        else:
            raise SystemExit(f"changement inconnu : {key}")
    run("changement personnalisé", changes)
else:
    for key in rest or PRESETS:
        run(PRESETS[key]["label"], PRESETS[key]["changes"])
        
def test_replacing_the_plan_is_compared_with_the_new_lines():
    res = what_if(BLE, {"P1": AFTER_WHEAT},
                  {"plan": [{"parcel": "P1", "crop": "pois", "area_ha": 2}]},
                  crops=CROPS, config=CONFIG, plan_year=2026)
    line = res["comparison"]["lines"][0]
    assert line["crop"] == "pois" and line["score_before"] is None and line["score_after"] == 100
    assert res["comparison"]["changed"]


def test_set_changes_a_condition():
    out = apply_changes({"P1": GOOD}, {"set": {"ph": 8}}, previous_year=2025)
    assert out["P1"]["conditions"]["ph"] == 8 and "ph" not in GOOD["conditions"]


def test_changes_can_target_one_parcel():
    parcels = {"P1": GOOD, "P2": GOOD}
    out = apply_changes(parcels, {"rain_factor": 0.5, "parcels": ["P2"]}, previous_year=2025)
    assert out["P1"]["conditions"]["rain_mm"] == 800 and out["P2"]["conditions"]["rain_mm"] == 400        