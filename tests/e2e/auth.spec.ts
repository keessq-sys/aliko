import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should load login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Login|Aliko Diamond Key/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should show email and password fields', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('a[href*="register"]');
    await expect(page).toHaveURL(/.*register/);
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.click('a[href*="forgot"]');
    await expect(page).toHaveURL(/.*forgot/);
  });
});

test.describe('Registration', () => {
  test('should load agent registration page', async ({ page }) => {
    await page.goto('/register/agent');
    await expect(page).toHaveTitle(/Register|Agent/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should load client registration page', async ({ page }) => {
    await page.goto('/register/manager');
    await expect(page).toHaveTitle(/Register|Manager/);
    await expect(page.locator('form')).toBeVisible();
  });
});
