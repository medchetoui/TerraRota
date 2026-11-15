"""Génère UNE FOIS les clips darija avec une voix de synthèse marocaine (edge-tts, voix ar-MA), à partir des
phrases fixes de fellah/darija/templates_darija.json (jamais de texte écrit par un modèle de langage).

- Sortie : frontend/public/audio/darija/<id>.wav, WAV mono 16 bits 16000 Hz (conversion ffmpeg).
- Un clip enregistré par une personne (/advisor?enregistrer, source « humaine ») n'est JAMAIS remplacé ;
  à l'inverse, un enregistrement humain remplace automatiquement le clip de synthèse du même nom.
- enregistrements.json note pour chaque clip : texte lu, source « synthese », voix utilisée.

Utilisation (outil de développement ; edge-tts envoie le texte au service de synthèse de Microsoft) :
    python -m fellah.generer_voix_synthese                       (toutes les phrases hiba_)
    python -m fellah.generer_voix_synthese --voix ar-MA-JamalNeural --seulement hiba_mostachar hiba_et
    python -m fellah.generer_voix_synthese --refaire             (régénère aussi les clips de synthèse existants)
ffmpeg : variable FFMPEG, sinon « ffmpeg » dans le PATH, sinon D:/tools/ffmpeg/bin/ffmpeg.exe.
"""
import argparse
import asyncio
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

VOIX_DEFAUT = "ar-MA-MounaNeural"
DEBIT = "-5%"


def trouver_ffmpeg():
    for c in (os.environ.get("FFMPEG"), shutil.which("ffmpeg"), r"D:\tools\ffmpeg\bin\ffmpeg.exe"):
        if c and Path(c).exists():
            return c
    return None


def synthese_edge_tts(texte, voix, chemin_mp3):
    import edge_tts
    asyncio.run(edge_tts.Communicate(texte, voix, rate=DEBIT).save(str(chemin_mp3)))


def conversion_ffmpeg(source, cible, ffmpeg=None):
    ffmpeg = ffmpeg or trouver_ffmpeg()
    if not ffmpeg:
        raise RuntimeError("ffmpeg introuvable (variable FFMPEG)")
    r = subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", str(source), "-ac", "1", "-ar", "16000",
                        "-sample_fmt", "s16", str(cible)], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr.strip()[:200])


def generer(audio_dir, ids=None, voix=VOIX_DEFAUT, refaire=False, synthetiser=synthese_edge_tts,
            convertir=conversion_ffmpeg):
    """Renvoie {"generes": [...], "humains_gardes": [...], "deja_faits": [...], "erreurs": [...]}."""
    from . import atelier
    from .darija import repondre_darija as RD
    modeles = RD.modeles()
    ids = ids or [i for i in modeles if i.startswith("hiba_")]
    audio_dir = Path(audio_dir)
    audio_dir.mkdir(parents=True, exist_ok=True)
    bilan = {"generes": [], "humains_gardes": [], "deja_faits": [], "erreurs": []}
    for i in ids:
        if i not in modeles:
            bilan["erreurs"].append(f"{i} : phrase inconnue")
            continue
        texte = modeles[i]["texte_darija"]
        manifeste = atelier._manifeste(audio_dir)
        present = (audio_dir / f"{i}.wav").exists()
        if present and atelier.voix_du_clip(manifeste, i) == "humaine":
            bilan["humains_gardes"].append(i)
            continue
        if present and not refaire and (manifeste.get(i) or {}).get("texte") == texte:
            bilan["deja_faits"].append(i)
            continue
        with tempfile.TemporaryDirectory() as tmp:
            brut, wav = Path(tmp) / f"{i}.mp3", Path(tmp) / f"{i}.wav"
            try:
                synthetiser(texte, voix, brut)
                convertir(brut, wav)
                octets = wav.read_bytes()
            except Exception as e:  # réseau, service, conversion : le clip reste absent (réponse en texte)
                bilan["erreurs"].append(f"{i} : {type(e).__name__}: {e}"[:200])
                continue
        probleme = atelier.verifier_wav(octets)
        if probleme:
            bilan["erreurs"].append(f"{i} : {probleme}")
            continue
        atelier._ecrire_atomique(audio_dir / f"{i}.wav", octets)
        atelier.noter_clip(audio_dir, i, texte, "synthese", voix=voix)
        bilan["generes"].append(i)
    return bilan


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "terrarota.settings")
    import django
    django.setup()
    from .views import AUDIO_DIR
    parser = argparse.ArgumentParser(description="Clips darija en voix de synthèse (edge-tts, ar-MA)")
    parser.add_argument("--voix", default=VOIX_DEFAUT, help="ar-MA-MounaNeural ou ar-MA-JamalNeural")
    parser.add_argument("--seulement", nargs="*", help="ids des phrases (défaut : toutes les phrases hiba_)")
    parser.add_argument("--refaire", action="store_true", help="régénérer aussi les clips de synthèse existants")
    args = parser.parse_args()
    bilan = generer(AUDIO_DIR, args.seulement, args.voix, args.refaire)
    for titre, cle in (("Générés", "generes"), ("Enregistrements humains gardés", "humains_gardes"),
                       ("Déjà à jour", "deja_faits"), ("Erreurs", "erreurs")):
        print(f"{titre} : {len(bilan[cle])}")
        for x in bilan[cle] if cle != "deja_faits" else []:
            print(f"  - {x}")
    return 1 if bilan["erreurs"] else 0


if __name__ == "__main__":
    sys.exit(main())
