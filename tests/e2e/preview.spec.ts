import { test, expect } from '@playwright/test';

test('Aliko preview renders styled content and opens its catalogue', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/Aliko Diamond Key/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Diamond Key');
  await expect(page.locator('header')).toHaveCSS('position', 'sticky');
  await page.getByRole('link', { name: 'Browse Properties', exact: true }).click();
  await expect(page).toHaveURL(/\/properties/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Property');
  expect(errors).toEqual([]);
});

test('mobile preview fits the screen and retains navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  const width = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(width.content).toBeLessThanOrEqual(width.viewport);
});
