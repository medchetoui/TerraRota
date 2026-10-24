# Team Tasks — TerraRota

> Provisional assignments — confirm with team before locking.

---

## Member 1 — Technical Lead / Backend / Integration (Mohammed)

**Deliverables**
- [ ] Project repository set up and working on all members' machines
- [ ] Django backend running with all endpoints
- [ ] API contract documented and shared
- [ ] NASA data service integrated and tested
- [ ] End-to-end integration verified
- [ ] Backend tests passing
- [ ] Code review for all PRs

**Acceptance criteria**
- `pytest` passes with 0 failures
- `POST /api/v1/recommendations/` returns valid JSON for Marrakech test case
- All secrets in `.env` only

**Blockers**
- None currently

---

## Member 2 — NASA Data Specialist

**Deliverables**
- [ ] Document NASA POWER variable definitions and units for Morocco
- [ ] Retrieve and validate real data for ≥3 Moroccan locations
- [ ] Document percentage of missing values per location
- [ ] Identify and document any data gaps or anomalies
- [ ] Review and update `docs/NASA_DATA_SOURCES.md`
- [ ] Verify SMAP and MODIS feasibility (optional)

**How to work independently**
- Use the NASA POWER API directly: https://power.larc.nasa.gov/api/temporal/daily/point
- Run `python backend/scripts/check_nasa.py` to test connectivity
- Document findings in `docs/NASA_DATA_SOURCES.md`

**Acceptance criteria**
- Data retrieved and validated for Marrakech, Agadir, and Fes
- Missing value percentage documented for each location
- No invented or estimated values in documentation

**Blockers**
- Depends on internet access to NASA POWER

---

## Member 3 — Recommendation Engine / Agronomy

**Deliverables**
- [ ] Research ≥3 sources for each crop rule threshold
- [ ] Update `docs/AGRONOMIC_RULES.md` with sources or mark provisional
- [ ] Review and improve rule thresholds in `backend/recommendation/rules.py`
- [ ] Write unit tests for each new or modified rule
- [ ] Identify crops that should be added or removed from the list
- [ ] Define the rotation compatibility matrix

**How to work independently**
- Edit `backend/recommendation/rules.py` (does not require NASA or frontend)
- Run engine tests: `pytest backend/recommendation/tests/ -v`
- Update docs in `docs/AGRONOMIC_RULES.md`

**Acceptance criteria**
- Every rule has either a cited source or is explicitly marked `[PROVISIONAL]`
- Unit tests cover all new rules
- No agronomic claim made without a basis

**Blockers**
- Depends on access to agricultural references (FAO, INRA Morocco, etc.)

---

## Member 4 — Frontend / UX

**Deliverables**
- [ ] All screens implemented (see `docs/PROJECT_SCOPE.md` user journey)
- [ ] Form validation working
- [ ] API connected (can use mock data initially)
- [ ] French UI complete
- [ ] Arabic RTL structure in place (translations can be partial)
- [ ] Mobile-responsive layout
- [ ] Sample data warning displayed

**How to work independently**
- Use `frontend/src/mocks/sampleResponse.ts` for mock API responses
- Set `VITE_USE_MOCK=true` in `frontend/.env.local` to bypass real API
- Run: `cd frontend && npm run dev`

**Acceptance criteria**
- All screens render without console errors
- Form validation catches missing coordinates
- Recommendations display with score, reasons, and cautions
- Sample data warning visible when `data_status === "sample"`
- Responsive on 375px–1440px screen widths

**Blockers**
- Depends on API contract (Member 1) — use mock data until backend ready

---

## Shared Timeline (Provisional)

| Milestone | Target | Owner |
|---|---|---|
| Backend running locally | Day 1 | Member 1 |
| API contract shared | Day 1 | Member 1 |
| Frontend skeleton + mock | Day 1–2 | Member 4 |
| NASA data validated | Day 2 | Member 2 |
| Agronomic rules v1 | Day 2–3 | Member 3 |
| Full integration working | Day 3 | Member 1 |
| Frontend connected to API | Day 3–4 | Member 4 |
| All tests passing | Day 4 | All |
| Demo rehearsal | Day 5 | All |
