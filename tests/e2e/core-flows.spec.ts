import { test, expect } from '@playwright/test';
import { setupAuthSession, dismissToasts } from '../fixtures/helpers';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://cme-progress-hub.preview.emergentagent.com';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('landing page loads with header and sign-in button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('header-sign-in-btn')).toBeVisible();
  });

  test('hero section has Get Started button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('hero-get-started-btn')).toBeVisible();
  });

  test('CTA section has Sign In button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cta-sign-in-btn')).toBeVisible();
  });

  test('landing page shows feature cards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Features section should be visible
    await expect(page.getByRole('heading', { name: 'Track CME Credits' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Set Goals' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick Import' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Export Transcripts' })).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('authenticated user is redirected from landing to dashboard', async ({ page }) => {
    await setupAuthSession(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /Certificates/ })).toBeVisible({ timeout: 10000 });
  });

  test('navigation bar shows all links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Dashboard/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Certificates/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Self-Reported/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Events/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Requirements/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Evaluations/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Reports/ })).toBeVisible();
  });

  test('navigates to certificates page', async ({ page }) => {
    await page.getByRole('link', { name: /Certificates/ }).click();
    await expect(page).toHaveURL(/\/certificates/);
  });

  test('navigates to requirements page', async ({ page }) => {
    await page.getByRole('link', { name: /Requirements/ }).click();
    await expect(page).toHaveURL(/\/requirements/);
  });

  test('navigates to reports page', async ({ page }) => {
    await page.getByRole('link', { name: /Reports/ }).click();
    await expect(page).toHaveURL(/\/reports/);
  });
});
