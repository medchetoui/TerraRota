import json
from pathlib import Path

BASE = Path("ollama")

FILES = [
    "phrases_anglais.json",
    "phrases_darija.json"
]

def repair_text(text):
    markers = ("Ã", "Â", "Ø", "Ù")

    for _ in range(3):
        if not any(marker in text for marker in markers):
            break

        try:
            repaired = text.encode("cp1252").decode("utf-8")
            if repaired == text:
                break
            text = repaired
        except (UnicodeEncodeError, UnicodeDecodeError):
            break

    return text


def repair_object(obj):
    if isinstance(obj, dict):
        return {
            repair_text(str(key)): repair_object(value)
            for key, value in obj.items()
        }

    if isinstance(obj, list):
        return [repair_object(item) for item in obj]

    if isinstance(obj, str):
        return repair_text(obj)

    return obj


for filename in FILES:
    path = BASE / filename

    if not path.exists():
        print(f"Fichier introuvable : {path}")
        continue

    # Sauvegarde avant modification
    backup = path.with_suffix(path.suffix + ".bak")
    if not backup.exists():
        backup.write_bytes(path.read_bytes())

    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)

    data = repair_object(data)

    # Corrections des espaces anglais
    if filename == "phrases_anglais.json":
        def fix_english(obj):
            if isinstance(obj, dict):
                return {
                    key: fix_english(value)
                    for key, value in obj.items()
                }
            if isinstance(obj, list):
                return [fix_english(value) for value in obj]
            if isinstance(obj, str):
                return (
                    obj.replace("onionfamily", "onion family")
                       .replace("legumesfor", "legumes for")
                       .replace("outof", "out of")
                )
            return obj

        data = fix_english(data)

    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    print(f"OK : {filename} réparé.")

print("\nRéparation terminée.")
