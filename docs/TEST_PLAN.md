# Test Plan — TerraRota

## Backend Tests (pytest-django)

### Health endpoint
- [ ] Returns 200 OK
- [ ] Response contains `status`, `version`, `nasa_power_reachable`, `timestamp`

### Input validation
- [ ] Missing `latitude` → 400 with `VALIDATION_ERROR`
- [ ] Missing `longitude` → 400 with `VALIDATION_ERROR`
- [ ] `latitude` = 91 → 400 (out of range)
- [ ] `longitude` = 200 → 400 (out of range)
- [ ] `water_access` = `"invalid_value"` → 400
- [ ] `notes` > 500 chars → 400
- [ ] All optional fields absent → valid 200

### NASA POWER data service
- [ ] Successful mocked response → indicators calculated correctly
- [ ] HTTP timeout → returns `data_status: "sample"`
- [ ] HTTP 500 from NASA → returns `data_status: "sample"`
- [ ] Response missing expected variable → handled gracefully
- [ ] Response contains fill values (-999) → filtered before calculation
- [ ] >20% missing values → `insufficient_data` flag raised

### Indicator calculations (unit tests, no HTTP)
- [ ] GDD calculated correctly for known temperature sequence
- [ ] Aridity index computed correctly for known precip/PET values
- [ ] Frost days counted correctly
- [ ] Annual rainfall summed correctly
- [ ] All functions return documented units

### Recommendation engine (unit tests, no HTTP, no NASA)
- [ ] Barley ranked first for semi-arid, rainfed, good GDD scenario
- [ ] Tomato ineligible when rainfed + rain < 500 mm
- [ ] Rotation caution applied when previous_crop = wheat_hard
- [ ] Score ≥ 30 threshold required for inclusion in results
- [ ] Engine abstains when no crop scores ≥ 30
- [ ] Each result contains `reasons`, `cautions`, `rules_applied`
- [ ] Provisional flag set correctly

### Full integration (with mocked NASA service)
- [ ] Complete POST → response includes provenance, indicators, recommendations
- [ ] `data_status: "sample"` appears correctly when NASA mocked as unavailable

---

## Frontend Tests (Vitest + Testing Library)

### Form validation
- [ ] Submit without latitude → shows error
- [ ] Submit without longitude → shows error
- [ ] Coordinates out of range → shows error
- [ ] Valid inputs → API call made

### API interaction
- [ ] Successful response → recommendations rendered
- [ ] Loading spinner shown during request
- [ ] API error → error message shown
- [ ] `data_status: "sample"` → sample data warning shown

### Results display
- [ ] Each recommendation shows crop name, score, reasons
- [ ] Cautions displayed when present
- [ ] Missing data fields shown
- [ ] `is_provisional` warning shown
- [ ] "Revise inputs" button available

### Accessibility
- [ ] All form inputs have associated labels
- [ ] Error messages linked to inputs via aria-describedby
- [ ] Focus management on form errors

---

## Manual Checks

### NASA live connectivity
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts/check_nasa.py
```
Expected: prints climate data for a test location and `status: live`

### End-to-end demo
1. Start backend and frontend
2. Submit Marrakech coordinates
3. Verify recommendations appear
4. Verify provenance shows NASA source

### TypeScript / build checks
```powershell
cd frontend
npm run type-check
npm run build
```
Both must succeed with 0 errors.
