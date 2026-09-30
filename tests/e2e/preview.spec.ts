import { test, expect } from '@playwright/test';

test('Aliko preview renders styled content and opens its catalogue', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Aliko Diamond Key/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Diamond Key');
  await expect(page.locator('header')).toHaveCSS('position', 'sticky');
  await page.getByRole('link', { name: 'Browse Properties', exact: true }).first().click();
  await expect(page).toHaveURL(/\/properties/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Property');
  expect(errors).toEqual([]);
});

test('mobile preview fits the screen and retains navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  const width = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(width.content).toBeLessThanOrEqual(width.viewport);
});

test('published legal and consent notices are reachable', async ({ page }) => {
  const routes = [
    ['terms', 'Terms of Service'],
    ['privacy', 'Privacy Policy'],
    ['kyc-consent', 'KYC Consent'],
    ['payments-refunds', 'Payment and Refund Policy'],
    ['data-retention', 'Data Retention Policy'],
    ['e-signature', 'Electronic Signature Disclosure'],
    ['cookies', 'Cookie and Analytics Notice'],
  ] as const;
  for (const [slug, title] of routes) {
    await page.goto(`/legal/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page).toHaveTitle(new RegExp(title));
  }
});
