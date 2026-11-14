"""config.py - chargement des fichiers JSON du moteur."""
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"


def load_json(name):
    """Lit un fichier JSON du dossier engine/data."""
    with open(DATA_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def load_config():
    """Poids et seuils du moteur."""
    return load_json("config.json")


def load_crops():
    """Table de référence des cultures."""
    return load_json("crops_reference.json")