from engine.config import load_crops

CRITERIA = ["temp_c", "rain_mm", "ph"]


def test_every_crop_has_valid_limits():
    for key, crop in load_crops().items():
        for criterion in CRITERIA:
            limits = crop.get(criterion)
            if limits is None:
                continue
            assert len(limits) == 4, f"{key}.{criterion} doit avoir 4 valeurs"
            assert limits == sorted(limits), f"{key}.{criterion} doit être croissant"


def test_every_crop_has_required_fields():
    for key, crop in load_crops().items():
        for field in ["name_fr", "type", "family", "source"]:
            assert field in crop, f"{key} : champ '{field}' manquant"
        assert crop["type"] in ("annual", "perennial"), f"{key} : type inconnu"
        
def test_every_alternative_exists():
    crops = load_crops()
    for key, crop in crops.items():
        for alt in crop.get("alternatives", []):
            assert alt in crops, f"{key} : alternative '{alt}' absente du fichier"


def test_no_crop_lists_itself_as_alternative():
    for key, crop in load_crops().items():
        assert key not in crop.get("alternatives", []), f"{key} est sa propre alternative"


def test_all_twelve_crops_are_present():
    expected = {"ble_tendre", "ble_dur", "orge", "pois_chiche", "feve", "lentille",
                "pomme_de_terre", "oignon", "olivier", "oranger", "clementinier", "caprier"}
    assert set(load_crops()) == expected        