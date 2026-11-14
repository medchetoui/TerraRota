import inspect
from ollama.rules_translate import (
    get_phrases,
    construire_pattern,
    traduire_argument,
    get_dictionnaire,
    translate_line
)

print("===== CODE DE translate_line =====")
print(inspect.getsource(translate_line))

phrases = get_phrases("en")
dico = get_dictionnaire("en")

for source, cible in phrases["resume_plan"].items():
    if "Composition du plan" not in source or "{1}" not in source:
        continue

    phrase = source.replace("{0}", "67").replace("{1}", "33")
    pattern, indices = construire_pattern(source)
    match = pattern.match(phrase)

    print("\n===== DIAGNOSTIC =====")
    print("SOURCE :", repr(source))
    print("CIBLE :", repr(cible))
    print("PHRASE :", repr(phrase))
    print("INDICES :", indices)
    print("CAPTURES :", match.groups())

    parametres = {}
    for indice, valeur in zip(indices, match.groups()):
        parametres[indice] = traduire_argument(valeur, "en", dico)

    args = [parametres.get(i, "") for i in range(2)]

    print("PARAMETRES :", parametres)
    print("ARGUMENTS :", args)
    print("FORMAT DIRECT :", cible.format(*args))
    print("TRANSLATE_LINE :", translate_line(phrase, "en"))
