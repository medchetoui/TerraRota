import json
from engine.plan import evaluate_plan

plan = [{"parcel": "P1", "crop": "ble_tendre", "area_ha": 2}]
parcels = {"P1": {
    "conditions": {"temp_c": 18, "rain_mm": 500, "ph": 7, "salinity_dsm": 2},
    "irrigated": False,
    "history": [{"crop": "ble_tendre", "year": 2025}],
}}
print(json.dumps(evaluate_plan(plan, parcels), indent=1, ensure_ascii=False))