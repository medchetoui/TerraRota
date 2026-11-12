from engine.api import recommend

CONFIG = {
    "weights": {"temp_c": 0.5, "rain_mm": 0.5},
    "verdict_thresholds": {"viable": 70, "risky": 40},
}
CROPS = {
    "ble": {"name_fr": "Blé", "temp_c": [5, 15, 23, 27], "rain_mm": [300, 750, 900, 1600]},
    "pois": {"name_fr": "Pois chiche", "temp_c": [7, 15, 29, 35], "rain_mm": [300, 600, 1000, 1800]},
}


def names(items):
    return [item["crop"] for item in items]


def test_excluded_crop_is_not_ranked():
    out = recommend({"temp_c": 32, "rain_mm": 800}, crops=CROPS, config=CONFIG)
    assert names(out["excluded"]) == ["ble"]      # 32 depasse le maximum du ble
    assert names(out["ranked"]) == ["pois"]       # 32 reste possible pour le pois


def test_ranking_order_and_rank_numbers():
    out = recommend({"temp_c": 25, "rain_mm": 800}, crops=CROPS, config=CONFIG)
    assert names(out["ranked"]) == ["pois", "ble"]
    assert [item["rank"] for item in out["ranked"]] == [1, 2]
    assert out["ranked"][0]["score"] > out["ranked"][1]["score"]


def test_irrigation_neutralises_rain():
    parcel = {"temp_c": 18, "rain_mm": 200}
    dry = recommend(parcel, irrigated=False, crops=CROPS, config=CONFIG)
    assert dry["ranked"] == []                    # pluie trop faible : tout exclu
    wet = recommend(parcel, irrigated=True, crops=CROPS, config=CONFIG)
    assert sorted(names(wet["ranked"])) == ["ble", "pois"]
    assert all(item["score"] == 100 for item in wet["ranked"])


def test_empty_parcel_is_not_evaluated():
    out = recommend({}, crops=CROPS, config=CONFIG)
    assert out["ranked"] == [] and out["excluded"] == []
    assert sorted(names(out["not_evaluated"])) == ["ble", "pois"]