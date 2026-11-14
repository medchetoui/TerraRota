"""
NASA Earth Observation Data Source Registry for TerraRota.

Documents every environmental dataset used or investigated by TerraRota,
its spatial/temporal resolution, provider, parameters, and operational status.
"""
from typing import Any

NASA_DATA_SOURCES = [
    {
        "id": "nasa_power_ag",
        "name": "NASA POWER Daily Agroclimatology",
        "provider": "NASA Langley Research Center (LaRC)",
        "product_id": "POWER_AG_DAILY_POINT_V2",
        "official_url": "https://power.larc.nasa.gov/",
        "api_docs_url": "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
        "status": "fully_integrated",
        "spatial_resolution": "0.5° × 0.5° (~50 km)",
        "temporal_resolution": "Daily observations (5-year multi-annual climatology)",
        "variables": [
            {"code": "PRECTOTCORR", "name": "Corrected Precipitation", "unit": "mm/day"},
            {"code": "T2M", "name": "Temperature at 2 Meters", "unit": "°C"},
            {"code": "T2M_MAX", "name": "Maximum Daily Temperature", "unit": "°C"},
            {"code": "T2M_MIN", "name": "Minimum Daily Temperature", "unit": "°C"},
            {"code": "RH2M", "name": "Relative Humidity at 2 Meters", "unit": "%"},
            {"code": "WS2M", "name": "Wind Speed at 2 Meters", "unit": "m/s"},
            {"code": "ALLSKY_SFC_SW_DWN", "name": "All Sky Surface Shortwave Downward Irradiance", "unit": "MJ/m²/day"},
        ],
        "processing_methods": [
            "GDD (Growing Degree Days Base 10°C) accumulation",
            "UNEP Aridity Index (P / PET Thornthwaite formulation)",
            "Frost Risk Days Count (T_min < 0°C)",
            "Dry Months Climatology (<30mm threshold)",
            "Fill-value filtering (-999.0 quality control)",
        ],
        "limitations": "0.5° spatial grid resolution represents regional macro-climate; micro-climatic or deep valley temperature variations may not be captured.",
    },
    {
        "id": "modis_vegetation",
        "name": "MODIS Terra/Aqua Vegetation Indices",
        "provider": "NASA Goddard Space Flight Center (GSFC) / LP DAAC",
        "product_id": "MOD13Q1 / MYD13Q1 Version 6.1",
        "official_url": "https://modis.gsfc.nasa.gov/data/dataprod/mod13.php",
        "api_docs_url": "https://lpdaac.usgs.gov/products/mod13q1v061/",
        "status": "investigating",
        "spatial_resolution": "250 meters",
        "temporal_resolution": "16-day composite",
        "variables": [
            {"code": "NDVI", "name": "Normalized Difference Vegetation Index", "unit": "Index (-1 to +1)"},
            {"code": "EVI", "name": "Enhanced Vegetation Index", "unit": "Index (-1 to +1)"},
            {"code": "VI_Quality", "name": "Vegetation Index Pixel Reliability Flags", "unit": "Bitmask"},
        ],
        "processing_methods": [
            "Atmospheric correction & cloud mask filtering",
            "Phenological crop vigor temporal curves",
        ],
        "limitations": "Measures vegetative greenness and biomass; cannot directly measure soil fertility, soil moisture, or crop disease.",
    },
    {
        "id": "nasa_smap",
        "name": "NASA Soil Moisture Active Passive (SMAP)",
        "provider": "NASA Jet Propulsion Laboratory (JPL)",
        "product_id": "SPL3SMP_E / SPL4SMAU",
        "official_url": "https://smap.jpl.nasa.gov/",
        "api_docs_url": "https://nsidc.org/data/smap",
        "status": "investigating",
        "spatial_resolution": "9 km (enhanced L3) / 36 km (L4 root zone)",
        "temporal_resolution": "2-3 days",
        "variables": [
            {"code": "soil_moisture_surface", "name": "Top 5cm Surface Soil Moisture", "unit": "m³/m³"},
            {"code": "soil_moisture_rootzone", "name": "Root Zone Soil Moisture (0-100cm Modelled)", "unit": "m³/m³"},
        ],
        "processing_methods": [
            "L-band radiometer backscatter retrieval coupled with land surface catchment models",
        ],
        "limitations": "Direct radiometric retrieval penetrates only the top 5 cm of soil; root-zone values are assimilated via numerical land models.",
    },
    {
        "id": "nasa_gpm",
        "name": "NASA Global Precipitation Measurement (GPM)",
        "provider": "NASA GSFC / JAXA",
        "product_id": "GPM_3IMERGDL (IMERG Final Run)",
        "official_url": "https://gpm.nasa.gov/",
        "api_docs_url": "https://gpm.nasa.gov/data/imerg",
        "status": "investigating",
        "spatial_resolution": "0.1° × 0.1° (~10 km)",
        "temporal_resolution": "Daily / Monthly multi-satellite precipitation estimate",
        "variables": [
            {"code": "precipitationCal", "name": "Calibrated Precipitation Rate", "unit": "mm/hour / mm/day"},
        ],
        "processing_methods": [
            "Microwave and infrared multi-satellite constellation fusion with ground rain-gauge calibration",
        ],
        "limitations": "Provides precipitation estimate across complex Moroccan Atlas relief where ground radar is limited.",
    },
    {
        "id": "soilgrids_isric",
        "name": "SoilGrids Global Gridded Soil Information",
        "provider": "ISRIC – World Soil Information / FAO Partner",
        "product_id": "SoilGrids250m v2.0",
        "official_url": "https://soilgrids.org/",
        "api_docs_url": "https://www.isric.org/explore/soilgrids",
        "status": "partially_integrated",
        "spatial_resolution": "250 meters",
        "temporal_resolution": "Static digital soil mapping",
        "variables": [
            {"code": "clay", "name": "Clay Content", "unit": "g/kg (%)"},
            {"code": "sand", "name": "Sand Content", "unit": "g/kg (%)"},
            {"code": "silt", "name": "Silt Content", "unit": "g/kg (%)"},
            {"code": "phh2o", "name": "Soil pH in H2O", "unit": "pH scale"},
            {"code": "soc", "name": "Soil Organic Carbon", "unit": "dg/kg"},
            {"code": "wv0033", "name": "Available Water Capacity", "unit": "cm³/cm³"},
        ],
        "processing_methods": [
            "Machine learning random forest models trained on global soil profiles and environmental covariates",
        ],
        "limitations": "Modelled digital soil prediction carries spatial uncertainty; laboratory soil tests are recommended for field-level precision.",
    },
]


def get_data_sources_registry() -> list[dict[str, Any]]:
    return NASA_DATA_SOURCES
