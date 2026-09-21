import { test as setup, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alikodiamondkey.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard or home
  await page.waitForURL(/\/(dashboard|admin|$)/);
  
  // Save storage state
  await page.context().storageState({ path: 'tests/.auth/admin.json' });
});
