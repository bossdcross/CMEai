import { test, expect } from '@playwright/test';
import { setupAuthSession, dismissToasts } from '../fixtures/helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test('dashboard loads with welcome message', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible({ timeout: 15000 });
  });

  test('dashboard shows overall progress card', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Overall Progress')).toBeVisible({ timeout: 15000 });
  });

  test('dashboard shows credits earned and active goals', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Credits Earned')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Active Goals')).toBeVisible({ timeout: 15000 });
  });

  test('dashboard shows recent certificates section', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Recent Certificates')).toBeVisible({ timeout: 15000 });
  });

  test('dashboard shows quick actions', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Quick Actions')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Upload Certificate')).toBeVisible();
    await expect(page.getByText('Scan EEDS QR Code')).toBeVisible();
  });

  test('dashboard Add Certificate link is visible', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    // Add Certificate appears as a link/button in the top-right of content
    await expect(page.getByText('Add Certificate')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Certificates Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test('certificates page loads', async ({ page }) => {
    await page.goto('/certificates', { waitUntil: 'domcontentloaded' });
    // Page should load - look for main heading
    await expect(page.getByRole('heading', { name: /Certificates|My CME/ })).toBeVisible({ timeout: 15000 });
  });

  test('certificates page has add button', async ({ page }) => {
    await page.goto('/certificates', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Add Certificate|Add New/ })).toBeVisible({ timeout: 15000 });
  });

  test('certificates page has search or filter controls', async ({ page }) => {
    await page.goto('/certificates', { waitUntil: 'domcontentloaded' });
    // Search input or filter should exist
    await expect(page.locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search"]')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Requirements Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test('requirements page loads', async ({ page }) => {
    await page.goto('/requirements', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Requirements & Goals' })).toBeVisible({ timeout: 15000 });
  });

  test('requirements page has add goal button', async ({ page }) => {
    await page.goto('/requirements', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('add-requirement-btn')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test('reports page loads', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Reports|Transcript/ })).toBeVisible({ timeout: 15000 });
  });

  test('reports page has export buttons', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('export-pdf-btn')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('export-excel-btn')).toBeVisible({ timeout: 15000 });
  });
});
