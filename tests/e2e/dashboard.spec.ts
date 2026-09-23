import { test, expect } from '@playwright/test';

test.describe('Dashboard Pages (Protected)', () => {
  test('should redirect to login when accessing agent dashboard', async ({ page }) => {
    await page.goto('/dashboard/agent');
    await expect(page).toHaveURL(/.*auth.*signin/);
  });

  test('should redirect to login when accessing client dashboard', async ({ page }) => {
    await page.goto('/dashboard/client');
    await expect(page).toHaveURL(/.*auth.*signin/);
  });

  test('should redirect to login when accessing manager dashboard', async ({ page }) => {
    await page.goto('/dashboard/manager');
    await expect(page).toHaveURL(/.*auth.*signin/);
  });

  test('should redirect to login when accessing admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*auth.*signin/);
  });

  test('should protect a payment checkout link', async ({ page }) => {
    await page.goto('/checkout/ADK-TEST-BOOKING');
    await expect(page).toHaveURL(/.*auth.*signin/);
  });
});

test.describe('Admin Dashboard (After Login)', () => {
  test.skip(!process.env.ADMIN_E2E_AUTH, 'Set ADMIN_E2E_AUTH and provide tests/.auth/admin.json to run authenticated admin tests.');
  test.use({ storageState: 'tests/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    // This test requires authenticated admin state
    // Run: npx playwright test --project=chromium --grep "Admin Dashboard" --update-snapshots
    // Or manually login and save storage state
  });

  test('should load admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveTitle(/Admin|Dashboard/);
  });

  test('should navigate to admin sections', async ({ page }) => {
    await page.goto('/admin');
    const sections = ['agents', 'managers', 'users', 'plots', 'projects', 'documents', 'requests', 'services', 'settings'];
    
    for (const section of sections) {
      await page.goto(`/admin/${section}`);
      await expect(page).toHaveURL(new RegExp(`admin/${section}`));
    }
  });
});
