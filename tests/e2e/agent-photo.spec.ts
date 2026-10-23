import { test, expect } from "@playwright/test";
test("agent photo picker previews a supported image and rejects oversized files", async ({
  page,
}) => {
  await page.goto("/register/agent", { waitUntil: "domcontentloaded" });
  const input = page.locator("#agent-profile-photo");
  await input.setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFv8AAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByAltText("Selected portrait")).toBeVisible();
  await input.setInputFiles({
    name: "oversized.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(2_000_001),
  });
  await expect(page.getByRole("alert")).toContainText("up to 2 MB");
});
