from engine.explain import GLOSSARY
from engine.report import analyze, report_to_text
from engine.scenarios import load_scenarios
from ollama import translate as tr

TERMS = '{"termes": {"rotation": "تناوب"}}'


def french_texts():
    for s in load_scenarios():
        report = analyze(s["plan"], s["parcels"], plan_year=2026)
        yield s["id"], report_to_text(report, with_glossary=False)


def make_terms(tmp_path):
    path = tmp_path / "termes.json"
    path.write_text(TERMS, encoding="utf-8")
    return path


# ---------------------------------------------------------------- test des nombres

def test_numbers_are_checked():
    assert tr.numbers_preserved("Score 87 sur 100, 18 °C", "النقطة 87 من 100، 18 °C")
    assert not tr.numbers_preserved("Score 87 sur 100", "النقطة من 100")


def test_arabic_digits_and_decimal_comma_are_accepted():
    assert tr.numbers_preserved("pH 5.5, 87 sur 100", "pH 5,5 و ٨٧ من ١٠٠")


# ---------------------------------------------------------------- texte envoye a Ollama

def test_text_for_ollama_has_no_glossary_and_splits_into_sections():
    for scenario_id, text in french_texts():
        assert not text.startswith("Définitions"), scenario_id
        sections = tr.split_sections(text)
        assert sections, scenario_id
        assert all(sec.startswith("=== ") for sec in sections[1:]), scenario_id
        assert "".join(sections).strip() == text.strip(), scenario_id


# ---------------------------------------------------------------- translate (faux modele)

def test_translate_keeps_all_numbers_with_a_faithful_model(monkeypatch, tmp_path):
    # faux modele : renvoie le texte de la section tel quel
    monkeypatch.setattr(tr, "ask", lambda prompt: prompt.rsplit("Texte à traduire :\n", 1)[1])
    terms = make_terms(tmp_path)
    for scenario_id, text in french_texts():
        assert tr.numbers_preserved(text, tr.translate(text, terms_file=terms)), scenario_id


def test_translate_raises_when_numbers_are_lost(monkeypatch, tmp_path):
    calls = []

    def lossy(prompt):
        calls.append(1)
        return "ترجمة بدون أرقام"

    monkeypatch.setattr(tr, "ask", lossy)
    try:
        tr.translate("=== PLAN ===\nScore 87 sur 100.", terms_file=make_terms(tmp_path))
        raised = False
    except ValueError:
        raised = True
    assert raised and len(calls) == 2          # un essai + un seul nouvel essai


def test_translate_retries_once_and_accepts_a_good_second_answer(monkeypatch, tmp_path):
    answers = iter(["بدون أرقام", "النقطة 87 من 100"])
    monkeypatch.setattr(tr, "ask", lambda prompt: next(answers))
    out = tr.translate("=== PLAN ===\nScore 87 sur 100.", terms_file=make_terms(tmp_path))
    assert "87" in out


def test_glossary_goes_in_the_prompt_not_in_the_text(monkeypatch, tmp_path):
    seen = []

    def spy(prompt):
        seen.append(prompt)
        return "النقطة 87"

    monkeypatch.setattr(tr, "ask", spy)
    tr.translate("=== PLAN ===\nScore 87.", terms_file=make_terms(tmp_path))
    assert GLOSSARY in seen[0]