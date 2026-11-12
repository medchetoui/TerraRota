from engine.indicators import climate_fit
from tests.test_whatif import CONFIG, CROPS


def test_climate_fit_uses_the_same_thresholds_as_the_engine():
    rows = {r["crop"]: r for r in climate_fit({"temp_c": 18, "rain_mm": 650}, CROPS, CONFIG)}
    assert rows["ble"]["rain"] == "tolerable"      # idéal 750-900
    assert rows["pois"]["rain"] == "optimal"       # idéal 600-1000
    assert rows["ble"]["temp"] == "optimal"