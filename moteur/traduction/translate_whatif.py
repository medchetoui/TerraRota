"""translate_whatif.py - traduit les scenarios "et si" avec Ollama, un scenario a la fois.

Usage (depuis la racine du dossier moteur) :
  python -m scripts.try_whatif | Out-File -Encoding utf8 whatif_fr.txt
  python -m traduction.translate_whatif whatif_fr.txt --out whatif_darija.json

Un scenario dont la traduction echoue (Ollama arrete, nombres perdus...) reste en
francais avec status "fallback_fr" : la demo ne plante jamais.
"""
import argparse
import json
import sys

from traduction import translate as tr


def title_of(section):
    return section.strip().splitlines()[0].strip("= ").strip()


def translate_scenarios(text):
    results = []
    for section in tr.split_sections(text):
        entry = {"title": title_of(section), "fr": section.strip()}
        try:
            entry["darija"] = tr.translate(section)
            entry["status"] = "ok"
        except (ValueError, KeyError, OSError) as exc:   # OSError couvre URLError et timeouts
            entry["darija"] = None
            entry["status"] = "fallback_fr"
            entry["error"] = str(exc)
        results.append(entry)
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source", nargs="?", help="fichier texte francais (sinon stdin)")
    ap.add_argument("--out", default="whatif_darija.json")
    a = ap.parse_args()

    if a.source:
        with open(a.source, encoding="utf-8-sig") as f:
            text = f.read()
    else:
        text = sys.stdin.buffer.read().decode("utf-8-sig")
    results = translate_scenarios(text)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    ok = sum(1 for r in results if r["status"] == "ok")
    print(f"{ok}/{len(results)} scenarios traduits, les autres restent en francais -> {a.out}")


if __name__ == "__main__":
    main()