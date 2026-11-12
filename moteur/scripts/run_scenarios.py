import sys

from engine.config import load_crops
from engine.report import analyze, report_to_text
from engine.scenarios import check, load_scenarios

crops = load_crops()
wanted = sys.argv[1:]
for s in load_scenarios():
    if wanted and s["id"] not in wanted:
        continue
    report = analyze(s["plan"], s["parcels"], crops=crops, plan_year=2026)
    problems = check(s, report, crops)
    print("\n" + "#" * 70 + f"\n# {s['id']} : {'OK' if not problems else 'ÉCART'}\n# {s['description']}")
    for p in problems:
        print("  ✗", p)
    print("#" * 70)
    print(report_to_text(report))