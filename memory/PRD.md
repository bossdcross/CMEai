# CMEai - CME Certificate Tracker PRD

## Original Problem Statement
Create an app that will store CME certificates and create/export CME transcripts. Allow user to input requirements for the year (ie license renewal or board recertification) to track progress against requirements. Also allow custom goals to be set to meet hospital or personal requirements. It should also separate the type of CME by subject and approval body (example AMA category 1, self assessment, etc). Should also interface with EEDS in case user scans a QR code generated for EEDS.

## User Choices
- Google social login (Emergent-managed)
- EEDS QR code scanning for CME import
- PDF, Excel, and printable HTML export
- Certificate upload with OCR to auto-extract details (GPT-4o)
- CME types filtered by profession (physicians, NPs/PAs, nurses)
- **Rebrand to "CMEai"**
- **NPI number validation via NPPES registry**

## User Personas
1. **Physicians (MD/DO)** - Track AMA PRA Category 1/2, AOA credits, MOC requirements
2. **Nurse Practitioners / PAs** - Track AANP, AAPA, pharmacology CE
3. **Registered Nurses** - Track ANCC contact hours, CNE credits, specialty CE

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: Emergent Google OAuth
- **OCR**: GPT-4o vision via emergentintegrations
- **NPI Validation**: NPPES CMS Registry API

## What's Been Implemented

### February 28, 2026 - Goal Filtering Enhancement
- [x] **Multi-Criteria Goal Filtering**: Goals can now be linked to specific CME certificates using combination filters
  - Provider filter: Only count certificates from specific providers (e.g., "Mayo Clinic")
  - Subject filter: Only count certificates on specific subjects (e.g., "Cardiology")
  - Credit type filter: Only count specific credit types
  - Year range filter: Only count certificates within a date range
- [x] **Prevents Inappropriate Completion**: Goals only count certificates matching ALL specified criteria
- [x] **Filter Options API**: New endpoint `/api/certificates/filters/options` provides autocomplete suggestions from user's existing certificates
- [x] **UI Enhancement**: Requirement cards display provider/subject badges and filter summary with matching certificate count

### February 28, 2026 - OCR Enhancement & Bug Fixes
- [x] **Enhanced OCR Processing**: Improved prompts, better JSON parsing, expanded credit type mapping
- [x] **OCR Error Handling**: Added "partial" status for incomplete extraction, user-friendly error messages
- [x] **Better Date Parsing**: Handles multiple date formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
- [x] **Fixed Requirements SelectItem Bug**: Changed empty string value to "any" to prevent React crash
- [x] **All Tests Pass**: 100% pass rate on 53 backend tests and 47 frontend tests

### February 28, 2026 - Major Feature Update
- [x] **Multiple Credit Types per Certificate**: Certificates can now have multiple credit types (e.g., AMA Cat 1 + MOC + Custom)
- [x] **Custom Credit Types**: Users can create custom credit types for hospital/personal tracking
- [x] **Year-Specific Requirements**: Goals can specify start/end year ranges for accurate tracking
- [x] **Bulk CSV Import**: Import multiple certificates at once via CSV paste
- [x] **Year-over-Year Comparison**: New Reports tab with bar/line charts comparing credits across years
- [x] Added year filter to Certificates page (supports years back to 1990)
- [x] Extended Reports page to support viewing transcripts from any past year (1990-present)

### February 26, 2026
- [x] Added manual edit functionality for certificates (OCR failures can now be manually corrected)
- [x] Edit dialog shows certificate image preview alongside editable form
- [x] Edit button added to both table actions and view dialog
- [x] Upload flow now automatically opens edit dialog when OCR fails

### February 25, 2026
- [x] Landing page with CMEai branding
- [x] Google OAuth authentication flow
- [x] Profession selection onboarding (Physician, NP/PA, Nurse)
- [x] Dashboard with progress tracking, credits overview, requirements status
- [x] Certificate management (CRUD, upload with OCR, manual entry)
- [x] Requirements/Goals management (license renewal, board recert, hospital, personal)
- [x] CME credit categorization by type and approval body
- [x] EEDS QR code scanner integration
- [x] Transcript generation and export (PDF, Excel, HTML)
- [x] NPI number validation via NPPES registry lookup
- [x] User settings with profession and NPI management

### CME Types Supported
**Physicians**: AMA Category 1/2, AOA 1-A/1-B, MOC/MOL, Self-Assessment, Ethics, Pain Management
**NP/PA**: AANP Contact Hours, AAPA Category 1, AMA Category 1, Pharmacology CE, ANCC Contact
**Nurses**: ANCC Contact Hours, CNE Credits, Pharmacology CE, Specialty CE, Ethics, Cultural Competency

## API Endpoints
- `POST /api/auth/session` - Exchange OAuth session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `PUT /api/users/profession` - Update profession
- `GET /api/users/profile` - Get profile with stats
- `POST /api/users/npi/validate` - Validate NPI number
- `DELETE /api/users/npi` - Remove NPI
- `GET /api/cme-types` - Get profession-specific CME types
- `POST /api/cme-types/custom` - Create custom credit type
- `GET /api/certificates` - List certificates (with year filter)
- `POST /api/certificates` - Create certificate
- `PUT /api/certificates/{id}` - Update certificate
- `DELETE /api/certificates/{id}` - Delete certificate
- `POST /api/certificates/upload` - Upload with OCR
- `POST /api/certificates/eeds-import` - Import from EEDS QR
- `POST /api/certificates/bulk-import` - Bulk CSV import
- `GET /api/requirements` - List requirements
- `POST /api/requirements` - Create requirement (with year range)
- `PUT /api/requirements/{id}` - Update requirement
- `DELETE /api/requirements/{id}` - Delete requirement
- `GET /api/dashboard` - Get dashboard data
- `GET /api/reports/summary` - Get report summary
- `GET /api/reports/year-over-year` - Year comparison data
- `GET /api/reports/export/{pdf|excel|html}` - Export transcript

## Testing Status
- **Backend Tests**: 53/53 passed (100%)
- **Frontend Tests**: 47/47 passed (100%)
- **Test Session**: test_session_1772029888767

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core authentication flow
- [x] Certificate CRUD operations
- [x] Requirements tracking
- [x] Dashboard overview

### P1 (High Priority) - DONE
- [x] Certificate OCR extraction (enhanced with better error handling)
- [x] NPI validation
- [x] Export functionality (PDF, Excel, HTML)
- [x] EEDS QR scanner
- [x] Multiple credit types per certificate
- [x] Custom credit types
- [x] Year-specific requirements
- [x] Bulk CSV import
- [x] Year-over-year comparison reports

### P2 (Medium Priority) - TODO
- [ ] Email reminders for upcoming deadlines
- [ ] Certificate image viewer with zoom
- [ ] Advanced analytics (monthly breakdown, provider stats)

### P3 (Nice to Have) - TODO
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] Integration with state licensing boards
- [ ] Automated credit verification with providers

## Next Tasks
1. Add email reminder notifications for requirements approaching deadline
2. Implement certificate image zoom/preview modal
3. Enhanced analytics dashboard with monthly breakdown
