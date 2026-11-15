import json
from django.test import TestCase
from django.contrib.auth.models import User
from fields.models import Parcel, FarmPlan, RotationHistory
from advisor.models import AdvisorSession, AdvisorMessage
from advisor.context import build_context
from advisor.chat import answer, compare_crops


class AdvisorBackendTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="test_fellah",
            password="testpassword123",
            first_name="Brahim"
        )
        self.parcel = Parcel.objects.create(
            user=self.user,
            name="Parcelle Chaouia Sud",
            latitude=33.1,
            longitude=-7.5,
            region="Chaouia",
            water_access="rainfed",
            soil_type="clay_loam",
            soil_ph=7.5,
            field_size_ha=10.0
        )
        self.history = RotationHistory.objects.create(
            parcel=self.parcel,
            crop_id="wheat_hard",
            season="2024-2025",
            year=2024
        )

    def test_demo_context_retrieval(self):
        ctx = build_context(None, fetch_climate=False)
        self.assertTrue(ctx["is_demo"])
        self.assertIsNotNone(ctx["active_parcel"])
        self.assertEqual(ctx["farmer"]["username"], "demo_farmer")

    def test_authenticated_farmer_context(self):
        ctx = build_context(self.user, fetch_climate=False)
        self.assertFalse(ctx["is_demo"])
        self.assertEqual(ctx["farmer"]["username"], "test_fellah")
        self.assertEqual(ctx["active_parcel"]["name"], "Parcelle Chaouia Sud")
        self.assertEqual(ctx["previous_crop"], "wheat_hard")
        self.assertEqual(len(ctx["rotation_history"]), 1)

    def test_advisor_chat_darija_intent(self):
        ctx = build_context(self.user, fetch_climate=False)
        # What to plant in Darija
        res = answer("شنو نزرع هاد العام؟", ctx, lang="ar")
        self.assertEqual(res["intent"], "QUOI_PLANTER")
        self.assertTrue(len(res["answer_text"]) > 0)
        self.assertIn("followup_suggestions", res)

    def test_advisor_chat_why_intent(self):
        ctx = build_context(self.user, fetch_climate=False)
        res = answer("علاش هاد النصيحة؟", ctx, lang="ar")
        self.assertEqual(res["intent"], "POURQUOI")

    def test_advisor_chat_french_rain(self):
        ctx = build_context(self.user, fetch_climate=False)
        res = answer("Est-ce qu'il va beaucoup pleuvoir ?", ctx, lang="fr")
        self.assertEqual(res["intent"], "PLUIE_METEO")

    def test_advisor_chat_english_soil(self):
        ctx = build_context(self.user, fetch_climate=False)
        res = answer("Is my soil good for farming?", ctx, lang="en")
        self.assertEqual(res["intent"], "SOL")

    def test_api_chat_endpoint(self):
        response = self.client.post(
            "/api/v1/advisor/chat/",
            data=json.dumps({
                "question": "شنو نزرع هاد الموسم؟",
                "lang": "ar"
            }),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("session_id", data)
        self.assertIn("result", data)

    def test_api_context_endpoint(self):
        response = self.client.get("/api/v1/advisor/context/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("context", data)

    def test_plan_proposal_and_approval_workflow(self):
        # 1. AI Proposes a change
        prop_resp = self.client.post(
            "/api/v1/advisor/plan-proposal/",
            data=json.dumps({
                "crop_id": "lentil",
                "reason": "Pour régénérer l'azote après une céréale",
                "lang": "fr"
            }),
            content_type="application/json"
        )
        self.assertEqual(prop_resp.status_code, 201)
        prop_data = prop_resp.json()
        self.assertEqual(prop_data["proposal_status"], "pending_farmer_approval")
        proposal_id = prop_data["proposal_id"]

        # Check DB status is proposed (NOT active)
        plan = FarmPlan.objects.get(id=proposal_id)
        self.assertEqual(plan.status, "proposed")

        # 2. Farmer approves
        appr_resp = self.client.post(
            f"/api/v1/advisor/plan-proposal/{proposal_id}/approve/",
            data=json.dumps({
                "action": "approve",
                "feedback": "D'accord pour les lentilles"
            }),
            content_type="application/json"
        )
        self.assertEqual(appr_resp.status_code, 200)
        plan.refresh_from_db()
        self.assertEqual(plan.status, "approved")
        self.assertEqual(plan.farmer_feedback, "D'accord pour les lentilles")
