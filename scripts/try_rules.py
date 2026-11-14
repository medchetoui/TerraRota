"""try_rules.py - Test de la traduction par règles."""
import sys
from engine.report import analyze, report_to_text
from engine.scenarios import load_scenarios
from ollama.rules_translate import translate_report_rules

index = int(sys.argv[1]) if len(sys.argv) > 1 else 0
lang = sys.argv[2] if len(sys.argv) > 2 else "darija"

s = load_scenarios()[index]
report = analyze(s["plan"], s["parcels"], plan_year=2026)
text_fr = report_to_text(report, with_glossary=False)

print("=== TEXTE FRANÇAIS ORIGINAL ===")
print(text_fr)
print("\n" + "="*50 + "\n")

text_traduit = translate_report_rules(text_fr, lang=lang)

print(f"=== TRADUCTION EN {lang.upper()} (PAR RÈGLES) ===")
print(text_traduit)