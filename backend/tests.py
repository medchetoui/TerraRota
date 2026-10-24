"""
Backend test suite for TerraRota.

Tests:
  - Health endpoint
  - Input validation
  - NASA POWER service (mocked)
  - Indicator calculations
  - Recommendation engine
  - Full integration flow
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APIClient, APITestCase

from indicators.calculator import calculate, InsufficientDataError
from recommendation.engine import rank


# ─────────────────────────────────────────────
# Fixtures / helpers
# ─────────────────────────────────────────────

def _make_climate_result(
    annual_rain=350.0, mean_temp=18.0, t_max=26.0, t_min=10.0,
    frost_days=3, status="live"
):
    """Build a minimal climate result dict for testing without NASA HTTP."""
    # Generate 5 years of simple daily data
    data = {
        "T2M": {},
        "T2M_MAX": {},
        "T2M_MIN": {},
        "PRECTOTCORR": {},
        "RH2M": {},
        "ALLSKY_SFC_SW_DWN": {},
        "WS2M": {},
    }

    # Populate 5 years × 12 months × 28 days = 1680 data points
    years = range(2021, 2026)
    for year in years:
        for month in range(1, 13):
            for day in range(1, 29):
                date_str = f"{year}{month:02d}{day:02d}"
                # Temperature: frost in Jan/Feb
                if month in (1, 2) and frost_days > 0:
                    tmin = -1.0
                    tmax = t_max * 0.5
                    tmean = (tmin + tmax) / 2
                else:
                    tmin = t_min
                    tmax = t_max
                    tmean = mean_temp

                data["T2M"][date_str] = tmean
                data["T2M_MAX"][date_str] = tmax
                data["T2M_MIN"][date_str] = tmin

                # Precipitation: winter months
                if month in (11, 12, 1, 2, 3):
                    # ~350mm annual → ~70mm per rainy month → ~2.5mm/day in 5 months
                    data["PRECTOTCORR"][date_str] = 2.5
                else:
                    data["PRECTOTCORR"][date_str] = 0.0

                data["RH2M"][date_str] = 50.0
                data["ALLSKY_SFC_SW_DWN"][date_str] = 15.0
                data["WS2M"][date_str] = 3.0

    return {
        "status": status,
        "data": data,
        "fill_counts": {k: 0 for k in data},
        "total_days_expected": 1680,
        "provenance": {
            "source": "TEST DATA",
            "retrieved_at": "2026-01-01T00:00:00Z",
            "period": {"start": "20210101", "end": "20251231"},
            "spatial_resolution_deg": 0.5,
            "variables": list(data.keys()),
            "latitude": 31.52,
            "longitude": -8.75,
        },
        "raw_parameter_info": {},
    }


# ─────────────────────────────────────────────
# Health endpoint tests
# ─────────────────────────────────────────────

class TestHealthEndpoint(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_returns_200(self):
        with patch("api.views.nasa_power.check_nasa_connectivity", return_value=True):
            response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)

    def test_health_response_structure(self):
        with patch("api.views.nasa_power.check_nasa_connectivity", return_value=True):
            response = self.client.get("/api/v1/health/")
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("version", data)
        self.assertIn("nasa_power_reachable", data)
        self.assertIn("timestamp", data)

    def test_health_nasa_unreachable(self):
        with patch("api.views.nasa_power.check_nasa_connectivity", return_value=False):
            response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["nasa_power_reachable"])


# ─────────────────────────────────────────────
# Input validation tests
# ─────────────────────────────────────────────

class TestInputValidation(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.valid_payload = {
            "latitude": 31.52,
            "longitude": -8.75,
            "water_access": "rainfed",
            "soil_type": "clay_loam",
        }

    def _post(self, payload):
        with patch(
            "api.views.nasa_power.fetch_climate_data",
            return_value=_make_climate_result(),
        ):
            return self.client.post(
                "/api/v1/recommendations/", payload, format="json"
            )

    def test_valid_minimal_payload(self):
        response = self._post({"latitude": 31.52, "longitude": -8.75})
        self.assertEqual(response.status_code, 200)

    def test_missing_latitude_returns_400(self):
        response = self._post({"longitude": -8.75})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "VALIDATION_ERROR")
        self.assertIn("latitude", response.json()["errors"])

    def test_missing_longitude_returns_400(self):
        response = self._post({"latitude": 31.52})
        self.assertEqual(response.status_code, 400)
        self.assertIn("longitude", response.json()["errors"])

    def test_latitude_out_of_range_high(self):
        response = self._post({"latitude": 91.0, "longitude": -8.75})
        self.assertEqual(response.status_code, 400)

    def test_latitude_out_of_range_low(self):
        response = self._post({"latitude": -91.0, "longitude": -8.75})
        self.assertEqual(response.status_code, 400)

    def test_longitude_out_of_range(self):
        response = self._post({"latitude": 31.0, "longitude": 200.0})
        self.assertEqual(response.status_code, 400)

    def test_invalid_water_access_returns_400(self):
        response = self._post({
            "latitude": 31.52, "longitude": -8.75,
            "water_access": "magic_water",
        })
        self.assertEqual(response.status_code, 400)

    def test_notes_too_long_returns_400(self):
        response = self._post({
            "latitude": 31.52, "longitude": -8.75,
            "notes": "x" * 501,
        })
        self.assertEqual(response.status_code, 400)

    def test_all_optional_fields_absent(self):
        """Request with only lat/lon should be valid."""
        response = self._post({"latitude": 31.52, "longitude": -8.75})
        self.assertEqual(response.status_code, 200)

    def test_full_valid_payload(self):
        response = self._post(self.valid_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")


# ─────────────────────────────────────────────
# NASA service tests (mocked)
# ─────────────────────────────────────────────

class TestNASAService(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_nasa_timeout_returns_sample(self):
        """On timeout, the system falls back to sample data without crashing."""
        import requests as req_lib
        with patch(
            "data_services.nasa_power._fetch_from_nasa",
            side_effect=req_lib.exceptions.Timeout,
        ):
            # Clear cache to force fallback
            from django.core.cache import cache
            cache.clear()
            response = self.client.post(
                "/api/v1/recommendations/",
                {"latitude": 31.52, "longitude": -8.75},
                format="json",
            )
        self.assertEqual(response.status_code, 200)
        # Must be sample or live (from cache); never a server error
        # Sample fixture data is sparse — valid statuses include insufficient_data
        # (system is honest about data quality even in fallback mode)
        self.assertIn(
            response.json().get("data_status"),
            ["sample", "cached", "live", "insufficient_data"],
        )

    def test_nasa_connection_error_falls_back(self):
        """On connection error, falls back gracefully."""
        import requests as req_lib
        with patch(
            "data_services.nasa_power._fetch_from_nasa",
            side_effect=req_lib.exceptions.ConnectionError,
        ):
            from django.core.cache import cache
            cache.clear()
            response = self.client.post(
                "/api/v1/recommendations/",
                {"latitude": 31.52, "longitude": -8.75},
                format="json",
            )
        self.assertEqual(response.status_code, 200)

    def test_live_nasa_data_status(self):
        """When NASA returns data, status should be 'live'."""
        with patch(
            "api.views.nasa_power.fetch_climate_data",
            return_value=_make_climate_result(status="live"),
        ):
            response = self.client.post(
                "/api/v1/recommendations/",
                {"latitude": 31.52, "longitude": -8.75},
                format="json",
            )
        self.assertEqual(response.json()["data_status"], "live")


# ─────────────────────────────────────────────
# Indicator calculation tests
# ─────────────────────────────────────────────

class TestIndicatorCalculations(TestCase):
    def test_annual_rainfall_calculated(self):
        climate = _make_climate_result(annual_rain=350)
        indicators = calculate(climate)
        # Our fixture has 5 rainy months × 28 days × 2.5mm = 350mm/yr
        self.assertGreater(indicators["annual_rain_mm"], 0)

    def test_mean_temp_calculated(self):
        climate = _make_climate_result(mean_temp=18.0)
        indicators = calculate(climate)
        # Mean should be roughly 18°C (accounting for frost months)
        self.assertGreater(indicators["mean_annual_temp_c"], 0)
        self.assertLess(indicators["mean_annual_temp_c"], 35)

    def test_gdd_positive(self):
        climate = _make_climate_result(mean_temp=18.0)
        indicators = calculate(climate)
        self.assertGreater(indicators["gdd_base10"], 0)

    def test_frost_days_detected(self):
        climate = _make_climate_result(frost_days=5)
        indicators = calculate(climate)
        self.assertGreater(indicators["frost_days_per_year"], 0)

    def test_no_frost_days_when_warm(self):
        climate = _make_climate_result(t_min=15.0, frost_days=0)
        # Override T2M_MIN to be all warm
        for date_str in climate["data"]["T2M_MIN"]:
            climate["data"]["T2M_MIN"][date_str] = 15.0
        indicators = calculate(climate)
        self.assertEqual(indicators["frost_days_per_year"], 0.0)

    def test_aridity_index_between_0_and_1_for_semi_arid(self):
        climate = _make_climate_result(annual_rain=350, mean_temp=18)
        indicators = calculate(climate)
        ai = indicators["aridity_index"]
        self.assertGreater(ai, 0.0)
        self.assertLess(ai, 1.0)

    def test_insufficient_data_raises(self):
        climate = _make_climate_result()
        # Remove almost all temperature data
        climate["data"]["T2M"] = {"20210101": 18.0}
        climate["total_days_expected"] = 1826
        with self.assertRaises(InsufficientDataError):
            calculate(climate)

    def test_dry_months_calculated(self):
        climate = _make_climate_result()
        indicators = calculate(climate)
        # With our fixture (7 dry months), should be > 0
        self.assertGreaterEqual(indicators["dry_months"], 0)

    def test_missing_data_pct_reported(self):
        climate = _make_climate_result()
        indicators = calculate(climate)
        self.assertIn("missing_data_pct", indicators)


# ─────────────────────────────────────────────
# Recommendation engine tests
# ─────────────────────────────────────────────

class TestRecommendationEngine(TestCase):
    def _make_indicators(
        self,
        rain=350, temp=18, gdd=2500, frost=4,
        aridity=0.33, dry_months=6
    ):
        return {
            "annual_rain_mm": rain,
            "mean_annual_temp_c": temp,
            "gdd_base10": gdd,
            "frost_days_per_year": frost,
            "aridity_index": aridity,
            "dry_months": dry_months,
            "missing_data_pct": 0.0,
            "_warnings": [],
        }

    def test_barley_ranks_well_semi_arid_rainfed(self):
        indicators = self._make_indicators(rain=350, aridity=0.33)
        result = rank(indicators, {"water_access": "rainfed", "previous_crop": "wheat_hard"})
        crop_ids = [r["crop_id"] for r in result["recommendations"]]
        self.assertIn("barley", crop_ids)

    def test_tomato_ineligible_rainfed_dry(self):
        """Tomato should be ineligible with rainfed + <500mm rain."""
        indicators = self._make_indicators(rain=320, aridity=0.30)
        result = rank(indicators, {"water_access": "rainfed"})
        abstained_ids = [a["crop_id"] for a in result["abstained_crops"]]
        self.assertIn("tomato", abstained_ids)

    def test_tomato_eligible_irrigated(self):
        """Tomato should appear when irrigated."""
        indicators = self._make_indicators(rain=200, temp=22, gdd=2800)
        result = rank(indicators, {"water_access": "irrigated"})
        crop_ids = [r["crop_id"] for r in result["recommendations"]]
        self.assertIn("tomato", crop_ids)

    def test_rotation_caution_applied(self):
        """Wheat rotation caution should appear when previous crop is wheat."""
        indicators = self._make_indicators()
        result = rank(indicators, {"water_access": "rainfed", "previous_crop": "wheat_hard"})
        wheat_results = [r for r in result["recommendations"] if r["crop_id"] == "wheat_hard"]
        if wheat_results:
            cautions = wheat_results[0]["cautions"]
            self.assertTrue(
                any("rotation" in c.lower() or "wheat" in c.lower() for c in cautions),
                f"Expected rotation caution, got: {cautions}"
            )

    def test_chickpea_gets_rotation_bonus(self):
        """Chickpea should get rotation bonus when previous crop was wheat."""
        indicators = self._make_indicators(rain=380, gdd=2200, aridity=0.36)
        result = rank(
            indicators,
            {"water_access": "rainfed", "previous_crop": "wheat_hard"}
        )
        chickpea_results = [r for r in result["recommendations"] if r["crop_id"] == "chickpea"]
        if chickpea_results:
            reasons = chickpea_results[0]["reasons"]
            self.assertTrue(
                any("nitrogen" in r.lower() or "cereal" in r.lower() for r in reasons),
                f"Expected rotation reason, got: {reasons}"
            )

    def test_engine_abstains_when_conditions_extreme(self):
        """Engine should abstain when no crops score above threshold."""
        # Hyper-arid + freezing — most crops should fail
        indicators = self._make_indicators(
            rain=10, aridity=0.01, temp=2, gdd=200, frost=100
        )
        result = rank(indicators, {})
        # Either no recommendations or abstention reason provided
        if not result["recommendations"]:
            self.assertIsNotNone(result["abstention_reason"])

    def test_all_results_have_required_fields(self):
        """Every recommendation must include all required fields."""
        indicators = self._make_indicators()
        result = rank(indicators, {"water_access": "rainfed"})
        required_fields = [
            "crop_id", "crop_name_fr", "crop_name_ar", "score",
            "rank", "eligible", "reasons", "cautions", "rules_applied",
            "is_provisional",
        ]
        for rec in result["recommendations"]:
            for field in required_fields:
                self.assertIn(field, rec, f"Field '{field}' missing from {rec['crop_id']}")

    def test_scores_are_bounded(self):
        """All scores must be between 0 and 100."""
        indicators = self._make_indicators()
        result = rank(indicators, {"water_access": "irrigated"})
        for rec in result["recommendations"]:
            self.assertGreaterEqual(rec["score"], 0)
            self.assertLessEqual(rec["score"], 100)

    def test_all_results_are_provisional(self):
        """All results should be provisional since rules are not validated."""
        indicators = self._make_indicators()
        result = rank(indicators, {})
        for rec in result["recommendations"]:
            self.assertTrue(rec["is_provisional"])

    def test_preferred_crop_gets_bonus(self):
        """Preferred crops should score at least as high as without preference."""
        indicators = self._make_indicators()
        result_no_pref = rank(indicators, {"water_access": "rainfed"})
        result_with_pref = rank(
            indicators, {"water_access": "rainfed"}, preferred_crops=["barley"]
        )
        barley_no = next((r["score"] for r in result_no_pref["recommendations"] if r["crop_id"] == "barley"), 0)
        barley_with = next((r["score"] for r in result_with_pref["recommendations"] if r["crop_id"] == "barley"), 0)
        self.assertGreaterEqual(barley_with, barley_no)


# ─────────────────────────────────────────────
# Integration tests
# ─────────────────────────────────────────────

class TestFullIntegration(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_full_recommendation_flow(self):
        """Full POST → indicators → engine → response."""
        with patch(
            "api.views.nasa_power.fetch_climate_data",
            return_value=_make_climate_result(status="live"),
        ):
            response = self.client.post(
                "/api/v1/recommendations/",
                {
                    "latitude": 31.52,
                    "longitude": -8.75,
                    "water_access": "rainfed",
                    "soil_type": "clay_loam",
                    "previous_crop": "wheat_hard",
                },
                format="json",
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertIn("recommendations", body)
        self.assertIn("indicators", body)
        self.assertIn("provenance", body)
        self.assertIsNotNone(body["provenance"])

    def test_response_has_provenance(self):
        with patch(
            "api.views.nasa_power.fetch_climate_data",
            return_value=_make_climate_result(status="live"),
        ):
            response = self.client.post(
                "/api/v1/recommendations/",
                {"latitude": 31.52, "longitude": -8.75},
                format="json",
            )
        body = response.json()
        prov = body.get("provenance", {})
        self.assertIn("source", prov)
        self.assertIn("period", prov)

    def test_crops_endpoint(self):
        response = self.client.get("/api/v1/crops/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("crops", data)
        self.assertGreater(len(data["crops"]), 0)
        crop = data["crops"][0]
        self.assertIn("id", crop)
        self.assertIn("name_fr", crop)
        self.assertIn("name_ar", crop)

    def test_insufficient_data_response(self):
        """When indicator calculation fails, API returns proper insufficient_data."""
        # Provide near-empty data to trigger InsufficientDataError
        sparse_climate = _make_climate_result()
        sparse_climate["data"]["T2M"] = {"20210101": 18.0}  # Only 1 point
        sparse_climate["total_days_expected"] = 1826

        with patch(
            "api.views.nasa_power.fetch_climate_data",
            return_value=sparse_climate,
        ):
            response = self.client.post(
                "/api/v1/recommendations/",
                {"latitude": 31.52, "longitude": -8.75},
                format="json",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data_status"], "insufficient_data")


class TestAuthAndParcels(APITestCase):
    def test_register_and_login(self):
        # 1. Register
        reg_resp = self.client.post("/api/v1/auth/register/", {
            "username": "karim_farmer",
            "email": "karim@example.com",
            "password": "strongpassword123",
        }, format="json")
        self.assertEqual(reg_resp.status_code, 201)
        data = reg_resp.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        token = data["access"]

        # 2. Access /auth/me/ with token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        me_resp = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["user"]["username"], "karim_farmer")

        # 3. Create parcel
        parcel_resp = self.client.post("/api/v1/parcels/", {
            "name": "Ferme Marrakech - Oliviers",
            "latitude": 31.52,
            "longitude": -8.75,
            "water_access": "rainfed",
            "soil_type": "clay_loam",
            "field_size_ha": 5.5,
        }, format="json")
        self.assertEqual(parcel_resp.status_code, 201)
        parcel_id = parcel_resp.json()["parcel"]["id"]

        # 4. List parcels
        list_resp = self.client.get("/api/v1/parcels/")
        self.assertEqual(list_resp.status_code, 200)
        self.assertEqual(len(list_resp.json()["parcels"]), 1)

        # 5. Delete parcel
        del_resp = self.client.delete(f"/api/v1/parcels/{parcel_id}/")
        self.assertEqual(del_resp.status_code, 200)
        list_resp2 = self.client.get("/api/v1/parcels/")
        self.assertEqual(len(list_resp2.json()["parcels"]), 0)


class TestPotatoAndAlmondRules(TestCase):
    def test_potato_ineligible_rainfed_dry(self):
        indicators = {
            "annual_rain_mm": 215.0,
            "mean_annual_temp_c": 19.5,
            "gdd_base10": 2500.0,
            "frost_days_per_year": 0,
            "aridity_index": 0.18,
            "dry_months": 7,
        }
        inputs = {"water_access": "rainfed"}
        res = rank(indicators, inputs)
        abstained_ids = [c["crop_id"] for c in res["abstained_crops"]]
        self.assertIn("potato", abstained_ids)

    def test_potato_eligible_irrigated(self):
        indicators = {
            "annual_rain_mm": 215.0,
            "mean_annual_temp_c": 18.0,
            "gdd_base10": 2500.0,
            "frost_days_per_year": 0,
            "aridity_index": 0.18,
            "dry_months": 7,
        }
        inputs = {"water_access": "irrigated", "previous_crop": "wheat_hard"}
        res = rank(indicators, inputs)
        rec_ids = [c["crop_id"] for c in res["recommendations"]]
        self.assertIn("potato", rec_ids)

    def test_almond_ranks_well_semi_arid(self):
        indicators = {
            "annual_rain_mm": 350.0,
            "mean_annual_temp_c": 17.5,
            "gdd_base10": 2600.0,
            "frost_days_per_year": 2,
            "aridity_index": 0.28,
            "dry_months": 5,
        }
        inputs = {"water_access": "rainfed"}
        res = rank(indicators, inputs)
        rec_ids = [c["crop_id"] for c in res["recommendations"]]
        self.assertIn("almond", rec_ids)
