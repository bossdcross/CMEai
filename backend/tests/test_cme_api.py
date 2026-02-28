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



# ============ MULTIPLE CREDIT TYPES TESTS ============

class TestMultipleCreditTypes:
    created_cert_id = None

    def test_create_cert_with_multiple_credit_types(self, api_client):
        """POST /api/certificates with multiple credit_types"""
        ts = int(time.time())
        payload = {
            "title": f"TEST_MultiCredit_{ts}",
            "provider": "TEST_Provider",
            "credits": 3.0,
            "credit_types": ["ama_cat1", "moc", "ethics"],
            "completion_date": "2024-06-15"
        }
        r = api_client.post(f"{BASE_URL}/api/certificates", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["credit_types"] == ["ama_cat1", "moc", "ethics"]
        assert data["credit_type"] == "ama_cat1"  # Legacy field populated with first
        TestMultipleCreditTypes.created_cert_id = data["certificate_id"]

    def test_get_cert_multiple_credit_types(self, api_client):
        """Verify multiple credit types persist"""
        if not TestMultipleCreditTypes.created_cert_id:
            pytest.skip("No cert created")
        r = api_client.get(f"{BASE_URL}/api/certificates/{TestMultipleCreditTypes.created_cert_id}")
        assert r.status_code == 200
        data = r.json()
        assert "ama_cat1" in data["credit_types"]
        assert "moc" in data["credit_types"]

    def test_cleanup_multi_credit_cert(self, api_client):
        """Cleanup test certificate"""
        if TestMultipleCreditTypes.created_cert_id:
            api_client.delete(f"{BASE_URL}/api/certificates/{TestMultipleCreditTypes.created_cert_id}")
            TestMultipleCreditTypes.created_cert_id = None


# ============ CUSTOM CREDIT TYPES TESTS ============

class TestCustomCreditTypes:
    custom_type_id = None

    def test_create_custom_credit_type(self, api_client):
        """POST /api/cme-types/custom creates custom type"""
        ts = int(time.time())
        payload = {
            "name": f"TEST_Custom_CME_{ts}",
            "description": "Testing custom credit types"
        }
        r = api_client.post(f"{BASE_URL}/api/cme-types/custom", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == payload["name"]
        assert "credit_type_id" in data
        TestCustomCreditTypes.custom_type_id = data["credit_type_id"]

    def test_get_custom_credit_types(self, api_client):
        """GET /api/cme-types/custom returns user's custom types"""
        r = api_client.get(f"{BASE_URL}/api/cme-types/custom")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_custom_types_appear_in_all_types(self, api_client):
        """Custom types should appear in GET /api/cme-types"""
        if not TestCustomCreditTypes.custom_type_id:
            pytest.skip("No custom type created")
        r = api_client.get(f"{BASE_URL}/api/cme-types")
        assert r.status_code == 200
        data = r.json()
        ids = [t.get("id") for t in data]
        assert TestCustomCreditTypes.custom_type_id in ids

    def test_delete_custom_credit_type(self, api_client):
        """DELETE /api/cme-types/custom/{id} removes custom type"""
        if not TestCustomCreditTypes.custom_type_id:
            pytest.skip("No custom type created")
        r = api_client.delete(f"{BASE_URL}/api/cme-types/custom/{TestCustomCreditTypes.custom_type_id}")
        assert r.status_code == 200
        TestCustomCreditTypes.custom_type_id = None

    def test_custom_credit_type_unauthorized(self, unauth_client):
        """POST /api/cme-types/custom without auth returns 401"""
        r = unauth_client.post(f"{BASE_URL}/api/cme-types/custom", json={"name": "test"})
        assert r.status_code == 401


# ============ YEAR RANGE REQUIREMENTS TESTS ============

class TestYearRangeRequirements:
    req_id = None

    def test_create_requirement_with_year_range(self, api_client):
        """POST /api/requirements with start_year and end_year"""
        ts = int(time.time())
        payload = {
            "name": f"TEST_YearRange_{ts}",
            "requirement_type": "license_renewal",
            "credit_types": ["ama_cat1"],
            "credits_required": 50.0,
            "start_year": 2024,
            "end_year": 2025,
            "due_date": "2025-12-31"
        }
        r = api_client.post(f"{BASE_URL}/api/requirements", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["start_year"] == 2024
        assert data["end_year"] == 2025
        TestYearRangeRequirements.req_id = data["requirement_id"]

    def test_get_requirement_year_range(self, api_client):
        """Verify year range persists"""
        if not TestYearRangeRequirements.req_id:
            pytest.skip("No requirement created")
        r = api_client.get(f"{BASE_URL}/api/requirements/{TestYearRangeRequirements.req_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["start_year"] == 2024
        assert data["end_year"] == 2025

    def test_cleanup_year_range_req(self, api_client):
        """Cleanup test requirement"""
        if TestYearRangeRequirements.req_id:
            api_client.delete(f"{BASE_URL}/api/requirements/{TestYearRangeRequirements.req_id}")
            TestYearRangeRequirements.req_id = None


# ============ BULK IMPORT TESTS ============

class TestBulkImport:
    imported_ids = []

    def test_bulk_import_certificates(self, api_client):
        """POST /api/certificates/bulk-import imports multiple certs"""
        ts = int(time.time())
        payload = {
            "certificates": [
                {"title": f"TEST_Bulk1_{ts}", "provider": "Bulk Provider", "credits": 1.0, "credit_types": ["ama_cat1"], "completion_date": "2024-03-15"},
                {"title": f"TEST_Bulk2_{ts}", "provider": "Bulk Provider", "credits": 2.0, "credit_types": ["moc"], "completion_date": "2024-04-20"}
            ]
        }
        r = api_client.post(f"{BASE_URL}/api/certificates/bulk-import", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["imported_count"] == 2
        assert data["error_count"] == 0
        TestBulkImport.imported_ids = [c["certificate_id"] for c in data["imported"]]

    def test_bulk_import_with_errors(self, api_client):
        """Bulk import with missing required field reports errors"""
        payload = {
            "certificates": [
                {"title": "Good Cert", "provider": "Provider", "credits": 1.0, "completion_date": "2024-01-01"},
                {"title": "", "provider": "Provider", "credits": 1.0, "completion_date": "2024-01-01"},  # Missing title
            ]
        }
        r = api_client.post(f"{BASE_URL}/api/certificates/bulk-import", json=payload)
        assert r.status_code == 200
        data = r.json()
        # At least one error for the row with empty title
        assert data["error_count"] >= 1 or data["imported_count"] <= 1
        # Cleanup any imported
        for cert in data.get("imported", []):
            api_client.delete(f"{BASE_URL}/api/certificates/{cert['certificate_id']}")

    def test_cleanup_bulk_import(self, api_client):
        """Cleanup bulk imported certs"""
        for cert_id in TestBulkImport.imported_ids:
            api_client.delete(f"{BASE_URL}/api/certificates/{cert_id}")
        TestBulkImport.imported_ids = []


# ============ YEAR-OVER-YEAR REPORT TESTS ============

class TestYearOverYearReport:
    def test_year_over_year_report(self, api_client):
        """GET /api/reports/year-over-year returns comparison data"""
        r = api_client.get(f"{BASE_URL}/api/reports/year-over-year?start_year=2022&end_year=2026")
        assert r.status_code == 200
        data = r.json()
        assert data["start_year"] == 2022
        assert data["end_year"] == 2026
        assert "years" in data
        assert len(data["years"]) == 5  # 2022-2026 inclusive

    def test_year_over_year_default_range(self, api_client):
        """Default range is last 5 years"""
        r = api_client.get(f"{BASE_URL}/api/reports/year-over-year")
        assert r.status_code == 200
        data = r.json()
        assert len(data["years"]) == 5

    def test_year_over_year_contains_credits(self, api_client):
        """Each year in report has credit data"""
        r = api_client.get(f"{BASE_URL}/api/reports/year-over-year")
        assert r.status_code == 200
        data = r.json()
        for year_data in data["years"]:
            assert "year" in year_data
            assert "total_certificates" in year_data
            assert "total_credits" in year_data
            assert "by_credit_type" in year_data


# ============ EXPORT TESTS ============

class TestExports:
    def test_pdf_export(self, api_client):
        """GET /api/reports/export/pdf returns PDF"""
        r = api_client.get(f"{BASE_URL}/api/reports/export/pdf?year=2024")
        assert r.status_code == 200
        assert "application/pdf" in r.headers.get("content-type", "")

    def test_excel_export(self, api_client):
        """GET /api/reports/export/excel returns Excel file"""
        r = api_client.get(f"{BASE_URL}/api/reports/export/excel?year=2024")
        assert r.status_code == 200
        content_type = r.headers.get("content-type", "")
        assert "spreadsheet" in content_type or "excel" in content_type or "octet" in content_type

    def test_html_export(self, api_client):
        """GET /api/reports/export/html returns HTML"""
        r = api_client.get(f"{BASE_URL}/api/reports/export/html?year=2024")
        assert r.status_code == 200
        assert "<!DOCTYPE html>" in r.text
        assert "CME Transcript" in r.text

    def test_exports_unauthorized(self, unauth_client):
        """Export endpoints require auth"""
        r = unauth_client.get(f"{BASE_URL}/api/reports/export/pdf")
        assert r.status_code == 401
