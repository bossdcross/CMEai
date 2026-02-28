import { Page, expect } from '@playwright/test';

export const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://cme-progress-hub.preview.emergentagent.com';
export const SESSION_TOKEN = process.env.TEST_SESSION_TOKEN || 'test_session_1772029888767';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}

export async function setupAuthSession(page: Page) {
  const domain = new URL(BASE_URL).hostname;
  await page.context().addCookies([{
    name: 'session_token',
    value: SESSION_TOKEN,
    domain: domain,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  }]);
}
