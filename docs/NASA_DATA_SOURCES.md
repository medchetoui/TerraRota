# NASA Earth Observation Data Sources Registry

> **Project: TerraRota**  
> **NASA Space Apps Challenge 2026 • Challenge: Field Shift**  
> **Document Version: 2.0 (Official Registry)**

---

## 1. Overview

TerraRota relies on NASA Earth Observation data to transform remote-sensing measurements into tangible agricultural decision support for Moroccan farming communities. Every environmental metric integrated into the platform has documented spatial/temporal characteristics, verified provider endpoints, and clear methodological boundaries.

---

## 2. Integrated & Investigated NASA Products

### 2.1 NASA POWER Agroclimatology (Fully Operational)
- **Official Provider**: NASA Langley Research Center (LaRC)
- **Product Identifier**: `POWER_AG_DAILY_POINT_V2`
- **Integration Status**: **Fully Integrated (Operational)**
- **Official URL**: [https://power.larc.nasa.gov/](https://power.larc.nasa.gov/)
- **API Documentation**: [https://power.larc.nasa.gov/docs/services/api/temporal/daily/](https://power.larc.nasa.gov/docs/services/api/temporal/daily/)
- **Spatial Resolution**: $0.5^\circ \times 0.5^\circ$ grid (~50 km)
- **Temporal Resolution**: Daily observations evaluated over a 5-year climatological window
- **Key Parameters**:
  - `PRECTOTCORR`: Corrected total precipitation (mm/day)
  - `T2M`: Daily average temperature at 2 meters above ground level (°C)
  - `T2M_MAX` / `T2M_MIN`: Daily maximum and minimum temperatures (°C)
  - `RH2M`: Relative humidity at 2 meters (%)
  - `WS2M`: Wind speed at 2 meters (m/s)
  - `ALLSKY_SFC_SW_DWN`: All sky surface solar downward irradiance (MJ/m²/day)
- **Processing in TerraRota**:
  - Mean annual rainfall accumulation ($mm/\text{year}$)
  - Growing Degree Days accumulation ($GDD = \max(0, T_{mean} - 10^\circ\text{C})$)
  - Frost-risk day count ($T_{min} < 0^\circ\text{C}$)
  - UNEP Aridity Index estimation ($AI = P / PET_{Thornthwaite}$)
  - Quality assurance filtering ($FILL\_VALUE = -999.0$)
- **Agronomic Role**: Direct authority for climate eligibility checks and water balance calculations.
- **Limitations**: The $0.5^\circ$ spatial grid represents regional macro-climate; micro-climatic or deep valley temperature variations may not be captured.

---

### 2.2 MODIS Terra/Aqua Vegetation Indices (Investigating / Planned)
- **Official Provider**: NASA Goddard Space Flight Center (GSFC) / LP DAAC
- **Product Identifier**: `MOD13Q1` (Terra) & `MYD13Q1` (Aqua) Version 6.1
- **Integration Status**: **Investigating / Modular Secondary**
- **Official URL**: [https://modis.gsfc.nasa.gov/data/dataprod/mod13.php](https://modis.gsfc.nasa.gov/data/dataprod/mod13.php)
- **Spatial Resolution**: 250 meters
- **Temporal Resolution**: 16-day composite
- **Variables**: NDVI (Normalized Difference Vegetation Index), EVI (Enhanced Vegetation Index), VI Quality Flags.
- **Planned Agricultural Role**: Tracking seasonal vegetative biomass and phenological green-up curves across Moroccan agricultural plains (Chaouia, Saïss, Gharb).
- **Scientific Caveat**: NDVI and EVI measure photosynthetic greenness; they cannot directly measure soil fertility, soil moisture, crop disease, or final yield.

---

### 2.3 NASA SMAP Soil Moisture (Investigating / Planned)
- **Official Provider**: NASA Jet Propulsion Laboratory (JPL)
- **Product Identifier**: `SPL3SMP_E` (Enhanced L3 Radiometer) / `SPL4SMAU` (Root-Zone Model)
- **Integration Status**: **Investigating**
- **Official URL**: [https://smap.jpl.nasa.gov/](https://smap.jpl.nasa.gov/)
- **Spatial Resolution**: 9 km (L3) / 36 km (L4 root-zone)
- **Temporal Resolution**: 2–3 day revisit
- **Variables**: Top 5cm surface volumetric soil moisture ($m^3/m^3$), root-zone moisture ($0-100\text{ cm}$).
- **Scientific Caveat**: Satellite radiometers measure only the top 5 cm of the soil column. Root-zone soil moisture is an output of assimilated land-surface models, not a direct radiometric observation.

---

### 2.4 NASA GPM IMERG Precipitation (Investigating)
- **Official Provider**: NASA GSFC / JAXA
- **Product Identifier**: `GPM_3IMERGDL` (Final Run)
- **Integration Status**: **Investigating**
- **Official URL**: [https://gpm.nasa.gov/](https://gpm.nasa.gov/)
- **Spatial Resolution**: $0.1^\circ \times 0.1^\circ$ (~10 km)
- **Temporal Resolution**: Daily multi-satellite fusion calibrated with GPCC gauges.
- **Planned Agricultural Role**: Secondary precipitation validation against NASA POWER over complex topographical terrain (Atlas mountain foothills).

---

### 2.5 ISRIC SoilGrids 250m (Partially Integrated)
- **Official Provider**: ISRIC – World Soil Information (FAO Global Soil Partnership)
- **Product Identifier**: `SoilGrids250m v2.0`
- **Integration Status**: **Partially Integrated (Reference Archetypes)**
- **Official URL**: [https://soilgrids.org/](https://soilgrids.org/)
- **Spatial Resolution**: 250 meters
- **Variables**: Clay, Sand, Silt, Soil Organic Carbon (SOC), pH in H2O, Available Water Capacity (AWC).
- **Role in TerraRota**: Provides digital baseline physical soil profiles cross-referenced with Moroccan traditional soil types (Tirs, Hamri, Rmel, Dahra).

---

## 3. Data Integrity & Provenance Guarantee

TerraRota adheres to strict scientific communication ethics:
1. **Zero Data Fabrication**: We never generate pseudo-random or fabricated rainfall, temperature, or satellite indicators.
2. **Offline Fallback Transparency**: When NASA endpoints experience downtime or network latency, the platform serves a verified historical reference snapshot and tags the response with an explicit notice (`status="sample"`).
3. **No Forecast Confusion**: NASA POWER multi-year climatology represents historical statistical observations, not a 7-day predictive weather forecast.
