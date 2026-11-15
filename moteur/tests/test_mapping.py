from datetime import date, timedelta

from engine.mapping import climate_to_parcel, to_engine_parcel
from engine.plan import evaluate_plan


def year_days(year):
    d = date(year, 1, 1)
    while d.year == year:
        yield d.strftime("%Y%m%d")
        d += timedelta(days=1)


def fake_climate(years=(2021, 2022), temp=20.0, rain=1.0, status="live"):
    return {
        "status": status,
        "data": {"T2M": {d: temp for y in years for d in year_days(y)},
                 "PRECTOTCORR": {d: rain for y in years for d in year_days(y)}},
        "provenance": {"source": "NASA POWER", "period": "2021-2022",
                       "latitude": 33.89, "longitude": -5.0},
    }


def test_annual_values_from_daily_data():
    out = climate_to_parcel(fake_climate())
    assert out["parcel"]["temp_c"] == 20.0
    assert out["parcel"]["rain_mm"] == 365          # 1 mm/jour x 365 jours
    assert out["meta"]["years_used"] == ["2021", "2022"]


def test_nasa_missing_values_are_ignored():
    climate = fake_climate()
    for day in list(year_days(2021))[:10]:
        climate["data"]["T2M"][day] = -999
        climate["data"]["PRECTOTCORR"][day] = -999
    out = climate_to_parcel(climate)
    assert out["parcel"]["temp_c"] == 20.0 and out["parcel"]["rain_mm"] == 365


def test_incomplete_year_is_left_out():
    climate = fake_climate()
    partial = list(year_days(2023))[:100]
    climate["data"]["T2M"].update({d: 40.0 for d in partial})
    climate["data"]["PRECTOTCORR"].update({d: 9.0 for d in partial})
    out = climate_to_parcel(climate)
    assert out["meta"]["years_used"] == ["2021", "2022"]
    assert out["parcel"]["temp_c"] == 20.0


def test_sample_data_is_flagged():
    out = climate_to_parcel(fake_climate(status="sample"))
    assert out["meta"]["data_status"] == "sample"
    assert any("exemple" in note for note in out["meta"]["notes"])


def test_unknown_values_are_removed_for_the_engine():
    parcel, _ = to_engine_parcel(fake_climate())
    assert parcel["conditions"] == {"temp_c": 20.0, "rain_mm": 365}
    assert "irrigated" not in parcel and parcel["history"] == []


def test_engine_runs_without_soil_and_says_what_is_missing():
    parcel, _ = to_engine_parcel(fake_climate(), history=[])
    out = evaluate_plan([{"parcel": "P1", "crop": "ble_tendre", "area_ha": 1}], {"P1": parcel})
    line = out["lines"][0]
    assert set(line["missing"]) == {"ph", "salinity_dsm"}
    assert line["score"] is not None                 # le calcul se fait sur le climat
    assert line["confidence"]["percent"] < 85        # la fiabilité baisse
def test_monthly_profile_is_complete_and_consistent():
    parcel, meta = to_engine_parcel(fake_climate())
    monthly = parcel["monthly"]
    assert len(monthly["temp_c"]) == 12 and monthly["temp_c"][0] == 20.0
    assert monthly["rain_mm"][0] == 31.0 and monthly["rain_mm"][1] == 28.0
    assert sum(monthly["rain_mm"]) == parcel["conditions"]["rain_mm"]      # même total que le cumul annuel    