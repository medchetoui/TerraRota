from engine.scoring import trapezoid, score_crop

WHEAT = {
    "temp_c": [5, 15, 23, 27],
    "rain_mm": [300, 750, 900, 1600],
    "ph": [5.5, 6, 7, 8.5],
    "salinity_dsm": [0, 0, 4, 10],
}
CONFIG = {"weights": {"temp_c": 0.35, "rain_mm": 0.40, "ph": 0.15, "salinity_dsm": 0.10}}


def test_trapezoid_zones():
    assert trapezoid(3, 5, 15, 23, 27) == 0.0       # sous le minimum absolu
    assert trapezoid(10, 5, 15, 23, 27) == 0.5      # montee
    assert trapezoid(20, 5, 15, 23, 27) == 1.0      # optimum
    assert trapezoid(25, 5, 15, 23, 27) == 0.5      # descente
    assert trapezoid(30, 5, 15, 23, 27) == 0.0      # au-dessus du maximum
    assert trapezoid(None, 5, 15, 23, 27) is None   # inconnu


def test_trapezoid_flat_start():
    # salinite [0, 0, 4, 10] : a == b, ne doit pas planter
    assert trapezoid(0, 0, 0, 4, 10) == 1.0
    assert trapezoid(7, 0, 0, 4, 10) == 0.5
    assert trapezoid(12, 0, 0, 4, 10) == 0.0


def test_perfect_parcel():
    parcel = {"temp_c": 18, "rain_mm": 800, "ph": 6.5, "salinity_dsm": 2}
    result = score_crop(parcel, WHEAT, CONFIG)
    assert result["score"] == 100
    assert result["blockers"] == []
    assert result["missing"] == []


def test_dry_parcel_lowers_score_without_blocking():
    parcel = {"temp_c": 18, "rain_mm": 500, "ph": 6.5, "salinity_dsm": 2}
    result = score_crop(parcel, WHEAT, CONFIG)
    assert 0 < result["score"] < 100
    assert result["blockers"] == []


def test_hot_parcel_is_blocked():
    parcel = {"temp_c": 32, "rain_mm": 800, "ph": 6.5, "salinity_dsm": 2}
    result = score_crop(parcel, WHEAT, CONFIG)
    assert "temp_c" in result["blockers"]


def test_missing_data_is_reported_not_zero():
    parcel = {"temp_c": 18, "rain_mm": 800, "ph": None, "salinity_dsm": None}
    result = score_crop(parcel, WHEAT, CONFIG)
    assert result["missing"] == ["ph", "salinity_dsm"]
    assert result["score"] == 100  # calcule sur temperature et pluie seulement