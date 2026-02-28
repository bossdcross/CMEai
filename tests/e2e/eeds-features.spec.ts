import { test, expect } from '@playwright/test';
import { setupAuthSession, dismissToasts, BASE_URL, SESSION_TOKEN } from '../fixtures/helpers';

test.describe('Navigation - New EEDS Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /Dashboard/ })).toBeVisible({ timeout: 10000 });
  });

  test('navigation shows Self-Reported link', async ({ page }) => {
    await expect(page.getByTestId('nav-self-reported')).toBeVisible();
  });

  test('navigation shows Events link', async ({ page }) => {
    await expect(page.getByTestId('nav-events')).toBeVisible();
  });

  test('navigation shows Evaluations link', async ({ page }) => {
    await expect(page.getByTestId('nav-evaluations')).toBeVisible();
  });

  test('navigates to Self-Reported page', async ({ page }) => {
    await page.getByTestId('nav-self-reported').click();
    await expect(page).toHaveURL(/\/self-reported/);
    await expect(page.getByRole('heading', { name: /Self-Reported Credits/ })).toBeVisible();
  });

  test('navigates to Events page', async ({ page }) => {
    await page.getByTestId('nav-events').click();
    await expect(page).toHaveURL(/\/events/);
    await expect(page.getByRole('heading', { name: /CME Events/ })).toBeVisible();
  });

  test('navigates to Evaluations page', async ({ page }) => {
    await page.getByTestId('nav-evaluations').click();
    await expect(page).toHaveURL(/\/evaluations/);
    await expect(page.getByRole('heading', { name: /CME Evaluations/ })).toBeVisible();
  });
});

test.describe('Self-Reported Credits Page', () => {
  let createdCreditId: string;

  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test.afterEach(async ({ request }) => {
    if (createdCreditId) {
      await request.delete(`${BASE_URL}/api/self-reported/${createdCreditId}`, {
        headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      createdCreditId = '';
    }
  });

  test('page loads with header and add button', async ({ page }) => {
    await page.goto('/self-reported', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Self-Reported Credits/ })).toBeVisible();
    await expect(page.getByTestId('add-self-reported-btn')).toBeVisible();
  });

  test('shows stats cards for total credits and activities', async ({ page }) => {
    await page.goto('/self-reported', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Total Credits')).toBeVisible();
    await expect(page.getByText('Activities')).toBeVisible();
  });

  test('year filter dropdown works', async ({ page }) => {
    await page.goto('/self-reported', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('year-filter')).toBeVisible();
    await page.getByTestId('year-filter').click();
    await expect(page.getByRole('option', { name: 'All Years' })).toBeVisible();
  });

  test('add dialog opens and shows form fields', async ({ page }) => {
    await page.goto('/self-reported', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-self-reported-btn').click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('activity-type-select')).toBeVisible();
    await expect(page.getByTestId('activity-title-input')).toBeVisible();
    await expect(page.getByTestId('credits-input')).toBeVisible();
    await expect(page.getByTestId('completion-date-input')).toBeVisible();
  });

  test('create self-reported credit', async ({ page, request }) => {
    await page.goto('/self-reported', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-self-reported-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    
    // Select activity type
    await page.getByTestId('activity-type-select').click();
    await page.getByRole('option', { name: /Journal Club/ }).click();
    
    // Fill form
    await page.getByTestId('activity-title-input').fill(`TEST_JournalClub_${timestamp}`);
    await page.getByTestId('credits-input').fill('1.5');
    await page.getByTestId('completion-date-input').fill('2025-02-15');
    
    // Submit
    await page.getByTestId('submit-self-reported').click();
    
    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    
    // Verify via API
    const response = await request.get(`${BASE_URL}/api/self-reported`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });
    const credits = await response.json();
    const created = credits.find((c: any) => c.title === `TEST_JournalClub_${timestamp}`);
    expect(created).toBeTruthy();
    createdCreditId = created.credit_id;
  });
});

test.describe('CME Events Page', () => {
  let createdEventId: string;

  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test.afterEach(async ({ request }) => {
    if (createdEventId) {
      await request.delete(`${BASE_URL}/api/events/${createdEventId}`, {
        headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      createdEventId = '';
    }
  });

  test('page loads with header and buttons', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /CME Events/ })).toBeVisible();
    await expect(page.getByTestId('add-event-btn')).toBeVisible();
    await expect(page.getByTestId('passcode-signin-btn')).toBeVisible();
  });

  test('shows event tabs (Upcoming, Past, All)', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tab', { name: /Upcoming/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Past/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /All Events/ })).toBeVisible();
  });

  test('add event dialog opens and shows form', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-event-btn').click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('event-title-input')).toBeVisible();
    await expect(page.getByTestId('event-provider-input')).toBeVisible();
    await expect(page.getByTestId('event-start-date')).toBeVisible();
  });

  test('create CME event with passcode', async ({ page, request }) => {
    await page.goto('/events', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-event-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    
    // Fill form
    await page.getByTestId('event-title-input').fill(`TEST_Conference_${timestamp}`);
    await page.getByTestId('event-provider-input').fill('Test Medical Association');
    await page.getByTestId('event-start-date').fill('2025-06-15');
    
    // Submit
    await page.getByTestId('submit-event').click();
    
    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    
    // Verify via API - event should have 6-digit passcode
    const response = await request.get(`${BASE_URL}/api/events`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });
    const events = await response.json();
    const created = events.find((e: any) => e.title === `TEST_Conference_${timestamp}`);
    expect(created).toBeTruthy();
    expect(created.passcode).toBeDefined();
    expect(created.passcode.length).toBe(6);
    createdEventId = created.event_id;
  });

  test('passcode sign-in dialog opens', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('passcode-signin-btn').click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('passcode-input')).toBeVisible();
    await expect(page.getByTestId('submit-passcode')).toBeVisible();
  });

  test('passcode sign-in validates 6 digits', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('passcode-signin-btn').click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Enter 5 digits - button should be disabled
    await page.getByTestId('passcode-input').fill('12345');
    await expect(page.getByTestId('submit-passcode')).toBeDisabled();
    
    // Enter 6 digits - button should be enabled
    await page.getByTestId('passcode-input').fill('123456');
    await expect(page.getByTestId('submit-passcode')).toBeEnabled();
  });
});

test.describe('CME Evaluations Page', () => {
  let createdEvaluationId: string;

  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test.afterEach(async ({ request }) => {
    if (createdEvaluationId) {
      await request.delete(`${BASE_URL}/api/evaluations/${createdEvaluationId}`, {
        headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      createdEvaluationId = '';
    }
  });

  test('page loads with header and add button', async ({ page }) => {
    await page.goto('/evaluations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /CME Evaluations/ })).toBeVisible();
    await expect(page.getByTestId('add-evaluation-btn')).toBeVisible();
  });

  test('shows stats cards', async ({ page }) => {
    await page.goto('/evaluations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Total Evaluations')).toBeVisible();
    await expect(page.getByText('Average Rating')).toBeVisible();
    await expect(page.getByText('Would Recommend')).toBeVisible();
  });

  test('add evaluation dialog opens and shows form', async ({ page }) => {
    await page.goto('/evaluations', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-evaluation-btn').click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('eval-title-input')).toBeVisible();
    await expect(page.getByText('Overall Rating')).toBeVisible();
  });

  test('create evaluation with star rating', async ({ page, request }) => {
    await page.goto('/evaluations', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-evaluation-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    
    // Fill title
    await page.getByTestId('eval-title-input').fill(`TEST_Evaluation_${timestamp}`);
    
    // Click 4th star for overall rating (within dialog)
    const dialog = page.getByRole('dialog');
    const overallRatingSection = dialog.locator('text=Overall Rating').locator('..');
    await overallRatingSection.locator('button').nth(3).click(); // 4th star (0-indexed)
    
    // Fill practice change
    await page.getByTestId('practice-change-input').fill('Will implement new protocol');
    
    // Submit
    await page.getByTestId('submit-evaluation').click();
    
    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    
    // Verify via API
    const response = await request.get(`${BASE_URL}/api/evaluations`, {
      headers: { 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });
    const evaluations = await response.json();
    const created = evaluations.find((e: any) => e.title === `TEST_Evaluation_${timestamp}`);
    expect(created).toBeTruthy();
    expect(created.overall_rating).toBe(4);
    createdEvaluationId = created.evaluation_id;
  });
});

test.describe('PARS Export', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
    await dismissToasts(page);
  });

  test('Reports page has PARS export option', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Reports/ })).toBeVisible();
    
    // Look for PARS export button or text
    // Note: The actual button text might vary based on implementation
    const prsButton = page.locator('button', { hasText: /PARS|ACCME/ });
    const exportOptions = page.locator('[data-testid*="export"]');
    await expect(prsButton.or(exportOptions.first())).toBeVisible({ timeout: 10000 });
  });
});
