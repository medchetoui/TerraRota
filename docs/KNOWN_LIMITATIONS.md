# Known Limitations & Scientific Boundaries

> **Project: TerraRota**  
> **NASA Space Apps Challenge 2026 • Challenge: Field Shift**  
> *"Scientific transparency is a core pillar of TerraRota. We do not conceal limitations to make the system appear more advanced than it is."*

---

## 1. Spatial Resolution of NASA Earth Observations
- **Current Operational Source**: NASA POWER Daily Agroclimatology operates on a $0.5^\circ \times 0.5^\circ$ geographic grid cell (approximately $50 \times 50\text{ km}$ at Moroccan latitudes).
- **Impact**: The data represents the prevailing regional macro-climate. Micro-climatic phenomena—such as thermal inversions in mountain valleys (e.g., High Atlas valleys) or maritime sea-breeze micro-humidity gradients along the Atlantic coastal strip—may not be resolved at this spatial scale.
- **Mitigation / Next Step**: Integration of $10\text{ km}$ GPM IMERG and $250\text{ m}$ MODIS/Sentinel products as finer satellite data streams become accessible.

---

## 2. Climatological History vs Weather Forecasting
- **Climatological Window**: TerraRota computes 5-year statistical indicators (annual rainfall, temperature extremes, GDD accumulation, aridity ratios) to evaluate structural crop suitability.
- **Boundary**: NASA POWER data represents historical Earth observations and climatological statistics. It is **not** a real-time 7-day weather forecast and must not be interpreted as predictive weather for immediate field operations (such as spraying pesticides or harvesting).

---

## 3. Soil Information & Spatial Uncertainty
- **Modelled vs Laboratory**: Digital soil datasets such as ISRIC SoilGrids 250m are derived from machine learning models trained on global soil profiles.
- **Boundary**: While valuable for regional archetyping (Tirs vs Hamri vs Rmel), they carry spatial uncertainty and cannot replace an in-situ laboratory soil core sample for exact nutrient management (NPK dosage) or precise electrical conductivity ($EC_e$) testing.

---

## 4. Agronomic Rules Validation
- **Provisional Nature**: All suitability rules and constraint thresholds are coded based on published literature from INRA Maroc, ICARDA, and FAO ECOCROP.
- **Operational Requirement**: In practice, local varieties (e.g., Karim, Isly, Marzak durum wheats) have distinct breeding attributes. Recommendations should be reviewed in partnership with a local agricultural extension technician (*Conseiller ONCA*).

---

## 5. Yield & Financial Projections
- **Integrity Policy**: TerraRota deliberately refrains from fabricating exact metric yield projections ($q/ha$) or net dollar profit estimations. Crop yield depends on dynamic factors outside satellite observation alone, including seed vigor, weed pressure, sowing depth, and timely weed management.

---

## 6. Voice Synthesis & Speech Recognition
- **Device Dependency**: "Ami Ahmed" voice assistance relies on the standard W3C Web Speech API (`SpeechSynthesis`). Speech cadence and Moroccan Darija dialect nuances vary across client operating systems, browsers, and installed voice synthesizers.
