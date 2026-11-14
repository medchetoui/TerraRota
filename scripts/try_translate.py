"""Essai rapide de la traduction.
Usage :  python -m scripts.try_translate [darija|en] [numéro du scénario]
Exemple : python -m scripts.try_translate en 2
"""
import sys
import time

from engine.report import analyze, report_to_text
from engine.scenarios import load_scenarios
import ollama.translate as tr
from ollama.translate import translate_report

lang = sys.argv[1] if len(sys.argv) > 1 else "darija"
index = int(sys.argv[2]) if len(sys.argv) > 2 else 0

s = load_scenarios()[index]
report = analyze(s["plan"], s["parcels"], plan_year=2026)
text = report_to_text(report, with_glossary=False)

tr.VERBOSE = True            # affiche blocs, durées et tokens
tr.USE_CACHE = True          # réutilise les blocs déjà traduits et validés (supprimer ollama/cache_traductions.json pour repartir de zéro)
start = time.time()
result = translate_report(text, lang)
print(f"\nTemps total : {time.time() - start:.0f} s")
print(f"[scénario : {s['id']}]  langue obtenue : {result['lang']}  |  traduit : {result['translated']}  |  modèle : {result['model']}")
if result["reason"]:
    print("Rapport français conservé, raison :", result["reason"])
print()
print(result["text"])
