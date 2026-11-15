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
        