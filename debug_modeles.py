from ollama.rules_translate import get_phrases, construire_pattern

phrases = get_phrases("en")

source_cible = None

for source, cible in phrases["resume_plan"].items():
    if "Composition du plan" in source and "{1}" in source and "céréales" in source:
        source_cible = source.replace("{0}", "67").replace("{1}", "33")
        break

print("PHRASE TESTÉE :", repr(source_cible))
print("\nMODÈLES QUI CORRESPONDENT :")

for categorie, phrases_cat in phrases.items():
    if categorie.startswith("_") or not isinstance(phrases_cat, dict):
        continue

    for source, cible in phrases_cat.items():
        pattern, indices = construire_pattern(source)
        match = pattern.match(source_cible)

        if match:
            print("\nCATÉGORIE :", categorie)
            print("MODÈLE :", source)
            print("CIBLE :", cible)
            print("CAPTURES :", match.groups())
