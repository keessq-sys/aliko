import { test, expect } from "@playwright/test";

test("hero search and navigation content are rendered without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.getByRole("heading", { name: "Find Your Diamond Key Property." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse Properties", exact: true })).toBeVisible();
  await context.close();
});

test("normal-motion mobile interactions do not start decorative WebGL", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".hero-bg canvas")).toHaveCount(0);
  expect(await page.locator(".hero-media img").getAttribute("src")).toMatch(/^\/Frontend/);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("link", { name: "Properties", exact: true }).first().click();
  await expect(page).toHaveURL(/\/properties$/);
  await expect(page.getByRole("heading", { name: "Verified Property Listings", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
