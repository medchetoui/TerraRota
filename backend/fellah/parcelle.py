"""Parcelle du formulaire → entrée du moteur du Membre 2 (moteur/engine, report.analyze).

Règle : une information absente ou que le moteur ne connaît pas devient « inconnu » (None), jamais une valeur
inventée. Le moteur compte alors la donnée comme manquante et baisse sa confiance.

Correspondance (formulaire → moteur) :
    indicators.annual_rain_mm      → conditions.rain_mm   (seulement si data_status = live ou cached)
    indicators.mean_annual_temp_c  → conditions.temp_c    (idem)
    —                              → conditions.ph, conditions.salinity_dsm : inconnus (pas dans le formulaire)
    water_access  rainfed / irrigated / partial → irrigated  False / True / inconnu
    previous_crop (voir CULTURES)  → history [{crop, year: année - 1}] ; jachère ou culture inconnue du moteur → []
    field_size_ha                  → area_ha de la ligne du plan
    soil_type                      → non utilisé par le moteur (gardé dans « inconnus » pour le dire)
    plan : la culture citée dans la question si le moteur la connaît, sinon aucun plan (le moteur en propose un).
"""
import re
import sys
from datetime import date
from pathlib import Path

MOTEUR = Path(__file__).resolve().parents[2] / "moteur"

CULTURES = {
    "wheat_hard": "ble_dur", "wheat_soft": "ble_tendre", "barley": "orge", "olive": "olivier",
    "chickpea": "pois_chiche", "potato": "pomme_de_terre", "lentil": "lentille", "faba_bean": "feve",
}
CULTURES_HORS_MOTEUR = ("argan", "tomato", "cactus_pear", "almond")
EAU = {"rainfed": False, "irrigated": True}
DONNEES_FIABLES = ("live", "cached")
BLES = ("ble_tendre", "ble_dur")
PRECISION_BLE = re.compile(r"طري|صلب|tendre|dur|rtab|tri|sl[ae]b", re.IGNORECASE)
CHAMPS_PARCELLE = ("latitude", "longitude", "previous_crop", "water_access", "soil_type", "field_size_ha",
                   "data_status", "annual_rain_mm", "mean_annual_temp_c")


def _moteur():
    if str(MOTEUR) not in sys.path:
        sys.path.insert(0, str(MOTEUR))
    from engine.config import load_crops
    from engine.report import analyze
    return load_crops, analyze


def _nombre(v):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return x if x == x and abs(x) != float("inf") else None


def entree_moteur(formulaire, culture=None, annee=None):
    """Renvoie (parcels, plan, correspondance) ; correspondance liste chaque champ et sa valeur pour le moteur."""
    f = formulaire or {}
    annee = annee or date.today().year
    fiable = f.get("data_status") in DONNEES_FIABLES
    pluie = _nombre(f.get("annual_rain_mm")) if fiable else None
    temp = _nombre(f.get("mean_annual_temp_c")) if fiable else None
    eau = EAU.get(f.get("water_access"))
    precedent = f.get("previous_crop")
    historique = [{"crop": CULTURES[precedent], "year": annee - 1}] if precedent in CULTURES else []
    surface = _nombre(f.get("field_size_ha"))
    surface = surface if surface and surface > 0 else None
    parcels = {"P1": {"conditions": {"temp_c": temp, "rain_mm": pluie, "ph": None, "salinity_dsm": None},
                      "irrigated": eau, "history": historique}}
    plan = [{"parcel": "P1", "crop": culture, "area_ha": surface}] if culture else []
    correspondance = {
        "rain_mm": pluie if pluie is not None else "inconnu",
        "temp_c": temp if temp is not None else "inconnu",
        "ph": "inconnu",
        "salinity_dsm": "inconnu",
        "irrigated": eau if eau is not None else "inconnu",
        "history": historique[0]["crop"] if historique else ("jachère" if precedent == "fallow" else "inconnu"),
        "area_ha": surface if surface is not None else "inconnu",
        "soil_type": "non utilisé par le moteur",
        "plan": culture or "aucun (le moteur propose)",
    }
    return parcels, plan, correspondance


def culture_pour_parcelle(culture, question, formulaire):
    """« القمح » sans précision = le blé que l'agriculteur a cultivé (dur ou tendre), s'il est connu."""
    precedent = CULTURES.get((formulaire or {}).get("previous_crop"))
    if culture in BLES and precedent in BLES and not PRECISION_BLE.search(question or ""):
        return precedent
    return culture


def scenario_parcelle(formulaire, culture=None, annee=None, question=None):
    """Scénario au format de repondre_darija (parcels, plan, rapport) calculé par le moteur du Membre 2."""
    load_crops, analyze = _moteur()
    crops = load_crops()
    culture = culture_pour_parcelle(culture, question, formulaire)
    culture = culture if culture in crops else None
    annee = annee or date.today().year
    parcels, plan, correspondance = entree_moteur(formulaire, culture, annee)
    rapport = analyze(plan, parcels, crops=crops, plan_year=annee)
    return {"id": "parcelle", "description": "parcelle du formulaire", "parcels": parcels, "plan": plan,
            "rapport": rapport, "correspondance": correspondance, "culture_question": culture}
