from engine.config import load_crops
from engine.explain import to_text
from engine.report import analyze

crops = load_crops()

CONDITIONS = {"temp_c": 18, "rain_mm": 500, "ph": 7, "salinity_dsm": 2}
farmer_plan = [{"parcel": "P1", "crop": "ble_tendre", "area_ha": 2},
               {"parcel": "P1", "crop": "orge", "area_ha": 1}]


def show(title, parcels):
    report = analyze(farmer_plan, parcels, crops=crops)
    print("\n" + "#" * 70 + f"\n# {title}\n" + "#" * 70)
    if report["missing_history"]:
        print("Historique manquant pour :", ", ".join(report["missing_history"]),
              "-> l'app doit poser la question")

    print(f"\n=== PLAN DE L'AGRICULTEUR ({report['year']}) ===")
    print(to_text(report["farmer"]["explanation"]))

    if report["better"]:
        print(f"\n=== PLAN CORRIGÉ POUR {report['year']} ===")
        print(to_text(report["better"]["explanation"], with_glossary=False))
        if report["better"]["unplanned"]:
            print("Aucune culture viable pour :", ", ".join(report["better"]["unplanned"]))

    nxt = report["next_year"]
    base = "plan corrigé" if nxt["based_on"] == "proposed" else "plan de l'agriculteur"
    print(f"\n=== PLAN SUGGÉRÉ POUR {nxt['year']} (à partir du {base}) ===")
    print(to_text(nxt["explanation"], with_glossary=False))
    if nxt["unplanned"]:
        print("Aucune culture viable pour :", ", ".join(nxt["unplanned"]))


with_history = {"P1": {"conditions": CONDITIONS, "irrigated": False,
                       "history": [{"crop": "ble_tendre", "year": 2025}]}}
without_history = {"P1": {"conditions": CONDITIONS, "irrigated": False}}

show("AVEC HISTORIQUE (blé tendre en 2025)", with_history)
show("SANS HISTORIQUE", without_history)