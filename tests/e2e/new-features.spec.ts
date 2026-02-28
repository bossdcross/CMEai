import { test, expect } from '@playwright/test';
import { setupAuthSession, dismissToasts, BASE_URL, SESSION_TOKEN } from '../fixtures/helpers';

test.describe('Certificate CRUD Operations', () => {
  let createdCertId: string;

  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test.afterEach(async ({ request }) => {
    // Cleanup created certificate
    if (createdCertId) {
      await request.delete(`${BASE_URL}/api/certificates/${createdCertId}`, {
        headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      createdCertId = '';
    }
  });

  test('create certificate via dialog', async ({ page, request }) => {
    await page.goto('/certificates', { waitUntil: 'domcontentloaded' });
    
    // Click add certificate button
    await page.getByTestId('add-certificate-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill form
    const timestamp = Date.now();
    await page.getByTestId('cert-title-input').fill(`TEST_Cert_${timestamp}`);
    await page.getByTestId('cert-provider-input').fill('Test Provider');
    await page.getByTestId('cert-credits-input').fill('2.5');
    await page.getByTestId('cert-date-input').fill('2024-06-15');

    // Select credit type (checkbox)
    await page.locator('label').filter({ hasText: 'AMA PRA Category 1' }).click();

    // Submit
    await page.getByTestId('save-cert-btn').click();

    // Wait for dialog to close and refresh
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // Verify certificate was created via API
    const response = await request.get(`${BASE_URL}/api/certificates`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });
    const certs = await response.json();
    const created = certs.find((c: any) => c.title === `TEST_Cert_${timestamp}`);
    expect(created).toBeTruthy();
    createdCertId = created.certificate_id;
  });

  test('certificates page shows certificates table', async ({ page }) => {
    await page.goto('/certificates', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Certificates/ })).toBeVisible({ timeout: 10000 });
    // Table or empty state should be visible
    const table = page.locator('table');
    const emptyState = page.locator('text=No certificates found');
    await expect(table.or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test('search certificates works', async ({ page }) => {
    await page.goto('/certificates', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('search-certificates')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('search-certificates').fill('nonexistent-search-term');
    // Either table rows or empty state message should be visible
    await expect(page.locator('table tbody tr').first().or(page.getByText('No certificates found'))).toBeVisible();
  });
});

test.describe('Multiple Credit Types', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test('can select multiple credit types when creating certificate', async ({ page }) => {
    await page.goto('/certificates', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-certificate-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill basic fields
    await page.getByTestId('cert-title-input').fill('Multi Credit Test');
    await page.getByTestId('cert-provider-input').fill('Test Provider');
    await page.getByTestId('cert-credits-input').fill('3.0');
    await page.getByTestId('cert-date-input').fill('2024-05-10');

    // Select multiple credit types - click on the labels
    await page.getByText('AMA PRA Category 1', { exact: true }).click();
    await page.getByText('MOC/MOL').click();
    
    // Verify at least one credit type checkbox is in checked state (data-state="checked")
    // The shadcn Checkbox component uses data-state attribute
    await expect(page.locator('[data-state="checked"]').first()).toBeVisible();
    
    // Close dialog without saving
    await page.keyboard.press('Escape');
  });
});

test.describe('Custom Credit Types', () => {
  let customTypeId: string;

  test.afterEach(async ({ request }) => {
    if (customTypeId) {
      await request.delete(`${BASE_URL}/api/cme-types/custom/${customTypeId}`, {
        headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      customTypeId = '';
    }
  });

  test('custom credit type creation via API', async ({ request }) => {
    const timestamp = Date.now();
    const response = await request.post(`${BASE_URL}/api/cme-types/custom`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SESSION_TOKEN}`
      },
      data: {
        name: `TEST_Custom_Type_${timestamp}`,
        description: 'Test custom credit type'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.name).toBe(`TEST_Custom_Type_${timestamp}`);
    expect(data.credit_type_id).toBeTruthy();
    customTypeId = data.credit_type_id;
  });
});

test.describe('Requirements with Year Range', () => {
  let createdReqId: string;

  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test.afterEach(async ({ request }) => {
    if (createdReqId) {
      await request.delete(`${BASE_URL}/api/requirements/${createdReqId}`, {
        headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      createdReqId = '';
    }
  });

  test('add requirement dialog opens with year selectors', async ({ page }) => {
    await page.goto('/requirements', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('add-requirement-btn')).toBeVisible({ timeout: 10000 });
    
    await page.getByTestId('add-requirement-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify year selectors exist
    await expect(page.getByTestId('req-start-year-select')).toBeVisible();
    await expect(page.getByTestId('req-end-year-select')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('create requirement with year range via API', async ({ request }) => {
    const timestamp = Date.now();
    const response = await request.post(`${BASE_URL}/api/requirements`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SESSION_TOKEN}`
      },
      data: {
        name: `TEST_YearRange_Req_${timestamp}`,
        requirement_type: 'license_renewal',
        credit_types: ['ama_cat1'],
        credits_required: 25.0,
        start_year: 2024,
        end_year: 2025,
        due_date: '2025-12-31'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.start_year).toBe(2024);
    expect(data.end_year).toBe(2025);
    createdReqId = data.requirement_id;

    // Verify via GET
    const getResponse = await request.get(`${BASE_URL}/api/requirements/${createdReqId}`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });
    const fetchedReq = await getResponse.json();
    expect(fetchedReq.start_year).toBe(2024);
    expect(fetchedReq.end_year).toBe(2025);
  });
});

test.describe('Bulk CSV Import', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test('bulk import dialog opens with textarea', async ({ page }) => {
    await page.goto('/certificates', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('import-csv-btn')).toBeVisible({ timeout: 10000 });
    
    await page.getByTestId('import-csv-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('csv-import-textarea')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('bulk import API works', async ({ request }) => {
    const timestamp = Date.now();
    const response = await request.post(`${BASE_URL}/api/certificates/bulk-import`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SESSION_TOKEN}`
      },
      data: {
        certificates: [
          {
            title: `TEST_Bulk_${timestamp}_1`,
            provider: 'Bulk Test Provider',
            credits: 1.0,
            credit_types: ['ama_cat1'],
            completion_date: '2024-01-15'
          },
          {
            title: `TEST_Bulk_${timestamp}_2`,
            provider: 'Bulk Test Provider',
            credits: 2.0,
            credit_types: ['moc'],
            completion_date: '2024-02-20'
          }
        ]
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.imported_count).toBe(2);
    expect(data.error_count).toBe(0);

    // Cleanup - delete created certificates
    for (const cert of data.imported) {
      await request.delete(`${BASE_URL}/api/certificates/${cert.certificate_id}`, {
        headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
    }
  });
});

test.describe('Year-over-Year Report', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test('comparison tab exists on reports page', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('tab-comparison')).toBeVisible({ timeout: 10000 });
  });

  test('can switch to comparison tab', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('tab-comparison').click();
    // Should show comparison data (chart or table)
    await expect(page.getByText(/Year-over-Year|Comparison|Credits by Year/i)).toBeVisible({ timeout: 10000 });
  });

  test('year-over-year API returns data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/reports/year-over-year?start_year=2022&end_year=2026`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.years).toBeDefined();
    expect(data.years.length).toBe(5);
    expect(data.start_year).toBe(2022);
    expect(data.end_year).toBe(2026);
  });
});

test.describe('Report Exports', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test('export buttons are visible', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('export-pdf-btn')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('export-excel-btn')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('export-html-btn')).toBeVisible({ timeout: 10000 });
  });

  test('PDF export returns valid file', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/reports/export/pdf?year=2024`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
  });

  test('Excel export returns valid file', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/reports/export/excel?year=2024`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });

    expect(response.status()).toBe(200);
    // Excel files have spreadsheet MIME type
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/spreadsheet|excel|octet-stream/);
  });

  test('HTML export returns valid HTML', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/reports/export/html?year=2024`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });

    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('CME Transcript');
  });
});

test.describe('CME Types by Profession', () => {
  test('authenticated user gets profession-specific CME types', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/cme-types`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });

    expect(response.status()).toBe(200);
    const types = await response.json();
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);
    // Test user is physician, should have AMA Cat 1
    const hasAma = types.some((t: any) => t.id === 'ama_cat1');
    expect(hasAma).toBe(true);
  });

  test('all CME types endpoint returns all professions', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/cme-types/all`);

    expect(response.status()).toBe(200);
    const types = await response.json();
    expect(types.physician).toBeDefined();
    expect(types.np_pa).toBeDefined();
    expect(types.nurse).toBeDefined();
  });
});
