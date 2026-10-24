"""
Indicator calculator for TerraRota.

Converts raw NASA POWER daily data into agronomic indicators.

All calculations are deterministic and unit-tested independently of NASA/HTTP.

Indicators produced:
  - annual_rain_mm: Mean annual precipitation (mm/year)
  - mean_annual_temp_c: Mean annual temperature (°C)
  - aridity_index: UNEP aridity index (P / PET)
  - gdd_base10: Annual Growing Degree Days (base 10°C)
  - frost_days_per_year: Mean days/year where T_min < 0°C
  - dry_months: Mean months/year with <30mm precipitation
  - missing_data_pct: Percentage of expected days with fill values
"""

import logging
from typing import Any

logger = logging.getLogger("terrarota")

# GDD base temperature (°C) — standard for many cereal crops
GDD_BASE_TEMP = 10.0

# Frost threshold
FROST_TEMP_C = 0.0

# Dry month threshold (mm/month)
DRY_MONTH_THRESHOLD_MM = 30.0


class InsufficientDataError(Exception):
    """Raised when data quality is too poor to calculate reliable indicators."""


def calculate(climate_result: dict[str, Any]) -> dict[str, Any]:
    """
    Calculate agronomic indicators from a NASA POWER data result.

    Args:
        climate_result: Output of data_services.nasa_power.fetch_climate_data()

    Returns:
        dict of indicator values with metadata.

    Raises:
        InsufficientDataError: if critical variables are too sparse.
    """
    data = climate_result.get("data", {})
    total_expected = climate_result.get("total_days_expected", 0)

    t2m = data.get("T2M", {})
    t2m_max = data.get("T2M_MAX", {})
    t2m_min = data.get("T2M_MIN", {})
    precip = data.get("PRECTOTCORR", {})

    # Check minimum data quality
    _check_data_quality(t2m, total_expected, "T2M", min_pct=60)
    _check_data_quality(precip, total_expected, "PRECTOTCORR", min_pct=40)

    indicators = {}
    warnings = []

    # Annual rainfall (mm/year) — averaged across all years
    indicators["annual_rain_mm"] = _mean_annual_sum(precip)

    # Mean annual temperature (°C)
    indicators["mean_annual_temp_c"] = _mean_of_values(t2m)

    # Growing Degree Days (base 10°C)
    indicators["gdd_base10"] = _calculate_gdd(t2m_max, t2m_min, t2m)

    # Frost days per year (T_min < 0°C)
    indicators["frost_days_per_year"] = _calculate_frost_days(t2m_min, t2m)

    # Aridity Index (simplified: P / Thornthwaite PET estimate)
    indicators["aridity_index"] = _calculate_aridity_index(
        indicators["annual_rain_mm"],
        indicators["mean_annual_temp_c"],
    )

    # Dry months per year (months with <30mm)
    indicators["dry_months"] = _calculate_dry_months(precip)

    # Data quality summary
    n_valid_temp = len(t2m)
    n_valid_precip = len(precip)
    if total_expected > 0:
        indicators["missing_data_pct"] = round(
            100 * (1 - min(n_valid_temp, n_valid_precip) / total_expected), 1
        )
    else:
        indicators["missing_data_pct"] = None

    # Warnings
    if indicators.get("missing_data_pct", 0) and indicators["missing_data_pct"] > 20:
        warnings.append(
            f"High proportion of missing data ({indicators['missing_data_pct']:.0f}%). "
            "Indicators may be less reliable."
        )

    indicators["_warnings"] = warnings
    return indicators


def _check_data_quality(
    data: dict, total_expected: int, var_name: str, min_pct: float
) -> None:
    """Raise InsufficientDataError if variable has too few valid values."""
    if total_expected > 0 and len(data) / total_expected * 100 < min_pct:
        raise InsufficientDataError(
            f"Variable {var_name} has only {len(data)} valid values "
            f"out of {total_expected} expected ({len(data)/total_expected*100:.1f}%). "
            f"Minimum required: {min_pct}%."
        )


def _group_by_year(daily: dict[str, float]) -> dict[int, list[float]]:
    """Group daily values {YYYYMMDD: value} by year."""
    by_year: dict[int, list[float]] = {}
    for date_str, val in daily.items():
        try:
            year = int(date_str[:4])
            by_year.setdefault(year, []).append(val)
        except (ValueError, IndexError):
            continue
    return by_year


def _group_by_year_month(daily: dict[str, float]) -> dict[tuple, list[float]]:
    """Group daily values by (year, month)."""
    by_ym: dict[tuple, list[float]] = {}
    for date_str, val in daily.items():
        try:
            year = int(date_str[:4])
            month = int(date_str[4:6])
            key = (year, month)
            by_ym.setdefault(key, []).append(val)
        except (ValueError, IndexError):
            continue
    return by_ym


def _mean_annual_sum(daily: dict[str, float]) -> float:
    """Calculate mean annual sum from daily values."""
    by_year = _group_by_year(daily)
    if not by_year:
        return 0.0
    annual_sums = [sum(vals) for vals in by_year.values()]
    return round(sum(annual_sums) / len(annual_sums), 1)


def _mean_of_values(daily: dict[str, float]) -> float:
    """Calculate mean of all daily values."""
    if not daily:
        return 0.0
    return round(sum(daily.values()) / len(daily), 2)


def _calculate_gdd(
    t2m_max: dict[str, float],
    t2m_min: dict[str, float],
    t2m: dict[str, float],
) -> float:
    """
    Calculate mean annual GDD (base 10°C).

    Uses T2M_MAX and T2M_MIN if available; falls back to T2M.
    GDD_daily = max(0, (T_max + T_min) / 2 - T_base)
    """
    # Prefer max/min pair
    if t2m_max and t2m_min:
        all_dates = set(t2m_max.keys()) & set(t2m_min.keys())
    else:
        all_dates = set()

    if len(all_dates) >= 100:
        daily_gdd: dict[str, float] = {}
        for d in all_dates:
            tmean = (t2m_max[d] + t2m_min[d]) / 2
            daily_gdd[d] = max(0.0, tmean - GDD_BASE_TEMP)
    else:
        # Fallback to T2M
        daily_gdd = {d: max(0.0, v - GDD_BASE_TEMP) for d, v in t2m.items()}

    by_year = _group_by_year(daily_gdd)
    if not by_year:
        return 0.0
    annual_gdds = [sum(vals) for vals in by_year.values()]
    return round(sum(annual_gdds) / len(annual_gdds), 0)


def _calculate_frost_days(
    t2m_min: dict[str, float],
    t2m: dict[str, float],
) -> float:
    """
    Calculate mean frost days per year (days where T_min < 0°C).
    Falls back to T2M if T_min unavailable.
    """
    temp_source = t2m_min if len(t2m_min) >= 100 else t2m
    frost_daily = {d: 1.0 for d, v in temp_source.items() if v < FROST_TEMP_C}
    by_year = _group_by_year(frost_daily)

    if not by_year:
        # Also check t2m for any freezing days
        frost_daily_t2m = {d: 1.0 for d, v in t2m.items() if v < FROST_TEMP_C}
        by_year = _group_by_year(frost_daily_t2m)

    if not by_year:
        return 0.0

    annual_counts = [sum(vals) for vals in by_year.values()]
    return round(sum(annual_counts) / len(annual_counts), 1)


def _calculate_aridity_index(annual_rain_mm: float, mean_temp_c: float) -> float:
    """
    Simplified UNEP Aridity Index: AI = P / PET.

    PET estimated via Thornthwaite simplified formula:
    PET ≈ 16 * (10 * T / I)^a * correction (annual)
    Using a rough estimate: PET_annual ≈ 58.93 * T (for T > 0°C).

    Source: UNEP (1992) World Atlas of Desertification.
    Note: This is a simplified estimate. Real PET requires monthly data.
    """
    if mean_temp_c <= 0 or annual_rain_mm <= 0:
        return 0.0

    # Simplified Thornthwaite PET estimate (mm/year)
    pet_estimate = max(1.0, 58.93 * mean_temp_c)
    ai = annual_rain_mm / pet_estimate
    return round(ai, 3)


def _calculate_dry_months(precip: dict[str, float]) -> float:
    """
    Calculate mean number of dry months per year.
    A month is 'dry' if total precipitation < 30mm.
    """
    by_ym = _group_by_year_month(precip)
    monthly_sums: dict[tuple, float] = {ym: sum(vals) for ym, vals in by_ym.items()}

    by_year_dry: dict[int, int] = {}
    for (year, month), total in monthly_sums.items():
        if total < DRY_MONTH_THRESHOLD_MM:
            by_year_dry[year] = by_year_dry.get(year, 0) + 1

    if not by_year_dry:
        return 0.0

    return round(sum(by_year_dry.values()) / len(by_year_dry), 1)
