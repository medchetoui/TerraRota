"""Tests de qualité de la traduction (tâche 6) avec un FAUX modèle : on ne teste pas Ollama,
on teste que nos contrôles acceptent une traduction fidèle et refusent une traduction infidèle."""
import re

import pytest

from engine.config import load_crops
from engine.explain import CONFIDENCE_LABELS, FAMILY_NAMES, MISSING_NAMES, STATUS_LABELS, VERDICT_LABELS
from engine.report import analyze, report_to_text
from engine.scenarios import load_scenarios
from ollama import translate as tr

LANGS = ["darija", "en"]


def french_texts():
    out = {}
    for s in load_scenarios():
        report = analyze(s["plan"], s["parcels"], plan_year=2026)
        out[s["id"]] = report_to_text(report, with_glossary=False)
    return out


def groups_for(lang):
    cfg = tr.LANGUAGES[lang]
    return tr.load_terms([tr.HERE / name for name in cfg["terms_files"]])


def dictionary_translation(text, lang):
    """Faux modèle fidèle : remplace chaque terme français par sa traduction du dictionnaire."""
    flat = tr.flat_terms(groups_for(lang))
    keys = sorted(flat, key=len, reverse=True)
    pattern = re.compile("|".join(re.escape(k) for k in keys))
    return pattern.sub(lambda m: flat[m.group(0)], text)


def check(lang, french, translated):
    return tr.check_fidelity(french, translated, groups_for(lang), tr.LANGUAGES[lang]["forbidden"])


def first_text_with(needle):
    for sid, text in french_texts().items():
        if needle in text:
            return sid, text
    pytest.fail(f"aucun scénario ne contient {needle!r}")


# ----------------------------------------------------- 1. le dictionnaire couvre le moteur

@pytest.mark.parametrize("lang", LANGS)
def test_dictionary_covers_the_engine_vocabulary(lang):
    flat = tr.flat_terms(groups_for(lang))
    cultures = groups_for(lang).get("cultures", {})
    needed = (set(STATUS_LABELS.values()) | set(VERDICT_LABELS.values()) | tr.LABELS | set(tr.MARKERS)
              | {"Ligne"} | set(tr.PAIR_LABELS) | set(FAMILY_NAMES.values())
              | set(CONFIDENCE_LABELS.values()) | set(MISSING_NAMES.values()))
    assert not [t for t in needed if t not in flat], "termes du moteur sans traduction"
    assert not [c["name_fr"] for c in load_crops().values() if c["name_fr"] not in cultures]


def test_team_terms_always_win_over_proposals_and_base():
    team = tr.flat_terms(tr.load_terms([tr.HERE / "termes_darija.json"]))
    merged = tr.flat_terms(groups_for("darija"))
    assert all(merged[k] == v for k, v in team.items())


@pytest.mark.parametrize("name", ["termes_darija.json", "termes_darija_base.json",
                                  "termes_darija_a_valider.json", "termes_anglais.json"])
def test_every_terms_file_is_understood(name):
    """Si un fichier de termes a un format inconnu, il serait ignoré sans bruit : on le détecte ici."""
    path = tr.HERE / name
    if not path.exists():
        pytest.skip(f"{name} absent")
    assert tr.flat_terms(tr.load_terms([path])), f"{name} : aucun terme reconnu (format ? voir load_terms)"


def test_flat_and_grouped_formats_are_both_accepted(tmp_path):
    import json
    grouped = tmp_path / "g.json"
    flat = tmp_path / "f.json"
    grouped.write_text(json.dumps({"termes": {"rotation": "A"}, "cultures": {"Orge": "B"}}), encoding="utf-8")
    flat.write_text(json.dumps({"_commentaire": "x", "rotation": "A", "points": "C"}), encoding="utf-8")
    assert tr.load_terms([grouped]) == {"termes": {"rotation": "A"}, "cultures": {"Orge": "B"}}
    assert tr.load_terms([flat]) == {"termes": {"rotation": "A", "points": "C"}}


# ----------------------------------------------------- 2. traduction fidèle acceptée

@pytest.mark.parametrize("lang", LANGS)
def test_faithful_translation_is_accepted_for_every_scenario(lang):
    for sid, text in french_texts().items():
        for section in tr.split_sections(text):
            assert check(lang, section, dictionary_translation(section, lang)) == [], sid


@pytest.mark.parametrize("lang", LANGS)
def test_translate_report_returns_the_translation_with_a_faithful_model(monkeypatch, lang):
    monkeypatch.setattr(tr, "ask", lambda prompt: dictionary_translation(
        prompt.rsplit("Texte à traduire :\n", 1)[1], lang))
    for sid, text in french_texts().items():
        result = tr.translate_report(text, lang)
        assert result["translated"] and result["lang"] == lang and result["reason"] is None, sid


# ----------------------------------------------------- 3. traduction infidèle refusée

@pytest.mark.parametrize("lang", LANGS)
def test_a_lost_number_is_refused(lang):
    _, text = first_text_with("Adéquation au terrain : 78")
    good = dictionary_translation(text, lang)
    assert check(lang, text, good.replace("78", "", 1))


@pytest.mark.parametrize("lang", LANGS)
def test_an_added_number_is_refused(lang):
    _, text = first_text_with("Adéquation au terrain")
    good = dictionary_translation(text, lang)
    assert check(lang, text, good + " 999")


def replace_in_line(translated, line_pattern, old, new):
    """Remplace `old` par `new` seulement dans la première ligne qui correspond à `line_pattern`."""
    lines = translated.splitlines()
    index = next(i for i, l in enumerate(lines) if re.match(line_pattern, l) and old in l)
    lines[index] = lines[index].replace(old, new, 1)
    return "\n".join(lines)


@pytest.mark.parametrize("lang", LANGS)
def test_a_changed_verdict_is_refused(lang):
    flat = tr.flat_terms(groups_for(lang))
    _, text = first_text_with(": à éviter.")
    good = dictionary_translation(text, lang)
    headline = re.escape(flat["Ligne"]) + r" \d+ - "          # « Ligne 1 - Blé tendre sur P1 : ... »
    bad = replace_in_line(good, headline, flat["à éviter"], flat["bon choix"])
    problems = check(lang, text, bad)
    assert bad != good and any("verdict" in p for p in problems), problems


@pytest.mark.parametrize("lang", LANGS)
def test_two_swapped_scores_are_refused(lang):
    _, text = first_text_with("Adéquation au terrain : 78 sur 100 ; après prise en compte de la rotation : 39 sur 100")
    good = dictionary_translation(text, lang)
    line = next(l for l in good.splitlines() if "78" in l and "39" in l)
    swapped = line.replace("78", "@@").replace("39", "78").replace("@@", "39")
    assert numbers_equal_but_swapped(line, swapped)
    assert check(lang, text, good.replace(line, swapped))


def numbers_equal_but_swapped(a, b):
    return sorted(tr._number_sequence(a)) == sorted(tr._number_sequence(b)) and a != b


@pytest.mark.parametrize("lang", LANGS)
def test_summary_labels_cannot_be_mixed_up(lang):
    flat = tr.flat_terms(groups_for(lang))
    _, text = first_text_with("bons choix : 1, à risque : 0, à éviter : 1")
    good = dictionary_translation(text, lang)
    # on échange les libellés « bons choix » et « à éviter » : les nombres restent dans le même ordre
    bad = good.replace(flat["bons choix"], "@@").replace(flat["à éviter"], flat["bons choix"]).replace("@@", flat["à éviter"])
    assert bad != good and check(lang, text, bad)


@pytest.mark.parametrize("lang", LANGS)
def test_family_percentages_cannot_be_swapped(lang):
    flat = tr.flat_terms(groups_for(lang))
    _, text = first_text_with("Composition du plan : légumineuses 67 %, famille de l'oignon 33 %")
    good = dictionary_translation(text, lang)
    bad = good.replace(flat["légumineuses"], "@@").replace(flat["famille de l'oignon"], flat["légumineuses"]).replace("@@", flat["famille de l'oignon"])
    assert bad != good and check(lang, text, bad)


@pytest.mark.parametrize("lang", LANGS)
def test_viable_cannot_silently_become_not_viable(lang):
    flat = tr.flat_terms(groups_for(lang))
    sid, text = first_text_with("Plan : en partie viable.")
    good = dictionary_translation(text, lang)
    bad = good.replace(flat["en partie viable"], flat["non viable"], 1)
    assert bad != good and check(lang, text, bad)


@pytest.mark.parametrize("lang", LANGS)
def test_a_dropped_precaution_is_refused(lang):
    _, text = first_text_with("Précaution :")
    good = dictionary_translation(text, lang)
    marker = tr.flat_terms(groups_for(lang))["Précaution"]
    lines = good.splitlines()
    index = next(i for i, l in enumerate(lines) if l.startswith(marker))
    del lines[index]
    assert check(lang, text, "\n".join(lines))


@pytest.mark.parametrize("lang", LANGS)
def test_a_precaution_turned_into_something_else_is_refused(lang):
    flat = tr.flat_terms(groups_for(lang))
    _, text = first_text_with("Précaution :")
    good = dictionary_translation(text, lang)
    bad = good.replace(flat["Précaution"] + " :", flat["Astuce"] + " :", 1)
    assert bad != good and check(lang, text, bad)


@pytest.mark.parametrize("lang", LANGS)
def test_a_changed_crop_name_is_refused(lang):
    cultures = groups_for(lang)["cultures"]
    _, text = first_text_with("Blé tendre sur")
    good = dictionary_translation(text, lang)
    bad = good.replace(cultures["Blé tendre"], cultures["Orge"])
    assert bad != good and check(lang, text, bad)


@pytest.mark.parametrize("lang", LANGS)
def test_a_score_turned_into_a_probability_is_refused(lang):
    word = {"darija": "احتمال", "en": "probability"}[lang]
    _, text = first_text_with("Adéquation au terrain")
    good = dictionary_translation(text, lang)
    # on ajoute le mot sur la ligne du score SANS toucher aux nombres : seul le mot interdit doit déclencher le refus
    line = next(l for l in good.splitlines() if "100" in l)
    problems = check(lang, text, good.replace(line, line + " " + word, 1))
    assert any("interdit" in p for p in problems), problems


@pytest.mark.parametrize("lang", LANGS)
def test_empty_answer_and_leaked_instructions_are_refused(lang):
    _, text = first_text_with("Adéquation au terrain")
    assert check(lang, text, "   ")
    assert check(lang, text, dictionary_translation(text, lang) + "\nTable de termes :")


@pytest.mark.parametrize("lang", LANGS)
def test_missing_history_scenario_keeps_its_warning(lang):
    _, text = first_text_with("Historique non renseigné")
    assert check(lang, text, dictionary_translation(text, lang)) == []


# ----------------------------------------------------- 4. retour au français en cas d'échec

def test_french_original_is_kept_when_ollama_is_unreachable(monkeypatch):
    monkeypatch.setattr(tr, "MODEL", "modele-test")
    monkeypatch.setattr(tr, "OLLAMA_URL", "http://127.0.0.1:9/api/generate")   # personne n'écoute
    monkeypatch.setattr(tr, "TIMEOUT", 1)
    monkeypatch.setattr(tr, "RETRY_PAUSE", 0)          # pas d'attente entre les tentatives pendant les tests
    text = next(iter(french_texts().values()))
    result = tr.translate_report(text, "darija")
    assert result["text"] == text and result["lang"] == "fr" and not result["translated"]
    assert "Ollama" in result["reason"]


def test_french_original_is_kept_when_no_model_is_configured(monkeypatch):
    monkeypatch.setattr(tr, "MODEL", "à choisir")
    text = next(iter(french_texts().values()))
    result = tr.translate_report(text, "en")
    assert result["text"] == text and not result["translated"] and "non configuré" in result["reason"]


@pytest.mark.parametrize("answer", ["", "   ", "texte sans rapport"])
def test_french_original_is_kept_when_the_model_answers_badly(monkeypatch, answer):
    monkeypatch.setattr(tr, "ask", lambda prompt: answer)
    text = next(iter(french_texts().values()))
    result = tr.translate_report(text, "darija")
    assert result["text"] == text and not result["translated"] and result["reason"]


def test_french_original_is_kept_when_the_model_changes_a_verdict(monkeypatch):
    flat = tr.flat_terms(groups_for("en"))

    def lying_model(prompt):
        section = prompt.rsplit("Texte à traduire :\n", 1)[1]
        return dictionary_translation(section, "en").replace(flat["à éviter"], flat["bon choix"])

    monkeypatch.setattr(tr, "ask", lying_model)
    _, text = first_text_with(": à éviter.")
    result = tr.translate_report(text, "en")
    assert result["text"] == text and not result["translated"]
    assert "à éviter" in result["reason"] or "verdict" in result["reason"], result["reason"]


def test_a_crashing_model_never_crashes_the_app(monkeypatch):
    def boom(prompt):
        raise RuntimeError("panne imprévue")

    monkeypatch.setattr(tr, "ask", boom)
    text = next(iter(french_texts().values()))
    assert tr.translate_report(text, "en")["text"] == text


def test_french_and_unknown_languages_return_the_original():
    text = next(iter(french_texts().values()))
    assert tr.translate_report(text, "fr")["text"] == text
    assert tr.translate_report(text, "klingon")["text"] == text


def test_language_aliases():
    assert tr.language_key("Darija") == "darija" and tr.language_key("ar") == "darija"
    assert tr.language_key("anglais") == "en" and tr.language_key("EN") == "en"


def test_translate_report_never_rebuilds_the_report(monkeypatch):
    """Une traduction ratée ne doit jamais relancer le calcul agronomique."""
    import engine.report as report_module
    monkeypatch.setattr(report_module, "analyze", lambda *a, **k: pytest.fail("moteur rappelé"))
    monkeypatch.setattr(tr, "ask", lambda prompt: "")
    assert tr.translate_report("=== PLAN ===\nScore 87.", "en")["translated"] is False


# ----------------------------------------------------- 5. cas absents des 8 scénarios : données manquantes, confiance faible

PLAN_POIS_CHICHE = [{"parcel": "P1", "crop": "pois_chiche", "area_ha": 1}]


def report_text(parcels):
    return report_to_text(analyze(PLAN_POIS_CHICHE, parcels, plan_year=2026), with_glossary=False)


MISSING_DATA = {"P1": {"conditions": {"temp_c": 18, "rain_mm": 500}, "history": [{"crop": "orge", "year": 2025}]}}
LOW_CONFIDENCE = {"P1": {"conditions": {"temp_c": 18}}}        # presque aucune donnée, pas d'historique


@pytest.mark.parametrize("lang", LANGS)
def test_missing_data_and_low_confidence_reports_are_translated_faithfully(lang):
    for parcels, needle in ((MISSING_DATA, "Données manquantes"), (LOW_CONFIDENCE, "(faible)")):
        text = report_text(parcels)
        assert needle in text
        for section in tr.split_sections(text):
            assert check(lang, section, dictionary_translation(section, lang)) == []


@pytest.mark.parametrize("lang", LANGS)
def test_a_dropped_missing_data_item_is_refused(lang):
    flat = tr.flat_terms(groups_for(lang))
    text = report_text(MISSING_DATA)
    good = dictionary_translation(text, lang)
    bad = good.replace(flat["la salinité du sol"], "", 1)
    assert bad != good and any("manquante" in p for p in check(lang, text, bad))


@pytest.mark.parametrize("lang", LANGS)
def test_confidence_level_cannot_change(lang):
    flat = tr.flat_terms(groups_for(lang))
    text = report_text(LOW_CONFIDENCE)
    good = dictionary_translation(text, lang)
    bad = good.replace(f"({flat['faible']})", f"({flat['élevée']})", 1)
    assert bad != good and any("fiabilité" in p for p in check(lang, text, bad))


@pytest.mark.parametrize("lang", LANGS)
def test_low_confidence_cannot_turn_into_a_bad_recommendation(lang):
    """Piège de la fiche de mission : « Plan : viable » + fiabilité faible. Le verdict doit rester viable."""
    flat = tr.flat_terms(groups_for(lang))
    text = report_text(LOW_CONFIDENCE)
    good = dictionary_translation(text, lang)
    bad = replace_in_line(good, r"Plan : ", flat["viable"], flat["non viable"])
    assert bad != good and any("verdict" in p for p in check(lang, text, bad))


def test_latin_terms_are_matched_as_whole_words():
    # « low » ne doit pas être trouvé à l'intérieur de « lowest »
    assert tr._labels_in("plan reliability: 50 % (medium), the lowest line", {"faible": "low", "moyenne": "medium"}) == {"moyenne"}


# ----------------------------------------------------- 6. appel Ollama, blocs, prompt

class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def read(self):
        import json
        return json.dumps(self.payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def use_fake_urlopen(monkeypatch, behaviour):
    calls = []

    def fake(req, timeout=None):
        calls.append(1)
        return behaviour(len(calls))

    monkeypatch.setattr(tr.urllib.request, "urlopen", fake)
    monkeypatch.setattr(tr, "MODEL", "modele-test")
    monkeypatch.setattr(tr, "RETRY_PAUSE", 0)
    return calls


def test_ask_returns_the_response(monkeypatch):
    use_fake_urlopen(monkeypatch, lambda n: FakeResponse({"response": "  bonjour  ", "done_reason": "stop"}))
    assert tr.ask("x") == "bonjour"


def test_ask_refuses_a_truncated_answer(monkeypatch):
    use_fake_urlopen(monkeypatch, lambda n: FakeResponse({"response": "début", "done_reason": "length"}))
    with pytest.raises(tr.TranslationError, match="tronquée"):
        tr.ask("x")


def test_ask_retries_network_errors_then_gives_up(monkeypatch):
    def down(n):
        raise tr.urllib.error.URLError("connexion refusée")

    calls = use_fake_urlopen(monkeypatch, down)
    with pytest.raises(tr.TranslationError, match="indisponible"):
        tr.ask("x")
    assert len(calls) == tr.MAX_ATTEMPTS


def test_ask_recovers_after_one_network_error(monkeypatch):
    def flaky(n):
        if n == 1:
            raise tr.urllib.error.URLError("coupure")
        return FakeResponse({"response": "ok", "done_reason": "stop"})

    calls = use_fake_urlopen(monkeypatch, flaky)
    assert tr.ask("x") == "ok" and len(calls) == 2


def test_ask_does_not_retry_when_the_model_is_not_found(monkeypatch):
    def missing(n):
        raise tr.urllib.error.HTTPError("http://x", 404, "not found", {}, None)

    calls = use_fake_urlopen(monkeypatch, missing)
    with pytest.raises(tr.TranslationError, match="404"):
        tr.ask("x")
    assert len(calls) == 1


def test_ask_turns_garbage_into_a_clear_error(monkeypatch):
    use_fake_urlopen(monkeypatch, lambda n: FakeResponse({"pas_de_reponse": 1}))
    with pytest.raises(tr.TranslationError, match="invalide"):
        tr.ask("x")


def test_chunks_respect_the_size_limit_and_lose_nothing():
    _, text = first_text_with("Ligne 3 - ")
    for section in tr.split_sections(text):
        chunks = tr.split_into_chunks(section, 400)
        assert all(len(c) <= 400 or "." not in c[:-1] for c in chunks)      # une phrase seule peut dépasser
        rebuilt = "\n".join(c for c in chunks)
        assert tr._number_sequence(rebuilt) == tr._number_sequence(section)
        assert [l for l in section.splitlines() if l.strip()] == [l for l in rebuilt.splitlines() if l.strip()]


@pytest.mark.parametrize("lang", LANGS)
def test_translate_report_works_chunk_by_chunk_with_small_chunks(monkeypatch, lang):
    monkeypatch.setattr(tr, "CHUNK_CHARS", 300)
    seen = []

    def model(prompt):
        chunk = prompt.rsplit("Texte à traduire :\n", 1)[1]
        seen.append(chunk)
        return dictionary_translation(chunk, lang)

    monkeypatch.setattr(tr, "ask", model)
    _, text = first_text_with("Ligne 3 - ")
    result = tr.translate_report(text, lang)
    assert result["translated"], result["reason"]
    assert len(seen) > len(tr.split_sections(text))               # plusieurs blocs par section


def test_prompt_contains_only_the_crop_names_of_the_target_language(monkeypatch):
    prompts = {}
    for lang in LANGS:
        monkeypatch.setattr(tr, "ask", lambda p, lang=lang: prompts.setdefault(lang, p) and "")
        _, text = first_text_with("Blé tendre sur")
        tr.translate_report(text, lang)
    assert "Blé tendre = Soft wheat" in prompts["en"] and "القمح" not in prompts["en"].split("FIXED CROP NAMES")[1].split("Meaning")[0]
    assert "Blé tendre = القمح اللين" in prompts["darija"] and "Soft wheat" not in prompts["darija"]


def test_prompt_only_lists_the_terms_present_in_the_chunk(monkeypatch):
    captured = []
    monkeypatch.setattr(tr, "ask", lambda p: captured.append(p) or "")
    tr.translate_report("=== PLAN ===\nLa pluie (500 mm) est acceptable.", "en")
    terms_part = captured[0].split("TERMINOLOGY TABLE")[1]
    lowered = terms_part.lower()
    assert "rainfall" in lowered and "soil ph" not in lowered and "nitrogen" not in lowered


def test_polite_intro_added_by_the_model_is_removed(monkeypatch):
    monkeypatch.setattr(tr, "ask", lambda p: "Here is the translated text:\n" + dictionary_translation(
        p.rsplit("Texte à traduire :\n", 1)[1], "en"))
    _, text = first_text_with("Adéquation au terrain")
    assert tr.translate_report(text, "en")["translated"]


def test_a_long_line_is_never_cut_in_the_middle_when_it_fits_in_a_chunk():
    """Défaut corrigé : une ligne « Astuce : ... » (2 phrases) ne doit pas être coupée en deux blocs."""
    section = "=== PLAN ===\n" + "\n".join(f"Raison : Phrase numéro {i} de test pour allonger la section." for i in range(14)) \
              + "\nAstuce : Première phrase de l'astuce. Deuxième phrase de l'astuce."
    chunks = tr.split_into_chunks(section, 200)
    assert len(chunks) > 1
    lines_in_chunks = [l for c in chunks for l in c.splitlines() if l.strip()]
    assert lines_in_chunks == [l for l in section.splitlines() if l.strip()]
    assert any(l.startswith("Astuce : Première phrase de l'astuce. Deuxième") for l in lines_in_chunks)


def test_a_single_line_longer_than_the_limit_is_cut_between_sentences():
    long_line = "Astuce : " + " ".join(f"Phrase {i} assez longue pour dépasser." for i in range(30))
    chunks = tr.split_into_chunks(long_line, 150)
    assert len(chunks) > 1 and all(len(c) <= 150 for c in chunks)
    assert tr._number_sequence(" ".join(chunks)) == tr._number_sequence(long_line)


# ----------------------------------------------------- 7. écritures naturelles acceptées, dictionnaire de base

def _swap_in_line(text, old, new):
    assert old in text, (old, text)
    return text.replace(old, new, 1)


def test_natural_english_phrasings_of_counts_are_accepted():
    """Défaut corrigé : « 1 good choice, 0 at risk, 1 to avoid » et « 100 % cereals » sont des traductions correctes."""
    _, text = first_text_with("bons choix : 1, à risque : 0, à éviter : 1")
    good = dictionary_translation(text, "en")
    assert check("en", text, good) == []
    number_first = good.replace("good choices : 1, at risk : 0, to avoid : 1", "1 good choice, 0 at risk, 1 to avoid")
    assert number_first != good and check("en", text, number_first) == []

    _, text = first_text_with("Composition du plan : céréales 100 %")
    good = dictionary_translation(text, "en")
    assert check("en", text, _swap_in_line(good, "cereals 100 %", "100 % cereals")) == []
    assert check("en", text, _swap_in_line(good, "cereals 100 %", "100% of cereals")) == []


def test_natural_phrasing_does_not_let_swapped_percentages_through():
    _, text = first_text_with("Composition du plan : légumineuses 67 %, famille de l'oignon 33 %")
    good = dictionary_translation(text, "en")
    assert check("en", text, good) == []
    swapped = _swap_in_line(good, "legumes 67 %, onion family 33 %", "onion family 67 %, legumes 33 %")
    assert any("associé" in p for p in check("en", text, swapped))
    number_first_swapped = _swap_in_line(good, "legumes 67 %, onion family 33 %", "33 % legumes, 67 % onion family")
    assert any("associé" in p for p in check("en", text, number_first_swapped))


def test_singular_and_plural_of_english_labels_are_both_accepted():
    _, text = first_text_with("Composition du plan : céréales 100 %")
    good = dictionary_translation(text, "en")
    assert check("en", text, _swap_in_line(good, "cereals 100 %", "cereal 100 %")) == []


def test_base_dictionary_fills_terms_removed_from_the_team_file(tmp_path, monkeypatch):
    """Cas réel : le termes_darija.json de l'équipe a perdu des termes et le groupe « cultures »."""
    import json
    import shutil
    for name in ("termes_darija_base.json", "termes_darija_a_valider.json"):
        shutil.copy(tr.HERE / name, tmp_path / name)
    (tmp_path / "termes_darija.json").write_text(
        json.dumps({"termes": {"Ligne": "ليني"}}, ensure_ascii=False), encoding="utf-8")
    monkeypatch.setattr(tr, "HERE", tmp_path)
    groups = groups_for("darija")
    flat = tr.flat_terms(groups)
    assert flat["à éviter"] and flat["légumineuses"] and groups["cultures"]["Blé tendre"]
    assert flat["Ligne"] == "ليني"                      # le fichier de l'équipe gagne toujours


def test_the_prompt_starts_with_the_fixed_part_and_ends_with_the_variable_part():
    """Les parties fixes en premier permettent à Ollama de réutiliser son cache entre deux blocs."""
    fixed_end = tr.PROMPT.index("{crops}")
    assert tr.PROMPT.index("{glossary}") < fixed_end < tr.PROMPT.index("{terms}") < tr.PROMPT.index("{text}")


# ----------------------------------------------------- 8. ligne unique coupée en deux par le modèle

def test_a_single_line_wrapped_by_the_model_is_glued_back():
    source = "Une meilleure option existe : Lentille (score 89 sur 100, +19 points), Pois chiche (score 87 sur 100, +17 points)."
    wrapped = "A better option exists: Lentil (score 89 out of 100, +19 points),\nChickpea (score 87 out of 100, +17 points)."
    assert tr._merge_wrapped_lines(source, wrapped) == wrapped.replace("\n", " ")


def test_a_comment_added_after_a_full_stop_is_not_glued():
    source = "Une meilleure option existe : Lentille (score 89 sur 100, +19 points)."
    with_comment = "A better option exists: Lentil (score 89 out of 100, +19 points).\nNote: this is a good option."
    assert tr._merge_wrapped_lines(source, with_comment) == with_comment      # inchangé, donc refusé ensuite
    assert check("en", source, with_comment)


def test_multi_line_chunks_are_never_merged():
    source = "Raison : A 18 °C.\nRaison : B 500 mm."
    answer = "Reason: A 18 °C,\nReason: B 500 mm."
    assert tr._merge_wrapped_lines(source, answer) == answer


def test_wrapped_single_line_chunk_is_translated_and_accepted(monkeypatch):
    source = "Une meilleure option existe : Lentille (score 89 sur 100, +19 points), Pois chiche (score 87 sur 100, +17 points)."
    monkeypatch.setattr(tr, "ask", lambda p: "A better option exists: Lentil (score 89 out of 100, +19 points),\n"
                                              "Chickpea (score 87 out of 100, +17 points).")
    result = tr.translate_report(source, "en")          # un seul bloc d'une seule ligne
    assert result["translated"], result["reason"]


def test_failure_reason_says_which_block_failed(monkeypatch):
    monkeypatch.setattr(tr, "ask", lambda p: "")
    result = tr.translate_report("=== PLAN ===\nScore 87 sur 100.", "en")
    assert "section 1/1, bloc 1/1" in result["reason"]


# ----------------------------------------------------- 9. « avoid » = « to avoid » ; mémoire des blocs validés

def test_avoid_is_accepted_for_to_avoid_in_counts_and_verdicts():
    """Cas réel : le modèle a écrit « (good choices: 3, at risk: 0, avoid: 0) », ce qui est correct."""
    _, text = first_text_with("bons choix : 1, à risque : 0, à éviter : 1")
    good = dictionary_translation(text, "en")
    assert check("en", text, good) == []
    assert check("en", text, good.replace("to avoid : 1", "avoid : 1")) == []
    assert check("en", text, good.replace("to avoid : 1", "to avoid: 1")) == []
    headline = good.replace("to avoid.", "avoid.")
    assert headline != good and check("en", text, headline) == []


def test_not_viable_is_still_different_from_viable():
    _, text = first_text_with("Plan : en partie viable.")
    flat = tr.flat_terms(groups_for("en"))
    good = dictionary_translation(text, "en")
    assert check("en", text, good.replace(flat["en partie viable"], flat["non viable"], 1))


def _counting_model(monkeypatch, lang, calls):
    def model(prompt):
        calls.append(1)
        return dictionary_translation(prompt.rsplit("Texte à traduire :\n", 1)[1], lang)
    monkeypatch.setattr(tr, "ask", model)


def test_cache_is_off_by_default_and_writes_nothing(tmp_path, monkeypatch):
    monkeypatch.setattr(tr, "CACHE_FILE", tmp_path / "cache.json")
    calls = []
    _counting_model(monkeypatch, "en", calls)
    _, text = first_text_with("Adéquation au terrain")
    tr.translate_report(text, "en")
    assert not (tmp_path / "cache.json").exists()


def test_cache_reuses_validated_blocks(tmp_path, monkeypatch):
    monkeypatch.setattr(tr, "CACHE_FILE", tmp_path / "cache.json")
    monkeypatch.setattr(tr, "USE_CACHE", True)
    calls = []
    _counting_model(monkeypatch, "en", calls)
    _, text = first_text_with("Adéquation au terrain")
    first = tr.translate_report(text, "en")
    calls_first = len(calls)
    second = tr.translate_report(text, "en")
    assert first["translated"] and second["translated"] and second["text"] == first["text"]
    assert calls_first > 0 and len(calls) == calls_first          # aucun nouvel appel au modèle


def test_cache_never_serves_a_translation_that_no_longer_passes_the_checks(tmp_path, monkeypatch):
    import json
    monkeypatch.setattr(tr, "CACHE_FILE", tmp_path / "cache.json")
    monkeypatch.setattr(tr, "USE_CACHE", True)
    calls = []
    _counting_model(monkeypatch, "en", calls)
    _, text = first_text_with("Adéquation au terrain")
    tr.translate_report(text, "en")
    cache = json.loads((tmp_path / "cache.json").read_text(encoding="utf-8"))
    (tmp_path / "cache.json").write_text(json.dumps({k: "texte abîmé" for k in cache}), encoding="utf-8")
    before = len(calls)
    result = tr.translate_report(text, "en")
    assert result["translated"] and len(calls) > before          # le modèle a été rappelé


def test_cache_is_not_used_with_the_minimal_check(tmp_path, monkeypatch):
    monkeypatch.setattr(tr, "CACHE_FILE", tmp_path / "cache.json")
    monkeypatch.setattr(tr, "USE_CACHE", True)
    calls = []
    _counting_model(monkeypatch, "en", calls)
    tr.translate("=== PLAN ===\nScore 87 sur 100.", "en")          # contrôle minimal (numéros seulement)
    assert not (tmp_path / "cache.json").exists()


def test_cache_key_changes_with_the_model(monkeypatch):
    monkeypatch.setattr(tr, "MODEL", "a")
    k1 = tr._cache_key("English", "texte", {})
    monkeypatch.setattr(tr, "MODEL", "b")
    assert k1 != tr._cache_key("English", "texte", {})
