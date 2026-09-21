import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Aliko Diamond Key/);
  });

  test('should display hero section', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('should have navigation header', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should navigate to properties page', async ({ page }) => {
    await page.click('a[href="/properties"]');
    await expect(page).toHaveURL(/.*properties/);
  });

  test('should navigate to services page', async ({ page }) => {
    await page.click('a[href="/services"]');
    await expect(page).toHaveURL(/.*services/);
  });

  test('should navigate to agents page', async ({ page }) => {
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL(/.*agents/);
  });
});
