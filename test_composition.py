import json
from pathlib import Path
from ollama.rules_translate import translate_report_rules

data = json.loads(
    Path("ollama/phrases_anglais.json").read_text(encoding="utf-8")
)

for source, target in data["resume_plan"].items():
    if "Composition du plan" not in source:
        continue

    test = source
    test = test.replace("{0}", "67").replace("{1}", "33")

    print("\nSOURCE :", test)
    print("ATTENDU:", target.replace("{0}", "67").replace("{1}", "33"))
    print("OBTENU :", translate_report_rules(test, "en"))
