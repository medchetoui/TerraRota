from engine.report import analyze, report_to_text
from engine.scenarios import load_scenarios
from traduction import translate

s = load_scenarios()[0]
report = analyze(s["plan"], s["parcels"], plan_year=2026)
text = report_to_text(report, with_glossary=False)
print(translate(text))