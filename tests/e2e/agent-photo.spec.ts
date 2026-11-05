import { test, expect } from "@playwright/test";
test("agent photo picker previews a supported image and rejects oversized files", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/register/agent");
  const input = page.locator("#agent-profile-photo");
  await expect(input).toBeEnabled();
  await input.setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFv8AAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByAltText("Selected portrait")).toBeVisible();
  await expect(page.getByAltText("Selected portrait")).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  await input.setInputFiles({
    name: "oversized.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(2_000_001),
  });
  await expect(page.getByRole("alert")).toContainText("up to 2 MB");
  expect(errors).toEqual([]);
});
