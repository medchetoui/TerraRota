# NASA Data Sources — TerraRota

## Primary Source: NASA POWER

**Full name:** Prediction Of Worldwide Energy Resources (POWER)  
**URL:** https://power.larc.nasa.gov/  
**API docs:** https://power.larc.nasa.gov/docs/services/api/  
**Version used:** Daily v2.5.0  
**Authentication:** None required (public API)  
**Rate limits:** Not published; recommend 1 request per 5 seconds for batch use  

### Spatial coverage
- Global
- **Resolution:** ~0.5° × 0.5° (~50 km × 50 km at mid-latitudes)
- **Important:** This is NOT field-level precision. Results represent a ~2500 km² grid cell.

### Temporal coverage
- Daily data from 1981 to near-real-time (~3–7 days lag)
- TerraRota uses a 5-year window (e.g., 2021–2025) as default

### Variables used by TerraRota

| Variable | Full name | Units | Community |
|---|---|---|---|
| `T2M` | Temperature at 2m | °C | AG |
| `T2M_MAX` | Daily max temperature | °C | AG |
| `T2M_MIN` | Daily min temperature | °C | AG |
| `PRECTOTCORR` | Precipitation (corrected) | mm/day | AG |
| `RH2M` | Relative humidity at 2m | % | AG |
| `ALLSKY_SFC_SW_DWN` | Solar radiation (all-sky) | MJ/m²/day | AG |
| `WS2M` | Wind speed at 2m | m/s | AG |

### Example API call

```
GET https://power.larc.nasa.gov/api/temporal/daily/point
  ?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M
  &community=AG
  &longitude=-8.75
  &latitude=31.52
  &start=20210101
  &end=20251231
  &format=JSON
```

### Known limitations

- Spatial resolution (~50 km) does not capture local topographic effects.
- Cloud cover affects solar radiation estimates.
- Precipitation in complex terrain (Atlas mountains) is less accurate.
- Data has a 3–7 day latency; not suitable for real-time alerts.
- Missing-value fill code: `-999` — must be filtered before calculations.

## Potential Additional Sources (Not Yet Implemented)

### NASA SMAP (Soil Moisture Active Passive)
- **Use case:** Surface soil moisture
- **Resolution:** ~36 km (passive), ~3 km (active)
- **Caveat:** Point-level soil moisture ≠ field water availability
- **Status:** Under evaluation; not in MVP

### MODIS (via NASA Earthdata)
- **Use case:** Land cover, vegetation index (NDVI)
- **Resolution:** 250 m – 1 km depending on product
- **Caveat:** Requires Earthdata login; more complex integration
- **Status:** Post-MVP consideration

### NASA FIRMS (Fire Information)
- **Use case:** Wildfire risk context
- **Status:** Not in scope for MVP

## Data Quality Standards Applied

1. Filter `-999` fill values before any calculation.
2. Flag locations with >20% missing daily values in the analysis window.
3. Report both the analysis period and the percentage of valid days used.
4. Never substitute missing values with invented data.
5. All provenance metadata (source, period, resolution) must accompany every recommendation response.
