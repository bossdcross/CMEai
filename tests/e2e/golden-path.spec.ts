import { test, expect } from '@playwright/test';
import { setupAuthSession, dismissToasts } from '../fixtures/helpers';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://cme-tracker.preview.emergentagent.com';
const SESSION_TOKEN = process.env.TEST_SESSION_TOKEN || 'test_session_1772029888767';

test.describe('Golden Path - CME Tracker Core Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
    // Hide emergent badge
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent-badge"], [id*="emergent-badge"]');
        if (badge) (badge as HTMLElement).style.display = 'none';
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  test('full user journey: dashboard → requirements → reports', async ({ page }) => {
    // Step 1: Land on dashboard
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible({ timeout: 15000 });

    // Step 2: Navigate to Requirements
    await page.getByRole('link', { name: /Requirements/ }).click();
    await expect(page).toHaveURL(/\/requirements/);
    await expect(page.getByRole('heading', { name: 'Requirements & Goals' })).toBeVisible();

    // Step 3: Navigate to Reports
    await page.getByRole('link', { name: /Reports/ }).click();
    await expect(page).toHaveURL(/\/reports/);
    await expect(page.getByRole('heading', { name: /Reports & Transcripts/ })).toBeVisible();

    // Step 4: Verify export buttons visible
    await expect(page.getByTestId('export-pdf-btn')).toBeVisible();
    await expect(page.getByTestId('export-excel-btn')).toBeVisible();
  });

  test('certificates page: can open add dialog', async ({ page }) => {
    await page.goto('/certificates', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Certificates/ })).toBeVisible({ timeout: 15000 });

    // Click add certificate button
    const addBtn = page.getByRole('button', { name: /Add Certificate|Add New/ }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click({ force: true });

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    // Close dialog by pressing Escape
    await page.keyboard.press('Escape');
  });

  test('requirements page: can open add requirement dialog', async ({ page }) => {
    await page.goto('/requirements', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('add-requirement-btn')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('add-requirement-btn').click({ force: true });
    // Dialog or form should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
  });

  test('QR scanner page loads', async ({ page }) => {
    await page.goto('/scanner', { waitUntil: 'domcontentloaded' });
    // Should show QR scanner content
    await expect(page.getByRole('heading', { name: /QR|Scanner|EEDS/ })).toBeVisible({ timeout: 15000 });
  });

  test('reports: summary stats visible', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Total Certificates')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Total Credits')).toBeVisible();
    await expect(page.getByText('Credit Types')).toBeVisible();
  });
});
