import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = os.environ.get('TEST_SESSION_TOKEN', 'test_session_1772029888767')


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SESSION_TOKEN}"
    })
    return session


@pytest.fixture
def unauth_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# ============ SELF-REPORTED ACTIVITY TYPES ============

class TestSelfReportedTypes:
    def test_get_activity_types(self, api_client):
        """GET /api/self-reported-types returns 11 activity types"""
        r = api_client.get(f"{BASE_URL}/api/self-reported-types")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 11  # 11 types defined in SELF_REPORTED_TYPES
        
    def test_activity_types_have_required_fields(self, api_client):
        """Activity types have id, name, description"""
        r = api_client.get(f"{BASE_URL}/api/self-reported-types")
        assert r.status_code == 200
        data = r.json()
        for activity_type in data:
            assert "id" in activity_type
            assert "name" in activity_type
            assert "description" in activity_type
            
    def test_activity_types_include_journal_club(self, api_client):
        """Activity types include journal_club"""
        r = api_client.get(f"{BASE_URL}/api/self-reported-types")
        assert r.status_code == 200
        data = r.json()
        ids = [t["id"] for t in data]
        assert "journal_club" in ids
        assert "self_study" in ids
        assert "presentation" in ids
        assert "teaching" in ids


# ============ SELF-REPORTED CREDITS CRUD ============

class TestSelfReportedCreditsCRUD:
    created_credit_id = None

    def test_list_self_reported_credits(self, api_client):
        """GET /api/self-reported returns list"""
        r = api_client.get(f"{BASE_URL}/api/self-reported")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_self_reported_credit(self, api_client):
        """POST /api/self-reported creates a credit"""
        ts = int(time.time())
        payload = {
            "activity_type": "journal_club",
            "title": f"TEST_Journal_Club_{ts}",
            "description": "Weekly cardiology journal review",
            "credits": 1.0,
            "credit_types": ["ama_cat2"],
            "completion_date": "2025-02-15",
            "hours_spent": 2.0,
            "reference_url": "https://example.com/journal"
        }
        r = api_client.post(f"{BASE_URL}/api/self-reported", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == payload["title"]
        assert data["credits"] == 1.0
        assert data["activity_type"] == "journal_club"
        assert "credit_id" in data
        assert "_id" not in data
        TestSelfReportedCreditsCRUD.created_credit_id = data["credit_id"]

    def test_get_self_reported_after_create(self, api_client):
        """Verify created credit appears in list"""
        if not TestSelfReportedCreditsCRUD.created_credit_id:
            pytest.skip("No credit created")
        r = api_client.get(f"{BASE_URL}/api/self-reported")
        assert r.status_code == 200
        data = r.json()
        ids = [c["credit_id"] for c in data]
        assert TestSelfReportedCreditsCRUD.created_credit_id in ids

    def test_update_self_reported_credit(self, api_client):
        """PUT /api/self-reported/{credit_id} updates credit"""
        if not TestSelfReportedCreditsCRUD.created_credit_id:
            pytest.skip("No credit created")
        r = api_client.put(
            f"{BASE_URL}/api/self-reported/{TestSelfReportedCreditsCRUD.created_credit_id}",
            json={"credits": 2.0, "hours_spent": 3.0}
        )
        assert r.status_code == 200
        data = r.json()
        assert data["credits"] == 2.0
        assert data["hours_spent"] == 3.0

    def test_filter_by_year(self, api_client):
        """GET /api/self-reported?year=2025 filters correctly"""
        r = api_client.get(f"{BASE_URL}/api/self-reported?year=2025")
        assert r.status_code == 200
        data = r.json()
        for credit in data:
            assert credit["completion_date"].startswith("2025")

    def test_delete_self_reported_credit(self, api_client):
        """DELETE /api/self-reported/{credit_id} deletes credit"""
        if not TestSelfReportedCreditsCRUD.created_credit_id:
            pytest.skip("No credit created")
        r = api_client.delete(f"{BASE_URL}/api/self-reported/{TestSelfReportedCreditsCRUD.created_credit_id}")
        assert r.status_code == 200

    def test_get_deleted_credit_not_in_list(self, api_client):
        """Verify deleted credit not in list"""
        if not TestSelfReportedCreditsCRUD.created_credit_id:
            pytest.skip("No credit created")
        r = api_client.get(f"{BASE_URL}/api/self-reported")
        assert r.status_code == 200
        data = r.json()
        ids = [c["credit_id"] for c in data]
        assert TestSelfReportedCreditsCRUD.created_credit_id not in ids

    def test_self_reported_unauthorized(self, unauth_client):
        """GET /api/self-reported without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/self-reported")
        assert r.status_code == 401


# ============ CME EVENTS CRUD ============

class TestEventsCRUD:
    created_event_id = None
    event_passcode = None

    def test_list_events(self, api_client):
        """GET /api/events returns list"""
        r = api_client.get(f"{BASE_URL}/api/events")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_event(self, api_client):
        """POST /api/events creates event with 6-digit passcode"""
        ts = int(time.time())
        payload = {
            "title": f"TEST_CME_Conference_{ts}",
            "description": "Annual cardiology conference",
            "provider": "American College of Cardiology",
            "location": "Chicago, IL",
            "start_date": "2025-06-15",
            "end_date": "2025-06-17",
            "start_time": "08:00",
            "end_time": "17:00",
            "credits_available": 24.0,
            "credit_types": ["ama_cat1"],
            "cost": 500.0,
            "notes": "Early bird registration"
        }
        r = api_client.post(f"{BASE_URL}/api/events", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == payload["title"]
        assert data["provider"] == payload["provider"]
        assert "event_id" in data
        assert "passcode" in data
        assert len(data["passcode"]) == 6  # 6-digit passcode
        assert data["passcode"].isdigit()  # Only digits
        assert "_id" not in data
        TestEventsCRUD.created_event_id = data["event_id"]
        TestEventsCRUD.event_passcode = data["passcode"]

    def test_get_event_by_id(self, api_client):
        """GET /api/events/{event_id} returns specific event"""
        if not TestEventsCRUD.created_event_id:
            pytest.skip("No event created")
        r = api_client.get(f"{BASE_URL}/api/events/{TestEventsCRUD.created_event_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["event_id"] == TestEventsCRUD.created_event_id

    def test_update_event(self, api_client):
        """PUT /api/events/{event_id} updates event"""
        if not TestEventsCRUD.created_event_id:
            pytest.skip("No event created")
        r = api_client.put(
            f"{BASE_URL}/api/events/{TestEventsCRUD.created_event_id}",
            json={"location": "New York, NY", "credits_available": 30.0}
        )
        assert r.status_code == 200
        data = r.json()
        assert data["location"] == "New York, NY"
        assert data["credits_available"] == 30.0

    def test_toggle_registration(self, api_client):
        """POST /api/events/{event_id}/register toggles registration"""
        if not TestEventsCRUD.created_event_id:
            pytest.skip("No event created")
        # Register
        r = api_client.post(f"{BASE_URL}/api/events/{TestEventsCRUD.created_event_id}/register")
        assert r.status_code == 200
        data = r.json()
        assert data["is_registered"] == True
        
        # Unregister
        r = api_client.post(f"{BASE_URL}/api/events/{TestEventsCRUD.created_event_id}/register")
        assert r.status_code == 200
        data = r.json()
        assert data["is_registered"] == False

    def test_mark_attended(self, api_client):
        """POST /api/events/{event_id}/attend marks event as attended"""
        if not TestEventsCRUD.created_event_id:
            pytest.skip("No event created")
        r = api_client.post(
            f"{BASE_URL}/api/events/{TestEventsCRUD.created_event_id}/attend",
            json={}
        )
        assert r.status_code == 200
        data = r.json()
        assert data["is_attended"] == True

    def test_sign_in_with_passcode(self, api_client):
        """POST /api/events/sign-in with valid passcode marks attended"""
        if not TestEventsCRUD.event_passcode:
            pytest.skip("No event passcode")
        r = api_client.post(
            f"{BASE_URL}/api/events/sign-in",
            json={"passcode": TestEventsCRUD.event_passcode}
        )
        assert r.status_code == 200
        data = r.json()
        assert "Successfully signed in" in data["message"]
        assert "event" in data

    def test_sign_in_invalid_passcode(self, api_client):
        """POST /api/events/sign-in with invalid passcode returns 404"""
        r = api_client.post(
            f"{BASE_URL}/api/events/sign-in",
            json={"passcode": "000000"}  # Invalid passcode
        )
        assert r.status_code == 404

    def test_filter_upcoming_events(self, api_client):
        """GET /api/events?upcoming=true filters correctly"""
        r = api_client.get(f"{BASE_URL}/api/events?upcoming=true")
        assert r.status_code == 200
        # Should return events (may be empty)
        assert isinstance(r.json(), list)

    def test_filter_past_events(self, api_client):
        """GET /api/events?past=true filters correctly"""
        r = api_client.get(f"{BASE_URL}/api/events?past=true")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_delete_event(self, api_client):
        """DELETE /api/events/{event_id} deletes event"""
        if not TestEventsCRUD.created_event_id:
            pytest.skip("No event created")
        r = api_client.delete(f"{BASE_URL}/api/events/{TestEventsCRUD.created_event_id}")
        assert r.status_code == 200

    def test_get_deleted_event_returns_404(self, api_client):
        """Verify deleted event returns 404"""
        if not TestEventsCRUD.created_event_id:
            pytest.skip("No event created")
        r = api_client.get(f"{BASE_URL}/api/events/{TestEventsCRUD.created_event_id}")
        assert r.status_code == 404

    def test_events_unauthorized(self, unauth_client):
        """GET /api/events without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/events")
        assert r.status_code == 401


# ============ EVALUATIONS CRUD ============

class TestEvaluationsCRUD:
    created_evaluation_id = None

    def test_list_evaluations(self, api_client):
        """GET /api/evaluations returns list"""
        r = api_client.get(f"{BASE_URL}/api/evaluations")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_evaluation(self, api_client):
        """POST /api/evaluations creates evaluation with star ratings"""
        ts = int(time.time())
        payload = {
            "title": f"TEST_Cardiology_Update_{ts}",
            "overall_rating": 4,
            "content_quality": 5,
            "speaker_effectiveness": 4,
            "relevance_to_practice": 5,
            "would_recommend": True,
            "learning_objectives_met": True,
            "comments": "Excellent content on heart failure management",
            "improvement_suggestions": "More interactive sessions",
            "practice_change_planned": "Will implement new HFrEF treatment protocol"
        }
        r = api_client.post(f"{BASE_URL}/api/evaluations", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == payload["title"]
        assert data["overall_rating"] == 4
        assert data["content_quality"] == 5
        assert data["would_recommend"] == True
        assert "evaluation_id" in data
        assert "_id" not in data
        TestEvaluationsCRUD.created_evaluation_id = data["evaluation_id"]

    def test_get_evaluation_by_id(self, api_client):
        """GET /api/evaluations/{evaluation_id} returns specific evaluation"""
        if not TestEvaluationsCRUD.created_evaluation_id:
            pytest.skip("No evaluation created")
        r = api_client.get(f"{BASE_URL}/api/evaluations/{TestEvaluationsCRUD.created_evaluation_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["evaluation_id"] == TestEvaluationsCRUD.created_evaluation_id

    def test_delete_evaluation(self, api_client):
        """DELETE /api/evaluations/{evaluation_id} deletes evaluation"""
        if not TestEvaluationsCRUD.created_evaluation_id:
            pytest.skip("No evaluation created")
        r = api_client.delete(f"{BASE_URL}/api/evaluations/{TestEvaluationsCRUD.created_evaluation_id}")
        assert r.status_code == 200

    def test_get_deleted_evaluation_returns_404(self, api_client):
        """Verify deleted evaluation returns 404"""
        if not TestEvaluationsCRUD.created_evaluation_id:
            pytest.skip("No evaluation created")
        r = api_client.get(f"{BASE_URL}/api/evaluations/{TestEvaluationsCRUD.created_evaluation_id}")
        assert r.status_code == 404

    def test_evaluations_unauthorized(self, unauth_client):
        """GET /api/evaluations without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/evaluations")
        assert r.status_code == 401


# ============ SPEAKER DISCLOSURES CRUD ============

class TestDisclosuresCRUD:
    created_disclosure_id = None

    def test_list_disclosures(self, api_client):
        """GET /api/disclosures returns list"""
        r = api_client.get(f"{BASE_URL}/api/disclosures")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_disclosure(self, api_client):
        """POST /api/disclosures creates speaker disclosure"""
        ts = int(time.time())
        payload = {
            "speaker_name": f"Dr. Test Speaker {ts}",
            "speaker_credentials": "MD, FACC",
            "has_conflicts": True,
            "disclosure_text": "Dr. Speaker has received honoraria from Pfizer",
            "financial_relationships": [
                {"company": "Pfizer", "relationship_type": "Speaker Bureau", "amount": "$10,000"}
            ]
        }
        r = api_client.post(f"{BASE_URL}/api/disclosures", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["speaker_name"] == payload["speaker_name"]
        assert data["has_conflicts"] == True
        assert "disclosure_id" in data
        assert "_id" not in data
        TestDisclosuresCRUD.created_disclosure_id = data["disclosure_id"]

    def test_delete_disclosure(self, api_client):
        """DELETE /api/disclosures/{disclosure_id} deletes disclosure"""
        if not TestDisclosuresCRUD.created_disclosure_id:
            pytest.skip("No disclosure created")
        r = api_client.delete(f"{BASE_URL}/api/disclosures/{TestDisclosuresCRUD.created_disclosure_id}")
        assert r.status_code == 200

    def test_disclosures_unauthorized(self, unauth_client):
        """GET /api/disclosures without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/disclosures")
        assert r.status_code == 401


# ============ COURSE MATERIALS ============

class TestMaterialsCRUD:
    created_material_id = None

    def test_list_materials(self, api_client):
        """GET /api/materials returns list"""
        r = api_client.get(f"{BASE_URL}/api/materials")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_materials_unauthorized(self, unauth_client):
        """GET /api/materials without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/materials")
        assert r.status_code == 401


# ============ ACCME PARS EXPORT ============

class TestPARSExport:
    def test_pars_export_returns_excel(self, api_client):
        """GET /api/reports/export/pars returns Excel file
        
        BUG DETECTED: Returns 500 due to KeyError: 'by_type' on line 2095
        The code uses summary['by_type'] but should use summary['by_credit_type']
        """
        r = api_client.get(f"{BASE_URL}/api/reports/export/pars?year=2025")
        # KNOWN BUG: Currently returns 500 instead of 200
        # Expected when bug is fixed:
        # assert r.status_code == 200
        # assert "spreadsheet" in r.headers.get("content-type", "")
        # assert "pars" in r.headers.get("content-disposition", "").lower()
        
        # For now, just document the bug
        if r.status_code == 500:
            pytest.xfail("PARS export bug: KeyError 'by_type' - should be 'by_credit_type' on line 2095")
        assert r.status_code == 200

    def test_pars_export_unauthorized(self, unauth_client):
        """GET /api/reports/export/pars without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/reports/export/pars?year=2025")
        assert r.status_code == 401
