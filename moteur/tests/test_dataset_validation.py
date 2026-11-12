from pathlib import Path

from engine.validation import validate

FIXTURE = Path(__file__).parent / "fixtures" / "sample_fictif.csv"


def find_issue(issues, line, field):
    """Cherche un probleme precis (ligne + champ) dans la liste."""
    return [i for i in issues if i["line"] == line and i["field"] == field]


def test_detects_missing_value():
    issues = validate(FIXTURE)
    assert find_issue(issues, 4, "value")  # la ligne 4 a une valeur manquante
def test_detects_invalid_date():
    issues = validate(FIXTURE)
    assert find_issue(issues, 5, "date")  # mois 13, jour 45


def test_detects_duplicate():
    issues = validate(FIXTURE)
    assert find_issue(issues, 6, "record")  # doublon de la ligne 2


def test_detects_invalid_latitude():
    issues = validate(FIXTURE)
    assert find_issue(issues, 7, "latitude")  # latitude 200


def test_detects_unexpected_unit():
    issues = validate(FIXTURE)
    assert find_issue(issues, 8, "unit")  # kg au lieu de mm


def test_detects_stale_observation():
    issues = validate(FIXTURE)
    assert find_issue(issues, 9, "date")  # observation de 2010


def test_valid_lines_have_no_issue():
    issues = validate(FIXTURE)
    flagged_lines = {i["line"] for i in issues}
    for valid_line in (2, 3, 10, 11):
        assert valid_line not in flagged_lines


def test_finds_exactly_six_issues():
    issues = validate(FIXTURE)
    assert len(issues) == 6    