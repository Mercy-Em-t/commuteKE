import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


class TransportApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        frontend_dir = Path(__file__).resolve().parents[1]
        if str(frontend_dir) not in sys.path:
            sys.path.insert(0, str(frontend_dir))

        from api.index import app

        cls.app = app
        cls.original_startup_handlers = list(app.router.on_startup)
        cls.original_shutdown_handlers = list(app.router.on_shutdown)
        app.router.on_startup.clear()
        app.router.on_shutdown.clear()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        cls.app.router.on_startup[:] = cls.original_startup_handlers
        cls.app.router.on_shutdown[:] = cls.original_shutdown_handlers

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "operational")

    def test_analytics_report_returns_requested_tenant(self):
        response = self.client.get("/api/v1/analytics/report?tenant_id=kiungani-01")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["tenant_id"], "kiungani-01")

    def test_dispatch_update_requires_signature_header(self):
        payload = {
            "tenant_id": "kiungani-01",
            "trip_id": "trip-1",
            "driver_phone": "0712345678",
            "status": "IN_TRANSIT",
        }
        response = self.client.post("/api/v1/dispatch/update", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_dispatch_update_with_signature_header(self):
        payload = {
            "tenant_id": "kiungani-01",
            "trip_id": "trip-1",
            "driver_phone": "0712345678",
            "status": "IN_TRANSIT",
        }
        response = self.client.post(
            "/api/v1/dispatch/update",
            headers={"x-signature": "test-signature"},
            json=payload,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")

    def test_list_saccos_uses_mock_when_supabase_unset(self):
        with patch.dict(
            os.environ,
            {"VITE_SUPABASE_URL": "", "SUPABASE_SERVICE_ROLE_KEY": ""},
            clear=False,
        ):
            response = self.client.get("/api/v1/saccos")
        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(body.get("mock"))
        self.assertIn("saccos", body)

    def test_create_sacco_returns_mock_when_supabase_unset(self):
        payload = {
            "name": "Kiungani Shuttle",
            "registration_number": "NTSA/SACCO/TEST/001",
            "chairman_name": "Test Chair",
            "contact_email": "chair@test.com",
            "contact_phone": "0712345678",
            "base_region": "Kiungani",
            "primary_route": "Kiungani-CBD",
            "fleet_count": 3,
            "notes": "Test sacco",
        }
        with patch.dict(
            os.environ,
            {"VITE_SUPABASE_URL": "", "SUPABASE_SERVICE_ROLE_KEY": ""},
            clear=False,
        ):
            response = self.client.post("/api/v1/saccos", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "mock")

    def test_update_sacco_status_rejects_invalid_status(self):
        response = self.client.patch(
            "/api/v1/saccos/status",
            json={"sacco_id": "mock-sacco-id-01", "status": "BROKEN_STATUS"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid status", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
