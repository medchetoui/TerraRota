"""plan.py - evalue le plan d'un agriculteur : note chaque ligne,
repere les problemes, propose des alternatives, et peut proposer un plan complet."""
from .api import verdict_from_score
from .config import load_config, load_crops
from .rotation import check_rotation
from .rules import evaluate_rules
from .scoring import score_crop
from .confidence import assess_confidence, level_from_value

MAX_ALTERNATIVES = 3
EVALUATED = ("ok", "risky", "not_recommended")


def _criteria_details(conditions, crop, ignore=()):
    """Pour chaque critere : valeur de la parcelle face aux seuils de la culture."""
    details = []
    for name in ("temp_c", "rain_mm", "ph", "salinity_dsm"):
        value = conditions.get(name)
        ranges = crop.get(name)
        if name in ignore or value is None or not ranges or len(ranges) != 4:
            continue
        low, opt_low, opt_high, high = ranges
        if opt_low <= value <= opt_high:
            position = "optimal"
        elif low <= value <= high:
            position = "tolerable"
        else:
            position = "out"
        details.append({"criterion": name, "value": value, "position": position,
                        "optimal": [opt_low, opt_high], "tolerated": [low, high]})
    return details

MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
             "août", "septembre", "octobre", "novembre", "décembre"]


def _window_conditions(parcel, crop, config, ignore):
    """Temperature moyenne sur la duree du cycle, pour le meilleur mois de depart.
    Les seuils de pluie ECOCROP sont annuels : la pluie reste le cumul annuel."""
    monthly = parcel["monthly"]
    cycle = crop["cycle_days"]
    months = max(1, min(12, round(sum(cycle) / len(cycle) / 30)))
    temps = crop.get("temp_c")
    mid = (temps[1] + temps[2]) / 2 if temps else None
    best = None
    for start in range(12):
        temp = sum(monthly["temp_c"][(start + i) % 12] for i in range(months)) / months
        cond = {**parcel.get("conditions", {}), "temp_c": round(temp, 1)}
        score = score_crop(cond, crop, config, ignore=ignore)["score"]
        if score is None:
            continue
        key = (score, -abs(temp - mid) if mid is not None else 0)
        if best is None or key > best[0]:
            best = (key, start, cond)
    if best is None:
        return parcel.get("conditions", {}), None
    _, start, cond = best
    if months >= 12:
        period = "toute l'année"
    elif months == 1:
        period = MONTHS_FR[start]
    else:
        period = f"{MONTHS_FR[start]} à {MONTHS_FR[(start + months - 1) % 12]}"
    return cond, {"start_month": start + 1, "months": months, "period_fr": period}

def _assess(crop_key, parcel, crops, config):
    """Evalue UNE culture sur UNE parcelle (score, exclusions, rotation)."""
    crop = crops[crop_key]
    irrigated = bool(parcel.get("irrigated"))
    ignore = ("rain_mm",) if irrigated else ()
    conditions, window = parcel.get("conditions", {}), None
    if parcel.get("monthly") and crop.get("cycle_days"):
        conditions, window = _window_conditions(parcel, crop, config, ignore)

    scored = score_crop(conditions, crop, config, ignore=ignore)
    exclusions = evaluate_rules(scored, conditions, crop, irrigated=irrigated)
    rotation = check_rotation(parcel.get("history", []), crop_key, crops, config)
    confidence = assess_confidence(scored["missing"], crop, rotation["applicable"],
                                   rotation["note"], parcel.get("irrigated"), config)

    agro = scored["score"]
    note = rotation["note"]
    if agro is None:
        score = None
    elif note is None:
        score = agro
    else:
        score = round(agro * note)

    return {
        "agro_score": agro,
        "score": score,
        "exclusions": exclusions,
        "rotation": rotation,
        "missing": scored["missing"],
        "confidence": confidence,
        "criteria": _criteria_details(conditions, crop, ignore),
        "window": window,
    }


def _line_status(assessment, thresholds):
    if assessment["exclusions"]:
        return "not_recommended"
    if assessment["score"] is None:
        return "not_evaluated"
    verdict = verdict_from_score(assessment["score"], thresholds)
    return {"viable": "ok", "risky": "risky", "not_recommended": "not_recommended"}[verdict]


def _alternatives(crop_key, parcel, current, crops, config, thresholds,
                  min_gain=1, exclude=()):
    comparable = current["score"] is not None and not current["exclusions"]
    found = []
    for alt_key in crops[crop_key].get("alternatives", []):
        if alt_key not in crops or alt_key in exclude:
            continue
        alt = _assess(alt_key, parcel, crops, config)
        if alt["exclusions"] or alt["score"] is None:
            continue
        if alt["score"] < thresholds["risky"]:
            continue
        note = alt["rotation"]["note"]
        if note is not None and note < 1:      # l'alternative subit aussi une penalite de rotation
            continue
        if comparable and alt["score"] - current["score"] < min_gain:
            continue
        found.append({
            "crop": alt_key,
            "name_fr": crops[alt_key]["name_fr"],
            "score": alt["score"],
            "gain": alt["score"] - current["score"] if comparable else None,
        })
    found.sort(key=lambda a: a["score"], reverse=True)
    return found[:MAX_ALTERNATIVES]


def _family_shares(known, crops):
    """Part de chaque famille dans le plan (par surface si elle est donnee partout, sinon par ligne)."""
    use_area = all(isinstance(line["area_ha"], (int, float)) and line["area_ha"] > 0
                   for line in known)
    weights = [line["area_ha"] if use_area else 1 for line in known]
    total = sum(weights)
    shares = {}
    for line, weight in zip(known, weights):
        family = crops[line["crop"]]["family"]
        shares[family] = shares.get(family, 0) + weight / total
    return shares


def _composition(lines, crops):
    known = [line for line in lines if "name_fr" in line]
    if not known:
        return []
    shares = _family_shares(known, crops)
    return [{"family": family, "percent": round(share * 100)}
            for family, share in sorted(shares.items(), key=lambda item: -item[1])]


def _legume_suggestions(parcels, crops, config, parcel_ids, limit=2):
    """Legumineuses adaptees a chaque parcelle (viables, sans penalite de rotation)."""
    thresholds = config["verdict_thresholds"]
    out = {}
    for pid in parcel_ids:
        if pid not in parcels:
            continue
        found = []
        for key, crop in crops.items():
            if crop.get("soil_effect") != "fixes_nitrogen":
                continue
            res = _assess(key, parcels[pid], crops, config)
            if res["exclusions"] or res["score"] is None or res["score"] < thresholds["viable"]:
                continue
            note = res["rotation"]["note"]
            if note is not None and note < 1:
                continue
            found.append((res["score"], key))
        found.sort(key=lambda r: (-r[0], r[1]))
        if found:
            out[pid] = [{"crop": key, "name_fr": crops[key]["name_fr"], "score": score}
                        for score, key in found[:limit]]
    return out


def plan_tips(lines, parcels, crops, config):
    """Astuces quand le plan manque de diversite (une seule famille, ou aucune legumineuse)."""
    known = [line for line in lines if "name_fr" in line]
    if not known:
        return []
    families = {crops[line["crop"]]["family"] for line in known}
    has_legume = any(crops[line["crop"]].get("soil_effect") == "fixes_nitrogen" for line in known)
    if len(families) == 1:
        tip = {"rule": "une_seule_famille", "family": next(iter(families))}
    elif not has_legume:
        tip = {"rule": "sans_legumineuse"}
    else:
        return []
    if not has_legume:
        tip["suggestions"] = _legume_suggestions(
            parcels, crops, config, sorted({line["parcel"] for line in known}))
    return [tip]


def _plan_issues(lines, crops, config):
    issues = []

    for line in lines:
        if line["status"] not in EVALUATED:
            issues.append({"rule": "ligne_non_evaluee", "level": "warning",
                           "detail": f"{line['parcel']} / {line['crop']} : {line['status']}",
                           "parcel": line["parcel"], "crop": line["crop"],
                           "status": line["status"]})

    known = [line for line in lines if "name_fr" in line]
    if len(known) >= 2:
        limit = config["plan"]["max_family_share"]
        for family, share in _family_shares(known, crops).items():
            if share > limit:
                issues.append({"rule": "concentration_famille", "level": "warning",
                               "detail": f"{round(share * 100)} % du plan dans la famille {family}",
                               "family": family, "percent": round(share * 100)})
    return issues


def _plan_verdict(lines):
    statuses = [line["status"] for line in lines if line["status"] in EVALUATED]
    if not statuses:
        return "not_evaluated"
    if all(s == "not_recommended" for s in statuses):
        return "not_viable"
    if any(s in ("risky", "not_recommended") for s in statuses):
        return "partially_viable"
    return "viable"


def _plan_confidence(lines, config):
    """Confiance du plan = celle de sa ligne la plus fragile."""
    values = [line["confidence"]["value"] for line in lines if "confidence" in line]
    if not values:
        return None
    weakest = min(values)
    return {"level": level_from_value(weakest, config), "percent": round(weakest * 100)}


def evaluate_plan(plan, parcels, crops=None, config=None):
    """
    plan    : [{"parcel": "P1", "crop": "ble_tendre", "area_ha": 2}, ...]
    parcels : {"P1": {"conditions": {...}, "irrigated": False,
                      "history": [{"crop": "orge", "year": 2025}]}}
    """
    config = load_config() if config is None else config
    crops = load_crops() if crops is None else crops
    thresholds = config["verdict_thresholds"]

    # cultures deja presentes dans le plan, par parcelle (pour ne pas les proposer en alternative)
    parcel_crops = {}
    for item in plan:
        parcel_crops.setdefault(item.get("parcel"), set()).add(item.get("crop"))

    lines = []
    for item in plan:
        crop_key, parcel_id = item.get("crop"), item.get("parcel")
        line = {"parcel": parcel_id, "crop": crop_key, "area_ha": item.get("area_ha")}

        if crop_key not in crops:
            line["status"] = "unknown_crop"
        elif parcel_id not in parcels:
            line["status"] = "unknown_parcel"
        else:
            parcel = parcels[parcel_id]
            result = _assess(crop_key, parcel, crops, config)
            status = _line_status(result, thresholds)

            if status in ("risky", "not_recommended"):
                min_gain = 1
            elif status == "ok":
                min_gain = config["plan"].get("min_gain_for_ok_lines", 10)
            else:
                min_gain = None
            alternatives = []
            if min_gain is not None:
                alternatives = _alternatives(crop_key, parcel, result, crops, config,
                                             thresholds, min_gain,
                                             exclude=parcel_crops.get(parcel_id, ()))

            line.update(
                name_fr=crops[crop_key]["name_fr"],
                status=status,
                score=result["score"],
                agro_score=result["agro_score"],
                rotation_note=result["rotation"]["note"],
                exclusions=result["exclusions"],
                rotation_issues=result["rotation"]["issues"],
                rotation_benefits=result["rotation"]["benefits"],
                missing=result["missing"],
                confidence=result["confidence"],
                criteria=result["criteria"],
                window=result["window"],
                alternatives=alternatives,
            )
        lines.append(line)

    return {
        "verdict": _plan_verdict(lines),
        "lines": lines,
        "plan_issues": _plan_issues(lines, crops, config),
        "composition": _composition(lines, crops),
        "tips": plan_tips(lines, parcels, crops, config),
        "confidence": _plan_confidence(lines, config),
    }


def recommend_plan(parcels, crops=None, config=None, wanted=None,
                   max_lines=3, min_lines=2, avoid_rotation_penalty=True,
                   include_perennials=False):
    """
    Propose un plan complet pour chaque parcelle.
    parcels : meme format que pour evaluate_plan (+ "area_ha" optionnel par parcelle)
    wanted  : cultures souhaitees par l'agriculteur (mode objectif), sinon toutes
    Retourne (plan, unplanned) :
      plan      : liste de lignes {"parcel", "crop", "area_ha"} utilisable dans evaluate_plan
      unplanned : parcelles pour lesquelles aucune culture n'est viable
    """
    config = load_config() if config is None else config
    crops = load_crops() if crops is None else crops
    thresholds = config["verdict_thresholds"]
    limit = config["plan"]["max_family_share"]
    soil_bonus = config["plan"].get("soil_bonus", 0)
    keys = [k for k in (wanted if wanted is not None else crops) if k in crops]

    plan, unplanned = [], []
    for parcel_id, parcel in parcels.items():
        # 1. cultures viables sur cette parcelle, classees par score (+ bonus sol)
        ranked = []
        for key in keys:
            res = _assess(key, parcel, crops, config)
            if res["exclusions"] or res["score"] is None:
                continue
            if not include_perennials and not res["rotation"]["applicable"]:
                continue
            if res["score"] < thresholds["viable"]:
                continue
            note = res["rotation"]["note"]
            if avoid_rotation_penalty and note is not None and note < 1:
                continue
            improves = int(crops[key].get("soil_effect") == "fixes_nitrogen")
            bonus = soil_bonus * (improves + len(res["rotation"]["benefits"]))
            ranked.append((res["score"] + bonus, key))
        ranked.sort(key=lambda r: (-r[0], r[1]))

        if not ranked:
            unplanned.append(parcel_id)
            continue

        # 2. on prend les meilleures en respectant la part maximale par famille
        picked, counts = [], {}
        for _, key in ranked:
            if len(picked) == max_lines:
                break
            family = crops[key]["family"]
            new_counts = {**counts, family: counts.get(family, 0) + 1}
            if picked and max(new_counts.values()) / (len(picked) + 1) > limit:
                continue
            picked.append(key)
            counts = new_counts

        # 3. si le plan est trop court, on complete (evaluate_plan signalera la concentration)
        if len(picked) < min_lines:
            for _, key in ranked:
                if key not in picked:
                    picked.append(key)
                if len(picked) == min_lines:
                    break

        # 4. surface repartie a parts egales
        area = parcel.get("area_ha")
        for key in picked:
            plan.append({"parcel": parcel_id, "crop": key,
                         "area_ha": round(area / len(picked), 2) if area else None})
    return plan, unplanned