import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.database import Base, SessionLocal, engine
from app.main import app
from app.seed import seed_database


class PortAuthorityAPITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
        cls.client = TestClient(app)

    def test_health_and_dashboard(self):
        r = self.client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "ok")

        dash = self.client.get("/api/ports/mangalore/dashboard")
        self.assertEqual(dash.status_code, 200)
        data = dash.json()
        self.assertEqual(data["port"]["name"], "Mangalore Port")
        self.assertEqual(data["kpis"]["total_berths"], 6)
        self.assertGreaterEqual(data["kpis"]["incoming_vessels"], 1)
        self.assertIn(data["congestion"]["level"], ("Low", "Moderate", "High", "Critical"))

    def test_access_restriction_private_financials_forbidden(self):
        r = self.client.get("/api/ports/mangalore/vessels/v-ocean-star/private-financials")
        self.assertEqual(r.status_code, 403)

        vessels = self.client.get("/api/ports/mangalore/vessels").json()
        self.assertTrue(len(vessels) > 0)
        self.assertNotIn("private_charter_rate_usd", vessels[0])

    def test_berth_overlap_prevention_and_assign_release(self):
        # Attempting to assign a vessel to already-occupied Berth B1 must return 409 Conflict
        conflict = self.client.post(
            "/api/ports/mangalore/berths/mng-b1/assign",
            json={"vessel_id": "v-ocean-star", "operation": "Unloading", "duration_hours": 6},
        )
        self.assertEqual(conflict.status_code, 409)

        # Assigning to Available Berth B4 should succeed, then releasing should make it Available again
        ok = self.client.post(
            "/api/ports/mangalore/berths/mng-b4/assign",
            json={"vessel_id": "v-sagar-crest", "operation": "Unloading", "duration_hours": 4},
        )
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json()["status"], "Occupied")

        rel = self.client.post("/api/ports/mangalore/berths/mng-b4/release")
        self.assertEqual(rel.status_code, 200)
        self.assertEqual(rel.json()["status"], "Available")

    def test_vessel_simulation_and_forecast_and_export(self):
        sim = self.client.post("/api/ports/mangalore/vessels/simulate-tick")
        self.assertEqual(sim.status_code, 200)
        self.assertIn("updated_vessels", sim.json())

        fc = self.client.get("/api/ports/mangalore/forecast")
        self.assertEqual(fc.status_code, 200)
        self.assertIn("supply_demand", fc.json())
        self.assertTrue(len(fc.json()["timeline"]) >= 8)

        csv_resp = self.client.get("/api/ports/mangalore/reports/export?period=weekly&format=csv")
        self.assertEqual(csv_resp.status_code, 200)
        self.assertIn("text/csv", csv_resp.headers["content-type"])
        self.assertIn("Mangalore Port", csv_resp.text)

    def test_inventory_overflow_triggers_alert(self):
        inv = self.client.get("/api/ports/mangalore/inventory").json()
        self.assertIn("warehouses", inv)
        adj = self.client.post(
            "/api/ports/mangalore/inventory/adjust",
            json={"warehouse_id": "mng-wh2", "delta_mt": 4000, "reason": "Bulk stockpile surge"},
        )
        self.assertEqual(adj.status_code, 200)
        self.assertTrue(len(adj.json()["alerts"]) >= 1)


if __name__ == "__main__":
    unittest.main()
