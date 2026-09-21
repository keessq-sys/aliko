import { test, expect } from '@playwright/test';

test.describe('Properties Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/properties');
  });

  test('should load properties page', async ({ page }) => {
    await expect(page).toHaveTitle(/Properties|Aliko Diamond Key/);
  });

  test('should display property listings', async ({ page }) => {
    const listings = page.locator('[data-testid="property-card"], .property-card, article').first();
    await expect(listings).toBeVisible({ timeout: 10000 });
  });

  test('should have filter controls', async ({ page }) => {
    const filters = page.locator('[data-testid="property-filters"], .filters, form').first();
    await expect(filters).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to property detail', async ({ page }) => {
    const firstProperty = page.locator('[data-testid="property-card"], .property-card, article').first();
    await firstProperty.click();
    await expect(page).toHaveURL(/.*properties\/.*/);
  });
});

test.describe('Property Detail Page', () => {
  test('should load property detail page', async ({ page }) => {
    await page.goto('/properties/prop-001');
    await expect(page).toHaveTitle(/Property|Aliko Diamond Key/);
  });

  test('should display property details', async ({ page }) => {
    await page.goto('/properties/prop-001');
    const details = page.locator('[data-testid="property-details"], .property-details, main').first();
    await expect(details).toBeVisible({ timeout: 10000 });
  });
});
