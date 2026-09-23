import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Wait for an element to be visible with a custom timeout
 */
export async function waitForVisible(page: Page, selector: string, timeout = 10000): Promise<Locator> {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });
  return element;
}

/**
 * Fill a form field and verify it was filled
 */
export async function fillField(page: Page, selector: string, value: string): Promise<void> {
  const field = page.locator(selector);
  await field.fill(value);
  await expect(field).toHaveValue(value);
}

/**
 * Click an element and wait for navigation
 */
export async function clickAndWait(page: Page, selector: string, urlPattern?: RegExp): Promise<void> {
  const element = page.locator(selector);
  await element.click();
  
  if (urlPattern) {
    await page.waitForURL(urlPattern);
  } else {
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Wait for toast/notification to appear
 */
export async function waitForToast(page: Page, message: string, timeout = 5000): Promise<void> {
  const toast = page.locator(`[role="alert"], .toast, .notification`).filter({ hasText: message });
  await expect(toast).toBeVisible({ timeout });
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/screenshots/${name}-${Date.now()}.png`, fullPage: true });
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const count = await page.locator(selector).count();
  return count > 0;
}

/**
 * Get text content of an element safely
 */
export async function getTextContent(page: Page, selector: string): Promise<string | null> {
  const element = page.locator(selector);
  if (await element.count() > 0) {
    return await element.textContent();
  }
  return null;
}

/**
 * Wait for Convex subscription to sync
 */
export async function waitForConvexSync(page: Page, timeout = 10000): Promise<void> {
  // Wait for any loading indicators to disappear
  await page.waitForFunction(
    () => !document.querySelector('[data-loading="true"], .loading, .spinner'),
    { timeout }
  );
}
