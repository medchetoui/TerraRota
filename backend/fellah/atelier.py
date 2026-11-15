"""Outils de préparation de la démo (seulement en développement, DEBUG) :
- enregistrer les clips darija (voix humaine) : /advisor?enregistrer
- relire et valider les phrases darija : /advisor?relire

Les clips sont écrits dans frontend/public/audio/darija/<id>.wav ; enregistrements.json garde le texte lu pour
chaque clip (un clip dont le texte a changé depuis est « à réenregistrer »). Les phrases validées ou modifiées
sont écrites dans fellah/darija/templates_darija.json (statut « validé par Ranya »).
"""
import csv
import io
import json
import os
import re
import tempfile
import wave
from datetime import datetime
from pathlib import Path

from .darija import repondre_darija as RD

DARIJA_DIR = Path(RD.__file__).resolve().parent
SCENARIOS_DEMO = ("cereales_apres_cereale", "plan_equilibre")
STATUT_VALIDE = "validé par Ranya"
FREQUENCES = (16000, 22050)
DUREE_MIN_S, DUREE_MAX_S = 0.3, 20
TAILLE_MAX = 3 * 1024 * 1024
LONGUEUR_PHRASE_MAX = 200
CHIFFRES = re.compile(r"[0-9٠-٩۰-۹]")
ARABE = re.compile(r"[؀-ۿ]")


def questions_demo():
    with open(DARIJA_DIR / "questions_darija_brouillon.csv", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def clips_demo():
    """Clips nécessaires aux 20 questions de test sur les 2 scénarios de démo, dans l'ordre de CLIPS_DEMO_HIBA.md."""
    ids = []
    for sc in SCENARIOS_DEMO:
        for q in questions_demo():
            for groupe in RD.repondre_darija(q["question"], sc)["phrases"]:
                for i in groupe:
                    if i not in ids:
                        ids.append(i)
    return ids


def _manifeste(audio_dir):
    chemin = Path(audio_dir) / "enregistrements.json"
    return json.loads(chemin.read_text(encoding="utf-8")) if chemin.exists() else {}


def voix_du_clip(manifeste, clip):
    """« synthese » si le clip a été généré (generer_voix_synthese.py), sinon « humaine »."""
    return "synthese" if (manifeste.get(clip) or {}).get("source") == "synthese" else "humaine"


def noter_clip(audio_dir, clip, texte, source, **infos):
    manifeste = _manifeste(audio_dir)
    manifeste[clip] = {"texte": texte, "source": source, "quand": datetime.now().isoformat(timespec="seconds"), **infos}
    _ecrire_atomique(Path(audio_dir) / "enregistrements.json",
                     (json.dumps(manifeste, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8"))
    return manifeste[clip]


def _ecrire_atomique(chemin, octets):
    chemin = Path(chemin)
    chemin.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=chemin.parent, suffix=".tmp")
    with os.fdopen(fd, "wb") as f:
        f.write(octets)
    os.replace(tmp, chemin)


def etat_phrases(audio_dir):
    """Toutes les phrases hiba_ : texte, sens, statut, clip présent, clip à refaire ; les clips de la démo d'abord."""
    modeles = RD.modeles()
    demo = clips_demo()
    manifeste = _manifeste(audio_dir)
    ordre = demo + [i for i in modeles if i not in demo]
    out = []
    for i in ordre:
        m = modeles[i]
        present = (Path(audio_dir) / f"{i}.wav").exists()
        lu = (manifeste.get(i) or {}).get("texte")
        out.append({"id": i, "darija": m["texte_darija"], "fr": m["traduction_fr"], "statut": m["statut"],
                    "texte_avant": m.get("texte_avant", ""), "demo": i in demo, "present": present,
                    "voix": voix_du_clip(manifeste, i) if present else None,
                    "a_refaire": bool(present and lu is not None and lu != m["texte_darija"])})
    return out


def verifier_wav(octets):
    """None si le WAV convient (mono, 16 bits, 16000 ou 22050 Hz, durée raisonnable), sinon la raison."""
    if not octets or len(octets) > TAILLE_MAX:
        return "fichier vide ou trop gros"
    try:
        with wave.open(io.BytesIO(octets), "rb") as w:
            if w.getnchannels() != 1:
                return "mono attendu"
            if w.getsampwidth() != 2:
                return "16 bits attendu"
            if w.getframerate() not in FREQUENCES:
                return "16000 ou 22050 Hz attendu"
            duree = w.getnframes() / w.getframerate()
    except (wave.Error, EOFError):
        return "pas un WAV PCM lisible"
    if not DUREE_MIN_S <= duree <= DUREE_MAX_S:
        return f"durée hors limites ({DUREE_MIN_S}–{DUREE_MAX_S} s)"
    return None


def enregistrer_clip(clip, octets, audio_dir):
    modeles = RD.modeles()
    if clip not in modeles:
        return None, "phrase inconnue"
    probleme = verifier_wav(octets)
    if probleme:
        return None, probleme
    _ecrire_atomique(Path(audio_dir) / f"{clip}.wav", octets)
    return noter_clip(audio_dir, clip, modeles[clip]["texte_darija"], "humaine"), None


def verifier_texte(texte):
    texte = (texte or "").strip()
    if not texte or len(texte) > LONGUEUR_PHRASE_MAX:
        return None, "phrase vide ou trop longue"
    if not ARABE.search(texte):
        return None, "écriture arabe attendue"
    if CHIFFRES.search(texte):
        return None, "pas de chiffres dans les phrases"
    return texte, None


def relancer_demo():
    """Les 20 questions de test sur les 2 scénarios de démo : types corrects et réponses sans chiffre."""
    lignes = [(q, sc, RD.repondre_darija(q["question"], sc)) for sc in SCENARIOS_DEMO for q in questions_demo()]
    bons = sum(r["intention"] == q["type_attendu"] for q, _, r in lignes)
    avec_chiffres = sum(bool(CHIFFRES.search(" ".join(r["lignes_darija"]))) for _, _, r in lignes)
    return {"questions": len(lignes), "type_correct": bons, "reponses_avec_chiffres": avec_chiffres}


def valider_phrase(phrase_id, texte=None, chemin=None):
    """Valide la phrase (texte None) ou la remplace par « texte » ; statut « validé par Ranya »."""
    chemin = Path(chemin or RD.TEMPLATES_FILE)
    donnees = json.loads(chemin.read_text(encoding="utf-8"))
    modele = next((m for m in donnees["modeles"] if m["id"] == phrase_id), None)
    if modele is None:
        return None, "phrase inconnue"
    change = False
    if texte is not None:
        texte, probleme = verifier_texte(texte)
        if probleme:
            return None, probleme
        if texte != modele["texte_darija"]:
            modele["texte_avant"], modele["texte_darija"], change = modele["texte_darija"], texte, True
    modele["statut"] = STATUT_VALIDE
    _ecrire_atomique(chemin, (json.dumps(donnees, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    RD.modeles.cache_clear()
    return {"id": phrase_id, "darija": modele["texte_darija"], "statut": modele["statut"], "modifiee": change}, None
