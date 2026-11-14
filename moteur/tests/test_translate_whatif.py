
from traduction import translate as tr
from traduction.translate_whatif import translate_scenarios, title_of

TEXT = """=== ET SI : Et s'il pleut 20 % de moins ? ===
Plan : viable avant, en partie viable après.
Ligne 1 - Blé tendre sur P1 : 78 sur 100 avant, 69 sur 100 après (-9 points).

=== ET SI : Et si j'irrigue la parcelle ? ===
Plan : reste viable.
Ligne 1 - Blé tendre sur P1 : 78 sur 100 avant, 100 sur 100 après (+22 points).
"""


def test_un_scenario_par_bloc_et_titre():
    sections = tr.split_sections(TEXT)
    assert len(sections) == 2
    assert title_of(sections[0]) == "ET SI : Et s'il pleut 20 % de moins ?"


def test_ollama_arrete_donne_fallback_sans_planter(monkeypatch):
    def down(prompt, temperature=0):
        raise OSError("connexion refusee")
    monkeypatch.setattr(tr, "ask", down)
    res = translate_scenarios(TEXT)
    assert [r["status"] for r in res] == ["fallback_fr", "fallback_fr"]
    assert all(r["darija"] is None and r["fr"] for r in res)


def test_un_echec_nisole_pas_les_autres(monkeypatch):
    calls = {"n": 0}

    def fake(prompt, temperature=0):
        calls["n"] += 1
        text = prompt.rsplit("Texte à traduire :\n", 1)[1]   # le texte seul, pas la table de termes
        if "irrigue" in text:                              # 2e scenario : nombres perdus
            return "ترجمة بدون أرقام"
        return "20 1 1 78 100 100 69 9"                      # 1er scenario : nombres gardes
    monkeypatch.setattr(tr, "ask", fake)
    res = translate_scenarios(TEXT)
    assert res[0]["status"] == "ok"
    assert res[1]["status"] == "fallback_fr" and "nombres perdus" in res[1]["error"]
    assert calls["n"] == 3      # 1 appel pour le scénario 1, 2 pour le scénario 2 (un seul nouvel essai)