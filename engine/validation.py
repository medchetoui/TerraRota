"""validate_dataset.py - Validation des donnees (FICTIVES avant le 28 octobre)."""
import csv
from datetime import datetime

# ---------- CONFIGURATION (a adapter le 28 octobre) ----------
REQUIRED_FIELDS = ["observation", "value", "unit", "date", "source", "latitude", "longitude"]

# nom standard -> nom de la colonne dans le fichier
COLUMN_MAP = {
    "observation": "observation",
    "value": "value",
    "unit": "unit",
    "date": "date",
    "source": "source",
    "latitude": "latitude",
    "longitude": "longitude",
}

EXPECTED_UNITS = {"precipitation": "mm", "temperature": "C"}  # exemples FICTIFS, a confirmer
MAX_AGE_DAYS = 365  # exemple, a confirmer
# --------------------------------------------------------------


def load_rows(path):
    """Lit le fichier CSV et renvoie une liste de lignes."""
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def get_value(row, field):
    """Renvoie la valeur d'un champ standard, quel que soit le nom de la colonne."""
    return row.get(COLUMN_MAP[field])


def check_missing(rows):
    """Signale les champs obligatoires vides."""
    issues = []
    for i, row in enumerate(rows, start=2):  # start=2 : la ligne 1 est l'en-tete
        for field in REQUIRED_FIELDS:
            value = get_value(row, field)
            if value is None or value.strip() == "":
                issues.append({"line": i, "field": field, "problem": "valeur manquante"})
    return issues

def check_dates(rows):
    """Signale les dates qui ne respectent pas le format AAAA-MM-JJ."""
    issues = []
    for i, row in enumerate(rows, start=2):
        value = get_value(row, "date")
        if value is None or value.strip() == "":
            continue  # deja signale comme manquant
        try:
            datetime.strptime(value.strip(), "%Y-%m-%d")
        except ValueError:
            issues.append({"line": i, "field": "date", "problem": "date invalide"})
    return issues
def check_duplicates(rows):
    """Signale les lignes qui decrivent la meme observation (meme date, meme position)."""
    issues = []
    seen = {}  # cle -> numero de la premiere ligne ou on l'a vue
    for i, row in enumerate(rows, start=2):
        key = tuple(
            (get_value(row, f) or "").strip()
            for f in ("observation", "date", "latitude", "longitude")
        )
        if key in seen:
            issues.append({
                "line": i,
                "field": "record",
                "problem": f"doublon de la ligne {seen[key]}",
            })
        else:
            seen[key] = i
    return issues
def check_coordinates(rows):
    """Signale les latitudes/longitudes qui ne sont pas des nombres ou hors limites."""
    issues = []
    limits = {"latitude": (-90, 90), "longitude": (-180, 180)}
    for i, row in enumerate(rows, start=2):
        for field, (low, high) in limits.items():
            raw = get_value(row, field)
            if raw is None or raw.strip() == "":
                continue  # deja signale comme manquant
            try:
                number = float(raw.strip())
            except ValueError:
                issues.append({"line": i, "field": field, "problem": "n'est pas un nombre"})
                continue
            if not (low <= number <= high):
                issues.append({
                    "line": i,
                    "field": field,
                    "problem": f"hors limites ({low} a {high})",
                })
    return issues
def check_units(rows):
    """Signale les unites differentes de celles attendues pour chaque observation."""
    issues = []
    for i, row in enumerate(rows, start=2):
        obs = (get_value(row, "observation") or "").strip()
        unit = (get_value(row, "unit") or "").strip()
        if obs == "" or unit == "":
            continue  # deja signale comme manquant
        expected = EXPECTED_UNITS.get(obs)
        if expected is not None and unit != expected:
            issues.append({
                "line": i,
                "field": "unit",
                "problem": f"unite inattendue '{unit}' (attendu '{expected}')",
            })
    return issues
def check_freshness(rows):
    """Signale les observations trop anciennes ou datees dans le futur."""
    issues = []
    now = datetime.now()
    for i, row in enumerate(rows, start=2):
        raw = get_value(row, "date")
        if raw is None or raw.strip() == "":
            continue  # deja signale comme manquant
        try:
            observed = datetime.strptime(raw.strip(), "%Y-%m-%d")
        except ValueError:
            continue  # deja signale comme date invalide
        age_days = (now - observed).days
        if age_days < 0:
            issues.append({"line": i, "field": "date", "problem": "date dans le futur"})
        elif age_days > MAX_AGE_DAYS:
            issues.append({
                "line": i,
                "field": "date",
                "problem": f"donnee trop ancienne ({age_days} jours, max {MAX_AGE_DAYS})",
            })
    return issues

def validate(path):
    """Lance tous les controles et renvoie la liste des problemes."""
    rows = load_rows(path)
    issues = []
    issues += check_missing(rows)
    issues += check_dates(rows)
    issues += check_duplicates(rows)
    issues += check_coordinates(rows)
    issues += check_units(rows)
    issues += check_freshness(rows)
    return issues


if __name__ == "__main__":
    for issue in validate("tests/fixtures/sample_fictif.csv"):
        print(issue)