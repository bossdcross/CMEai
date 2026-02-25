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


# ============ CME TYPES TESTS ============

class TestCMETypes:
    def test_get_all_cme_types_no_auth(self, unauth_client):
        """GET /api/cme-types/all - public endpoint, no auth needed"""
        r = unauth_client.get(f"{BASE_URL}/api/cme-types/all")
        assert r.status_code == 200
        data = r.json()
        assert "physician" in data
        assert "np_pa" in data
        assert "nurse" in data

    def test_cme_types_physician_has_ama_cat1(self, unauth_client):
        """Physician CME types include AMA Category 1"""
        r = unauth_client.get(f"{BASE_URL}/api/cme-types/all")
        assert r.status_code == 200
        data = r.json()
        physician_types = data["physician"]
        ids = [t["id"] for t in physician_types]
        assert "ama_cat1" in ids

    def test_get_cme_types_authenticated(self, api_client):
        """GET /api/cme-types - returns types for user's profession"""
        r = api_client.get(f"{BASE_URL}/api/cme-types")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_cme_types_unauthorized(self, unauth_client):
        """GET /api/cme-types without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/cme-types")
        assert r.status_code == 401


# ============ AUTH TESTS ============

class TestAuth:
    def test_get_me_with_valid_token(self, api_client):
        """GET /api/auth/me returns user data"""
        r = api_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data

    def test_get_me_without_token(self, unauth_client):
        """GET /api/auth/me without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_get_me_no_id_field(self, api_client):
        """Response must not contain MongoDB _id field"""
        r = api_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert "_id" not in data


# ============ CERTIFICATES CRUD TESTS ============

class TestCertificates:
    created_cert_id = None

    def test_list_certificates(self, api_client):
        """GET /api/certificates returns list"""
        r = api_client.get(f"{BASE_URL}/api/certificates")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_certificate(self, api_client):
        """POST /api/certificates creates a certificate"""
        ts = int(time.time())
        payload = {
            "title": f"TEST_CME_Activity_{ts}",
            "provider": "TEST_Provider",
            "credits": 1.5,
            "credit_type": "ama_cat1",
            "completion_date": "2025-01-15",
            "subject": "Cardiology"
        }
        r = api_client.post(f"{BASE_URL}/api/certificates", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == payload["title"]
        assert data["credits"] == 1.5
        assert data["credit_type"] == "ama_cat1"
        assert "certificate_id" in data
        assert "_id" not in data
        TestCertificates.created_cert_id = data["certificate_id"]

    def test_get_certificate_by_id(self, api_client):
        """GET /api/certificates/{id} returns specific certificate"""
        if not TestCertificates.created_cert_id:
            pytest.skip("No certificate created")
        r = api_client.get(f"{BASE_URL}/api/certificates/{TestCertificates.created_cert_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["certificate_id"] == TestCertificates.created_cert_id

    def test_update_certificate(self, api_client):
        """PUT /api/certificates/{id} updates a certificate"""
        if not TestCertificates.created_cert_id:
            pytest.skip("No certificate created")
        r = api_client.put(
            f"{BASE_URL}/api/certificates/{TestCertificates.created_cert_id}",
            json={"credits": 2.0}
        )
        assert r.status_code == 200
        data = r.json()
        assert data["credits"] == 2.0

    def test_get_certificate_after_update(self, api_client):
        """Verify update persisted via GET"""
        if not TestCertificates.created_cert_id:
            pytest.skip("No certificate created")
        r = api_client.get(f"{BASE_URL}/api/certificates/{TestCertificates.created_cert_id}")
        assert r.status_code == 200
        assert r.json()["credits"] == 2.0

    def test_filter_certificates_by_credit_type(self, api_client):
        """GET /api/certificates?credit_type=ama_cat1 filters correctly"""
        r = api_client.get(f"{BASE_URL}/api/certificates?credit_type=ama_cat1")
        assert r.status_code == 200
        data = r.json()
        for cert in data:
            assert cert["credit_type"] == "ama_cat1"

    def test_delete_certificate(self, api_client):
        """DELETE /api/certificates/{id} deletes certificate"""
        if not TestCertificates.created_cert_id:
            pytest.skip("No certificate created")
        r = api_client.delete(f"{BASE_URL}/api/certificates/{TestCertificates.created_cert_id}")
        assert r.status_code == 200

    def test_get_deleted_certificate_returns_404(self, api_client):
        """Verify deleted certificate returns 404"""
        if not TestCertificates.created_cert_id:
            pytest.skip("No certificate created")
        r = api_client.get(f"{BASE_URL}/api/certificates/{TestCertificates.created_cert_id}")
        assert r.status_code == 404

    def test_certificates_unauthorized(self, unauth_client):
        """GET /api/certificates without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/certificates")
        assert r.status_code == 401


# ============ REQUIREMENTS CRUD TESTS ============

class TestRequirements:
    created_req_id = None

    def test_list_requirements(self, api_client):
        """GET /api/requirements returns list"""
        r = api_client.get(f"{BASE_URL}/api/requirements")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_requirement(self, api_client):
        """POST /api/requirements creates a requirement"""
        ts = int(time.time())
        payload = {
            "name": f"TEST_License_Renewal_{ts}",
            "requirement_type": "license_renewal",
            "credit_type": "ama_cat1",
            "credits_required": 50.0,
            "due_date": "2025-12-31",
            "notes": "Annual renewal"
        }
        r = api_client.post(f"{BASE_URL}/api/requirements", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["credits_required"] == 50.0
        assert "requirement_id" in data
        assert "_id" not in data
        TestRequirements.created_req_id = data["requirement_id"]

    def test_get_requirement_by_id(self, api_client):
        """GET /api/requirements/{id} returns specific requirement"""
        if not TestRequirements.created_req_id:
            pytest.skip("No requirement created")
        r = api_client.get(f"{BASE_URL}/api/requirements/{TestRequirements.created_req_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["requirement_id"] == TestRequirements.created_req_id

    def test_update_requirement(self, api_client):
        """PUT /api/requirements/{id} updates a requirement"""
        if not TestRequirements.created_req_id:
            pytest.skip("No requirement created")
        r = api_client.put(
            f"{BASE_URL}/api/requirements/{TestRequirements.created_req_id}",
            json={"credits_required": 60.0}
        )
        assert r.status_code == 200
        data = r.json()
        assert data["credits_required"] == 60.0

    def test_delete_requirement(self, api_client):
        """DELETE /api/requirements/{id} deletes requirement"""
        if not TestRequirements.created_req_id:
            pytest.skip("No requirement created")
        r = api_client.delete(f"{BASE_URL}/api/requirements/{TestRequirements.created_req_id}")
        assert r.status_code == 200

    def test_requirements_unauthorized(self, unauth_client):
        """GET /api/requirements without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/requirements")
        assert r.status_code == 401


# ============ DASHBOARD TESTS ============

class TestDashboard:
    def test_get_dashboard(self, api_client):
        """GET /api/dashboard returns dashboard data"""
        r = api_client.get(f"{BASE_URL}/api/dashboard")
        assert r.status_code == 200
        data = r.json()
        assert "user" in data
        assert "recent_certificates" in data
        assert "requirements" in data
        assert "credits_by_type" in data
        assert "total_credits_this_year" in data
        assert "year" in data

    def test_dashboard_user_data(self, api_client):
        """Dashboard returns correct user info"""
        r = api_client.get(f"{BASE_URL}/api/dashboard")
        assert r.status_code == 200
        user = r.json()["user"]
        assert "user_id" in user
        assert "_id" not in user

    def test_dashboard_unauthorized(self, unauth_client):
        """GET /api/dashboard without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/dashboard")
        assert r.status_code == 401


# ============ REPORTS TESTS ============

class TestReports:
    def test_get_report_summary(self, api_client):
        """GET /api/reports/summary returns summary data"""
        r = api_client.get(f"{BASE_URL}/api/reports/summary")
        assert r.status_code == 200
        data = r.json()
        assert "year" in data
        assert "total_certificates" in data
        assert "total_credits" in data
        assert "by_credit_type" in data
        assert "requirements" in data
        assert "certificates" in data

    def test_report_summary_with_year(self, api_client):
        """GET /api/reports/summary?year=2025 returns year-filtered data"""
        r = api_client.get(f"{BASE_URL}/api/reports/summary?year=2025")
        assert r.status_code == 200
        assert r.json()["year"] == 2025

    def test_reports_unauthorized(self, unauth_client):
        """GET /api/reports/summary without auth returns 401"""
        r = unauth_client.get(f"{BASE_URL}/api/reports/summary")
        assert r.status_code == 401


# ============ EEDS IMPORT TESTS ============

class TestEEDSImport:
    created_cert_id = None

    def test_eeds_import(self, api_client):
        """POST /api/certificates/eeds-import imports EEDS data"""
        ts = int(time.time())
        payload = {
            "qr_data": "eeds_test_data",
            "title": f"TEST_EEDS_Certificate_{ts}",
            "provider": "TEST_EEDS_Provider",
            "credits": 2.0,
            "credit_type": "ama_cat1",
            "completion_date": "2025-06-15",
            "certificate_number": f"EEDS-{ts}"
        }
        r = api_client.post(f"{BASE_URL}/api/certificates/eeds-import", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["eeds_imported"] is True
        assert data["title"] == payload["title"]
        assert "certificate_id" in data
        assert "_id" not in data
        TestEEDSImport.created_cert_id = data["certificate_id"]

    def test_eeds_import_creates_persisted_cert(self, api_client):
        """Verify EEDS import certificate persists in DB"""
        if not TestEEDSImport.created_cert_id:
            pytest.skip("No EEDS cert created")
        r = api_client.get(f"{BASE_URL}/api/certificates/{TestEEDSImport.created_cert_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["eeds_imported"] is True

    def test_eeds_import_cleanup(self, api_client):
        """Cleanup EEDS test certificate"""
        if not TestEEDSImport.created_cert_id:
            pytest.skip("No EEDS cert created")
        r = api_client.delete(f"{BASE_URL}/api/certificates/{TestEEDSImport.created_cert_id}")
        assert r.status_code == 200

    def test_eeds_import_unauthorized(self, unauth_client):
        """POST /api/certificates/eeds-import without auth returns 401"""
        r = unauth_client.post(f"{BASE_URL}/api/certificates/eeds-import", json={})
        assert r.status_code == 401
