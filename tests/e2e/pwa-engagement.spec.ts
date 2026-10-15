import { test, expect } from "@playwright/test";
test("app installation provides a visible control and instructions without notification prompts", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("button", { name: "Get the app", exact: true }).click();
  await expect(
    page.getByText("Install Aliko Diamond Key", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/On iPhone or iPad, use Safari/)).toBeVisible();
  expect(await page.evaluate(() => Notification.permission)).not.toBe(
    "granted",
  );
});
test("manifest and offline fallback are available, and personal inbox requires authentication", async ({
  request,
  page,
}) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(
    manifest.shortcuts.some((s: any) => s.url === "/dashboard/notifications"),
  ).toBe(true);
  const worker = await (await request.get("/sw.js")).text();
  expect(worker).toContain("addEventListener('push'");
  expect(worker).not.toContain("cache.put");
  await page.goto("/offline.html");
  await expect(
    page.getByRole("heading", { name: "You’re offline" }),
  ).toBeVisible();
  await page.goto("/dashboard/notifications");
  await expect(page).toHaveURL(/\/auth\?/);
});
