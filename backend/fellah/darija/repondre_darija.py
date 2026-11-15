"""repondre_darija.py - Questions en darija, reponses en darija, a partir du moteur du Membre 2.

repondre_darija(question, scenario) -> {intention, lignes_darija, traduction_fr, clips, donnees_utilisees}

- Comprendre : comprendre.classer (mots-cles, instantane ; darija en ecriture arabe ou en lettres latines).
  Une culture nommee dans la question (« wach nkemel b l9am7 ? ») donne l'avis du moteur sur cette culture.
- Faits : SEULEMENT la sortie du moteur du Membre 2 (ai/darija/membre2/rapports_membre2.json, importee par
  importer_membre2.py) : verdicts, statuts des lignes, criteres (optimal / tolerable / out), regles de rotation,
  alternatives, plan propose, fiabilite, irrigation de la parcelle.
- Reponse : 2 ou 3 phrases entieres enregistrees (templates_darija.json, prefixe hiba_), noms de cultures en clips,
  « سول المستشار » a la fin s'il y a une precaution. Aucun chiffre n'est dit.
- Jamais de modele de langage pour ecrire la darija. Question hors perimetre (engrais, rendement, inconnue) :
  « ما عنديش هاد المعلومة، سول المستشار » + icones des sujets possibles.
"""
import json
import re
import sys
from functools import lru_cache
from pathlib import Path

DARIJA_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(DARIJA_DIR))
import comprendre

RAPPORTS_FILE = DARIJA_DIR / "rapports_membre2.json"
TEMPLATES_FILE = DARIJA_DIR / "templates_darija.json"
MAX_PHRASES = 3
SUJETS = {"QUOI_PLANTER": "icone_quoi_planter.png", "POURQUOI": "icone_pourquoi.png", "PLUIE_METEO": "icone_pluie.png",
          "SOL": "icone_sol.png", "EAU_IRRIGATION": "icone_eau.png", "FIABILITE": "icone_fiabilite.png"}
HORS_PERIMETRE = ("ENGRAIS", "RENDEMENT", "INCONNU")
MOTS_CULTURES = {
    "ble_dur": ("القمح الصلب", "قمح صلب", "durum", "lgemh sleb", "l9am7 sleb", "9am7 sleb"),
    "ble_tendre": ("القمح", "قمح", "الزرع", "l9am7", "l9am", "l9mh", "9am7", "gemh", "lgemh", "zre3 l9am7", "ble"),
    "orge": ("الشعير", "شعير", "cha3ir", "ch3ir", "chi3ir", "lch3ir", "orge"),
    "pois_chiche": ("الحمص", "حمص", "l7ems", "7ems", "hommos", "l7mes", "7mes"),
    "lentille": ("العدس", "عدس", "l3des", "3des", "3ads", "lentille"),
    "feve": ("الفول", "فول", "lfoul", "foul", "fol"),
    "oignon": ("البصلة", "البصل", "بصل", "lbsla", "bsla", "bsel", "lbsel"),
    "pomme_de_terre": ("البطاطا", "بطاطا", "btata", "lbtata"),
    "olivier": ("الزيتون", "زيتون", "zitoun", "zitoune", "zaytoun"),
    "oranger": ("الليمون", "ليمون", "لتشين", "limoun", "tchina"),
    "caprier": ("الكبار", "كبار", "kebbar", "kabbar"),
    "clementinier": ("الكليمونتين", "كليمونتين", "clementine", "klimontin"),
}
CRITERE_RAISON = {"temp_c": ("hiba_raison_froid", "hiba_raison_chaleur"),
                  "rain_mm": ("hiba_raison_pluie_peu", "hiba_raison_pluie_trop"),
                  "salinity_dsm": ("hiba_raison_sel", "hiba_raison_sel"),
                  "ph": ("hiba_raison_ph", "hiba_raison_ph")}
REGLE_RAISON = {"meme_culture_consecutive": "hiba_raison_meme_culture",
                "meme_famille_consecutive": "hiba_raison_meme_famille",
                "historique_absent": "hiba_raison_historique_absent"}
ORDRE_POSITION = {"optimal": 0, "tolerable": 1, "out": 2}


@lru_cache(maxsize=1)
def donnees_membre2(chemin=RAPPORTS_FILE):
    return json.loads(Path(chemin).read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def modeles(chemin=TEMPLATES_FILE):
    return {m["id"]: m for m in json.loads(Path(chemin).read_text(encoding="utf-8"))["modeles"]}


def scenario(scenario_id):
    return donnees_membre2()["scenarios"][scenario_id]


def _normaliser(texte):
    return " " + re.sub(r"[؟?!.,،]", " ", comprendre.normalize(texte or "")) + " "


def cultures_citees(texte):
    """Tous les crop_id du Membre 2 nommes dans un texte (pour verifier une reponse du mode cloud)."""
    trouvees = _trouver_cultures(texte)
    return sorted({cid for _, cid in trouvees})


def culture_citee(question):
    """crop_id du Membre 2 nomme dans la question (le plus long mot-cle gagne), sinon None."""
    trouvees = _trouver_cultures(question)
    return max(trouvees)[1] if trouvees else None


def _trouver_cultures(question):
    texte = _normaliser(question)
    trouvees = []
    for cid, mots in MOTS_CULTURES.items():
        for m in mots:
            n = _normaliser(m).strip()
            if not n:
                continue
            racine = n[2:] if n.startswith("ال") and len(n) > 3 else n
            latin = re.search(r"(^|\s)(b|l|f|w)?" + re.escape(n) + r"(\s|$)", texte)
            arabe = re.search(r"(^|\s)(وبال|بال|فال|وال|لل|ب|ف|و|ل)?(ال)?" + re.escape(racine) + r"(\s|$)", texte)
            if latin or arabe:
                trouvees.append((len(n), cid))
    return trouvees


def _lignes(sc, partie):
    bloc = sc["rapport"].get(partie)
    return bloc["evaluation"]["lines"] if bloc else []


def plan_conseille(sc):
    """Lignes du plan retenu par le moteur (« farmer » ou « proposed »)."""
    if sc["rapport"]["retained"] == "proposed" and sc["rapport"].get("better"):
        return _lignes(sc, "better"), "proposed"
    return [l for l in _lignes(sc, "farmer") if l["status"] == "ok"] or _lignes(sc, "farmer"), "farmer"


def ligne_de(sc, crop):
    for partie in ("farmer", "better"):
        for l in _lignes(sc, partie):
            if l.get("crop") == crop:
                return l, partie
    return None, None


def raison(ligne):
    """Clip de la raison principale d'une ligne, dans l'ordre :
    parcelle ou culture inconnue du moteur ; pour une ligne refusee : critere « out », puis regle de rotation,
    puis critere « tolerable » ; pour une ligne « ok » : la forme « acceptable » du critere le moins bon,
    sinon « convient »."""
    statut = ligne.get("status")
    if statut == "unknown_parcel":
        return "hiba_raison_parcelle_inconnue", "status: unknown_parcel"
    if statut == "unknown_crop":
        return "hiba_culture_pas_evaluee", "status: unknown_crop"
    pire = None
    for c in ligne.get("criteria", []):
        if c["criterion"] in CRITERE_RAISON and ORDRE_POSITION.get(c["position"], 0) > 0:
            if pire is None or ORDRE_POSITION[c["position"]] > ORDRE_POSITION[pire["position"]]:
                pire = c
    if statut == "ok":
        if pire:
            acceptable = {"rain_mm": "hiba_pluie_tolerable", "ph": "hiba_sol_limite", "salinity_dsm": "hiba_sol_limite"}
            return acceptable.get(pire["criterion"], "hiba_raison_bonne"), f"criteria: {pire['criterion']} {pire['position']} (ligne ok)"
        return "hiba_raison_bonne", "criteria: optimal"
    if pire and pire["position"] == "out":
        bas = pire["value"] < pire["optimal"][0]
        return CRITERE_RAISON[pire["criterion"]][0 if bas else 1], f"criteria: {pire['criterion']} out"
    for issue in ligne.get("rotation_issues", []):
        if issue["rule"] in REGLE_RAISON:
            return REGLE_RAISON[issue["rule"]], f"rotation_issues: {issue['rule']}"
    if pire:
        bas = pire["value"] < pire["optimal"][0]
        return CRITERE_RAISON[pire["criterion"]][0 if bas else 1], f"criteria: {pire['criterion']} {pire['position']}"
    return "hiba_mostachar", f"status: {statut}, sans raison detaillee"


def _critere(ligne, nom):
    return next((c for c in ligne.get("criteria", []) if c["criterion"] == nom), None)


def precaution(sc):
    r = sc["rapport"]
    ev = r["farmer"]["evaluation"]
    return bool(r.get("missing_history") or ev.get("plan_issues")
                or any(l.get("rotation_issues") or l["status"] != "ok" for l in ev["lines"])
                or (ev.get("confidence") or {}).get("level") != "high")


def _crops_clips(crops):
    clips = []
    for i, c in enumerate(crops):
        if i:
            clips.append("hiba_et" if i == len(crops) - 1 else "hiba_et")
        clips.append(f"hiba_culture_{c}")
    return clips


def repondre_darija(question, scenario_id, mode="templates", client=None):
    """mode « templates » : phrases enregistrees (hors ligne, instantane).
    mode « cloud » : grand modele (llm_cloud), reponse verifiee ; sinon reponse par phrases enregistrees."""
    base = repondre_templates(question, scenario_id)
    base.update(mode="templates", statut_verification="phrases enregistrées", reponse_cloud_brute=None, problemes=[])
    if mode != "cloud":
        return base
    import llm_cloud
    client = client or llm_cloud.client_depuis_env()
    if client is None:
        base["statut_verification"] = "mode cloud non configuré → réponse de secours"
        return base
    sc = scenario(scenario_id)
    try:
        brute = llm_cloud.appeler(client, llm_cloud.construire_prompt(question, sc))
    except llm_cloud.QuotaCloud:
        base["statut_verification"] = "quota atteint → réponse de secours"
        return base
    except llm_cloud.ErreurCloud as e:
        base["statut_verification"] = f"erreur cloud ({e}) → réponse de secours"
        return base
    problemes = llm_cloud.verifier_reponse_cloud(question, brute, sc, cultures_citees)
    if problemes:
        base.update(statut_verification="bloquée → réponse de secours", reponse_cloud_brute=brute, problemes=problemes)
        return base
    return {"intention": base["intention"], "intention_comprendre": base["intention_comprendre"],
            "culture_citee": base["culture_citee"], "phrases": [], "clips": [],
            "lignes_darija": [brute.strip()], "traduction_fr": [], "donnees_utilisees": [f"scenario: {scenario_id}",
                                                                                            "faits : llm_cloud.faits_compacts"],
            "icones_sujets": [], "mode": "cloud", "statut_verification": "réponse vérifiée",
            "reponse_cloud_brute": brute, "problemes": []}


def repondre_templates(question, scenario_id):
    sc = scenario(scenario_id)
    r = sc["rapport"]
    ev = r["farmer"]["evaluation"]
    utilisees = [f"scenario: {scenario_id}", f"verdict agriculteur: {ev['verdict']}", f"plan retenu: {r['retained']}"]
    c = comprendre.classer(question, "mots_cles")
    intention = c["intention"]
    culture = culture_citee(question)
    phrases = []
    conseil, origine = plan_conseille(sc)
    principal = conseil[0] if conseil else None
    if intention in ("ENGRAIS", "RENDEMENT") or (intention == "INCONNU" and not culture):
        intention_finale = "HORS_PERIMETRE"
        phrases = [["hiba_hors_sujet"]]
    elif culture:
        intention_finale = "AVIS_CULTURE"
        ligne, partie = ligne_de(sc, culture)
        if ligne is None:
            phrases = [[f"hiba_culture_{culture}", "hiba_culture_pas_evaluee"]]
            utilisees.append(f"{culture}: absente du rapport")
        elif ligne["status"] == "ok":
            phrases = [[f"hiba_culture_{culture}", "hiba_culture_ok"], [raison(ligne)[0]]]
            utilisees += [f"{partie}.{culture}.status: ok", raison(ligne)[1]]
        else:
            alt = [a for a in (ligne.get("alternatives") or []) if f"hiba_culture_{a['crop']}" in modeles()]
            if alt:
                phrases = [[f"hiba_culture_{culture}", "hiba_culture_non"], ["hiba_alternative", f"hiba_culture_{alt[0]['crop']}"]]
                utilisees += [f"{partie}.{culture}.status: {ligne['status']}", f"{partie}.{culture}.alternatives[0]: {alt[0]['crop']}"]
            else:
                phrases = [[f"hiba_culture_{culture}", "hiba_culture_non"], [raison(ligne)[0]]]
                utilisees += [f"{partie}.{culture}.status: {ligne['status']}", raison(ligne)[1]]
    elif intention == "QUOI_PLANTER":
        intention_finale = intention
        verdict_clip = {"viable": "hiba_verdict_viable", "partially_viable": "hiba_verdict_partiel",
                        "not_viable": "hiba_verdict_non"}.get(ev["verdict"], "hiba_verdict_non_evalue")
        phrases = [[verdict_clip]]
        if origine == "farmer":
            phrases.append(["hiba_conseil_garder"])
        else:
            crops = [l["crop"] for l in conseil if f"hiba_culture_{l['crop']}" in modeles()][:2]
            phrases.append(["hiba_conseil_changer"] + _crops_clips(crops))
            utilisees.append("better.plan: " + ", ".join(l["crop"] for l in conseil))
    elif intention == "POURQUOI":
        intention_finale = intention
        pire = next((l for l in ev["lines"] if l["status"] != "ok"), None)
        if pire and pire.get("crop") and f"hiba_culture_{pire['crop']}" in modeles():
            cle, src = raison(pire)
            phrases = [[f"hiba_culture_{pire['crop']}", "hiba_culture_non"], [cle]]
            utilisees += [f"farmer.{pire['crop']}.status: {pire['status']}", src]
        elif principal and f"hiba_culture_{principal['crop']}" in modeles():
            cle, src = raison(principal)
            phrases = [[f"hiba_culture_{principal['crop']}", "hiba_culture_ok"], [cle]]
            utilisees.append(src)
        if any(t.get("rule") == "une_seule_famille" for t in ev.get("tips", [])) and len(phrases) < MAX_PHRASES:
            phrases.append(["hiba_raison_legumineuse"])
            utilisees.append("tips: une_seule_famille")
    elif intention in ("PLUIE_METEO", "SOL") and principal and f"hiba_culture_{principal['crop']}" in modeles():
        intention_finale = intention
        if intention == "PLUIE_METEO":
            crit = _critere(principal, "rain_mm")
            pos = crit["position"] if crit else "out"
            phrases = [[f"hiba_culture_{principal['crop']}", f"hiba_pluie_{pos}"]]
            utilisees.append(f"{origine}.{principal['crop']}.criteria.rain_mm: {pos}")
        else:
            positions = [(_critere(principal, n) or {}).get("position", "optimal") for n in ("ph", "salinity_dsm")]
            pos = max(positions, key=lambda p: ORDRE_POSITION.get(p, 0))
            cle = {"optimal": "hiba_sol_ok", "tolerable": "hiba_sol_limite", "out": "hiba_sol_non"}[pos]
            phrases = [[f"hiba_culture_{principal['crop']}", cle]]
            utilisees.append(f"{origine}.{principal['crop']}.criteria.ph/salinity_dsm: {pos}")
    elif intention == "EAU_IRRIGATION":
        intention_finale = intention
        irrigue = any(p.get("irrigated") for p in sc["parcels"].values())
        phrases = [["hiba_eau_sqi" if irrigue else "hiba_eau_bour"]]
        utilisees.append(f"parcels.irrigated: {irrigue}")
    elif intention == "FIABILITE":
        intention_finale = intention
        niveau = (ev.get("confidence") or {}).get("level")
        phrases = [[{"high": "hiba_fiab_haute", "medium": "hiba_fiab_moyenne"}.get(niveau, "hiba_fiab_basse")]]
        utilisees.append(f"farmer.confidence.level: {niveau}")
    else:
        intention_finale = "HORS_PERIMETRE"
        phrases = [["hiba_hors_sujet"]]
    if intention_finale != "HORS_PERIMETRE" and precaution(sc):
        phrases = phrases[:MAX_PHRASES - 1] + [["hiba_mostachar"]]
    phrases = phrases[:MAX_PHRASES]
    m = modeles()
    ids = [i for ph in phrases for i in ph]
    return {
        "intention": intention_finale,
        "intention_comprendre": intention,
        "culture_citee": culture,
        "phrases": phrases,
        "clips": [m[i]["fichier_audio"] for i in ids],
        "lignes_darija": [" ".join(m[i]["texte_darija"] for i in ph) for ph in phrases],
        "traduction_fr": [" ".join(m[i]["traduction_fr"] for i in ph) for ph in phrases],
        "donnees_utilisees": utilisees,
        "icones_sujets": list(SUJETS.values()) if intention_finale == "HORS_PERIMETRE" else [],
    }
