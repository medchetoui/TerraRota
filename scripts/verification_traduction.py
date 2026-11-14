from ollama.rules_translate import (
    translate_report_rules,
    get_phrases,
    translate_line
)
import re

# Même rapport français pour les deux langues
rapport = """
=== PLAN DE L'AGRICULTEUR (2026) ===

Plan : en partie viable.

Lignes évaluées : 3 (bons choix : 2, à risque : 1, à éviter : 0).

Composition du plan : céréales 67 %, famille de l'oignon 33 %.

Ligne 1 - blé sur 2 : bon choix.

Adéquation au terrain : 82 sur 100 ; après prise en compte de la rotation : 75 sur 100.

Raison : La température (22 °C) est dans la plage idéale de cette culture (de 15 °C à 30 °C).

À envisager à la place : orge (score 90 sur 100, +8 points).
"""

def tester_langue(lang):
    print("\n" + "=" * 55)
    print("TEST DE LA LANGUE :", lang.upper())
    print("=" * 55)

    try:
        resultat = translate_report_rules(rapport, lang=lang)
        print(resultat)

    except FileNotFoundError as erreur:
        print("FICHIER INTROUVABLE :", erreur)

    except Exception as erreur:
        print("ERREUR :", erreur)


def tester_toutes_les_regles(lang):
    print("\nTEST DES MODELES DE PHRASES :", lang.upper())

    try:
        phrases = get_phrases(lang)
        compteur = 0

        for categorie, dictionnaire in phrases.items():
            if categorie.startswith("_"):
                continue

            for phrase_source in dictionnaire:
                # Remplacer les placeholders par des valeurs de test
                phrase_test = re.sub(
                    r"\{(\d+)\}",
                    lambda m: ["1", "blé", "2", "2026", "22"][int(m.group(1)) % 5],
                    phrase_source
                )

                traduction = translate_line(phrase_test, lang)

                print("\nFrançais :", phrase_test)
                print("Résultat :", traduction)

                compteur += 1

        print("\nNombre de modèles testés :", compteur)

    except FileNotFoundError as erreur:
        print("FICHIER INTROUVABLE :", erreur)

    except Exception as erreur:
        print("ERREUR :", erreur)


if __name__ == "__main__":

    # 1. Tester le rapport complet en Darija
    tester_langue("darija")

    # 2. Tester le rapport complet en anglais
    tester_langue("en")

    # 3. Tester les modèles de phrases Darija
    tester_toutes_les_regles("darija")

    # 4. Tester les modèles de phrases anglaises
    tester_toutes_les_regles("en")