"""mapping.py - transforme la reponse du client NASA POWER en entree du moteur.

Aucune dependance Django : la fonction recoit le dict renvoye par
fetch_climate_data() (cles : status, data, provenance, ...).
"""
from calendar import isleap, monthrange
from collections import defaultdict

# Part minimale de jours valides pour garder une annee dans la moyenne.
# La pluie marocaine tombe surtout en hiver : une annee trop incomplete a pu
# perdre sa saison humide, et son cumul serait faux.
MIN_YEAR_COVERAGE = 0.95
# Part minimale de jours valides pour garder un mois dans le profil mensuel.
MIN_MONTH_COVERAGE = 0.9

# NASA POWER met -999 quand la valeur manque.
MISSING_BELOW = -990


def _days_in_year(year):
    return 366 if isleap(int(year)) else 365


def _mean(values):
    return sum(values) / len(values)


def _valid(value):
    return value is not None and value > MISSING_BELOW


def _annual_values(daily, reducer):
    """daily = {"YYYYMMDD": valeur}. Retourne {annee: reducer(valeurs, annee)}
    en ignorant les valeurs manquantes et les annees trop incompletes."""
    by_year = defaultdict(list)
    for date_str, value in daily.items():
        if _valid(value):
            by_year[date_str[:4]].append(value)

    result = {}
    for year, values in sorted(by_year.items()):
        if len(values) / _days_in_year(year) >= MIN_YEAR_COVERAGE:
            result[year] = reducer(values, year)
    return result


def _month_values(daily, reducer):
    """{(annee, mois): reducer(valeurs, nb_jours_du_mois)} pour les mois assez complets."""
    by_month = defaultdict(list)
    for date_str, value in daily.items():
        if _valid(value):
            by_month[(int(date_str[:4]), int(date_str[4:6]))].append(value)

    result = {}
    for (year, month), values in by_month.items():
        days = monthrange(year, month)[1]
        if len(values) / days >= MIN_MONTH_COVERAGE:
            result[(year, month)] = reducer(values, days)
    return result


def monthly_climatology(data):
    """Profil moyen de l'annee : {"temp_c": [12 valeurs], "rain_mm": [12 valeurs]}
    (janvier a decembre : temperature moyenne, cumul mensuel de pluie), ou None
    s'il manque un mois."""
    temps = _month_values(data.get("T2M", {}), lambda v, days: _mean(v))
    rains = _month_values(data.get("PRECTOTCORR", {}), lambda v, days: _mean(v) * days)
    temp_12, rain_12 = [], []
    for month in range(1, 13):
        t = [v for (_, m), v in temps.items() if m == month]
        r = [v for (_, m), v in rains.items() if m == month]
        if not t or not r:
            return None
        temp_12.append(round(_mean(t), 1))
        rain_12.append(round(_mean(r), 1))
    return {"temp_c": temp_12, "rain_mm": rain_12}


def climate_to_parcel(climate, soil=None, irrigated=None):
    """
    climate   : dict renvoye par fetch_climate_data()
    soil      : {"ph": ..., "salinity_dsm": ...} saisi par l'agriculteur, ou None
    irrigated : True, False ou None (inconnu)

    Retourne {"parcel": {...}, "monthly": {...} ou None, "irrigated": ..., "meta": {...}}
      temp_c  = temperature moyenne annuelle (T2M, degres C)
      rain_mm = cumul annuel moyen (PRECTOTCORR est en mm/jour : moyenne
                journaliere x nombre de jours de l'annee). Les seuils de pluie
                ECOCROP sont annuels : on compare bien un cumul annuel.
      monthly = profil mensuel moyen, pour calculer la temperature sur le cycle
                de chaque culture.
      meta["usable"] = False si les donnees sont des donnees d'exemple ou s'il
                manque la temperature ou la pluie : dans ce cas, ne pas recommander.
    """
    data = climate.get("data", {})
    soil = soil or {}
    notes = []

    temp_by_year = _annual_values(data.get("T2M", {}), lambda v, y: _mean(v))
    rain_by_year = _annual_values(
        data.get("PRECTOTCORR", {}), lambda v, y: _mean(v) * _days_in_year(y)
    )

    temp_c = round(_mean(temp_by_year.values()), 1) if temp_by_year else None
    rain_mm = round(_mean(rain_by_year.values())) if rain_by_year else None
    monthly = monthly_climatology(data)

    if temp_c is None:
        notes.append("temperature indisponible (annees trop incompletes)")
    if rain_mm is None:
        notes.append("pluie indisponible (annees trop incompletes)")
    if monthly is None:
        notes.append("profil mensuel indisponible : la saison de culture n'est pas prise en compte")

    status = climate.get("status")
    if status == "sample":
        notes.append("donnees d'exemple : NASA POWER injoignable, ne pas utiliser pour une vraie decision")
    elif status == "cached":
        notes.append("donnees en cache (NASA POWER injoignable au moment de l'appel)")

    # Humidite du sol en zone racinaire (GWETROOT, 0 = sec, 1 = sature) : indicateur,
    # pas utilise dans le score des cultures.
    wetness = [v for v in data.get("GWETROOT", {}).values() if _valid(v)]

    provenance = climate.get("provenance", {})
    return {
        "parcel": {
            "temp_c": temp_c,
            "rain_mm": rain_mm,
            "ph": soil.get("ph"),
            "salinity_dsm": soil.get("salinity_dsm"),
        },
        "monthly": monthly,
        "irrigated": irrigated,
        "meta": {
            "data_status": status,
            "usable": status != "sample" and temp_c is not None and rain_mm is not None,
            "source": provenance.get("source"),
            "period": provenance.get("period"),
            "latitude": provenance.get("latitude"),
            "longitude": provenance.get("longitude"),
            "years_used": sorted(rain_by_year),
            "rain_mm_dry_year": round(min(rain_by_year.values())) if rain_by_year else None,
            "soil_wetness_root": round(_mean(wetness), 2) if wetness else None,
            "notes": notes,
        },
    }


def to_engine_parcel(climate, soil=None, irrigated=None, history=None):
    """Retourne (parcelle au format du moteur, meta).

    Les valeurs inconnues sont retirees (et non mises a None) pour que le moteur
    les voie comme manquantes ; irrigated inconnu = cle absente ; le profil
    mensuel n'est ajoute que s'il est complet.
    """
    mapped = climate_to_parcel(climate, soil, irrigated)
    conditions = {k: v for k, v in mapped["parcel"].items() if v is not None}
    parcel = {"conditions": conditions, "history": history or []}
    if mapped["monthly"]:
        parcel["monthly"] = mapped["monthly"]
    if mapped["irrigated"] is not None:
        parcel["irrigated"] = mapped["irrigated"]
    return parcel, mapped["meta"]