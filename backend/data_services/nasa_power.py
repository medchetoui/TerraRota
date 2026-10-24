"""
NASA POWER API client for TerraRota.

Fetches daily meteorological data for a given lat/lon over a multi-year window.
Implements timeouts, response validation, caching, and sample-data fallback.

References:
  NASA POWER API: https://power.larc.nasa.gov/docs/services/api/
  Community: AG (agroclimatology)
  Variables: T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, ALLSKY_SFC_SW_DWN, WS2M
"""

import logging
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger("terrarota")

# NASA POWER fill value for missing data
FILL_VALUE = -999.0

# Variables we request from NASA POWER (Community=AG)
POWER_VARIABLES = [
    "T2M",            # Temperature at 2m (°C)
    "T2M_MAX",        # Max daily temperature (°C)
    "T2M_MIN",        # Min daily temperature (°C)
    "PRECTOTCORR",    # Precipitation corrected (mm/day)
    "RH2M",           # Relative humidity at 2m (%)
    "ALLSKY_SFC_SW_DWN",  # Solar radiation (MJ/m²/day)
    "WS2M",           # Wind speed at 2m (m/s)
]

# Default analysis window (5 years ending last complete year)
_NOW = datetime.now()
_DEFAULT_END_YEAR = _NOW.year - 1 if _NOW.month > 6 else _NOW.year - 2
_DEFAULT_START_YEAR = _DEFAULT_END_YEAR - 4  # 5 years

CACHE_TIMEOUT_SECONDS = 60 * 60 * 6  # 6 hours


class NASADataStatus:
    LIVE = "live"
    CACHED = "cached"
    SAMPLE = "sample"
    INSUFFICIENT = "insufficient_data"


class NASAClientError(Exception):
    """Raised for unrecoverable NASA POWER client errors."""


def _build_cache_key(lat: float, lon: float, start: str, end: str) -> str:
    return f"nasa_power:{lat:.3f}:{lon:.3f}:{start}:{end}"


def _load_sample_data() -> dict[str, Any]:
    """
    Load sample fixture data for offline/demo use.
    Sample data represents a semi-arid Moroccan location (illustrative only).
    """
    sample_path = Path(__file__).parent / "fixtures" / "sample_power_response.json"
    with open(sample_path, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_climate_data(
    lat: float,
    lon: float,
    start_year: int = _DEFAULT_START_YEAR,
    end_year: int = _DEFAULT_END_YEAR,
) -> dict[str, Any]:
    """
    Fetch daily climate data from NASA POWER for the given coordinates.

    Returns a dict with keys:
      - status: NASADataStatus value
      - data: dict of {variable: {date_str: value}} for valid (non-fill) entries
      - provenance: metadata about the data source
      - raw_parameter_info: units and descriptions from NASA
      - period: {start, end}

    If NASA is unreachable, tries the cache. If cache misses, returns sample data.
    Never returns fabricated data silently.
    """
    start_str = f"{start_year}0101"
    end_str = f"{end_year}1231"
    cache_key = _build_cache_key(lat, lon, start_str, end_str)

    # 1. Try live NASA POWER
    try:
        result = _fetch_from_nasa(lat, lon, start_str, end_str)
        cache.set(cache_key, result, CACHE_TIMEOUT_SECONDS)
        result["status"] = NASADataStatus.LIVE
        logger.info("NASA POWER data fetched live for (%.3f, %.3f)", lat, lon)
        return result
    except requests.exceptions.Timeout:
        logger.warning("NASA POWER timeout for (%.3f, %.3f)", lat, lon)
    except requests.exceptions.ConnectionError:
        logger.warning("NASA POWER connection error for (%.3f, %.3f)", lat, lon)
    except (NASAClientError, ValueError) as exc:
        logger.warning("NASA POWER error for (%.3f, %.3f): %s", lat, lon, exc)

    # 2. Try cache
    cached = cache.get(cache_key)
    if cached:
        cached["status"] = NASADataStatus.CACHED
        logger.info("Serving cached NASA data for (%.3f, %.3f)", lat, lon)
        return cached

    # 3. Fall back to sample data
    logger.warning("Falling back to sample data for (%.3f, %.3f)", lat, lon)
    sample = _load_sample_data()
    sample["status"] = NASADataStatus.SAMPLE
    sample["sample_note"] = (
        "NASA POWER is currently unreachable. "
        "Results are based on illustrative sample data and must not be used for real decisions."
    )
    return sample


def _fetch_from_nasa(
    lat: float, lon: float, start: str, end: str
) -> dict[str, Any]:
    """
    Make the actual HTTP request to NASA POWER. Raises on failure.
    """
    params = {
        "parameters": ",".join(POWER_VARIABLES),
        "community": "AG",
        "longitude": round(lon, 4),
        "latitude": round(lat, 4),
        "start": start,
        "end": end,
        "format": "JSON",
    }

    response = requests.get(
        settings.NASA_POWER_BASE_URL,
        params=params,
        timeout=settings.NASA_POWER_TIMEOUT,
    )

    if response.status_code != 200:
        raise NASAClientError(
            f"NASA POWER returned HTTP {response.status_code}"
        )

    payload = response.json()
    return _parse_power_response(payload, lat, lon, start, end)


def _parse_power_response(
    payload: dict,
    lat: float,
    lon: float,
    start: str,
    end: str,
) -> dict[str, Any]:
    """
    Validate and extract data from the NASA POWER response JSON.
    Filters out fill values (-999).
    """
    try:
        properties = payload["properties"]
        parameter_block = properties["parameter"]
        header = payload.get("header", {})
        parameter_info = properties.get("parameter_information", {})
    except KeyError as exc:
        raise NASAClientError(
            f"Unexpected NASA POWER response structure: missing key {exc}"
        ) from exc

    if not parameter_block:
        raise NASAClientError("NASA POWER returned empty parameter block")

    # Filter fill values
    clean_data: dict[str, dict[str, float]] = {}
    fill_counts: dict[str, int] = {}

    for var, daily_values in parameter_block.items():
        clean_data[var] = {}
        fill_counts[var] = 0
        for date_str, value in daily_values.items():
            if value is None or float(value) <= FILL_VALUE:
                fill_counts[var] += 1
            else:
                clean_data[var][date_str] = float(value)

    # Warn if excessive missing data
    total_days_expected = _count_days(start, end)
    for var, count in fill_counts.items():
        if total_days_expected > 0:
            pct_missing = count / total_days_expected * 100
            if pct_missing > 20:
                logger.warning(
                    "Variable %s has %.1f%% missing values for (%.3f, %.3f)",
                    var, pct_missing, lat, lon,
                )

    retrieved_at = datetime.utcnow().isoformat() + "Z"

    return {
        "data": clean_data,
        "fill_counts": fill_counts,
        "total_days_expected": total_days_expected,
        "provenance": {
            "source": f"NASA POWER Daily v{header.get('version', '?')}",
            "retrieved_at": retrieved_at,
            "period": {"start": start, "end": end},
            "spatial_resolution_deg": 0.5,
            "variables": list(clean_data.keys()),
            "latitude": lat,
            "longitude": lon,
        },
        "raw_parameter_info": parameter_info,
    }


def _count_days(start: str, end: str) -> int:
    """Count calendar days between two YYYYMMDD strings (inclusive)."""
    try:
        d_start = datetime.strptime(start, "%Y%m%d")
        d_end = datetime.strptime(end, "%Y%m%d")
        return max(0, (d_end - d_start).days + 1)
    except ValueError:
        return 0


def check_nasa_connectivity() -> bool:
    """
    Quick health-check: try to reach NASA POWER for a small known-good request.
    Returns True if reachable.
    """
    test_url = settings.NASA_POWER_BASE_URL
    try:
        r = requests.get(
            test_url,
            params={
                "parameters": "T2M",
                "community": "AG",
                "longitude": -8.0,
                "latitude": 31.0,
                "start": "20240101",
                "end": "20240103",
                "format": "JSON",
            },
            timeout=10,
        )
        return r.status_code == 200
    except (requests.exceptions.RequestException, Exception):
        return False
