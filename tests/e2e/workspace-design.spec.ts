import { test, expect } from "@playwright/test";
for (const width of [390, 1280])
  test(`public navigation at ${width}px has one menu and no history controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const header = page.locator("header").first();
    await expect(header.getByRole("button")).toHaveCount(2);
    await header
      .getByRole("button", { name: "Open menu", exact: true })
      .click();
    await expect(
      header.getByRole("combobox", { name: "Language / اللغة" }),
    ).toBeVisible();
    await expect(
      header.getByRole("button", { name: "Go back", exact: true }),
    ).toHaveCount(0);
    await expect(
      header.getByRole("button", { name: "Go forward", exact: true }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(
      header.getByRole("button", { name: "Open menu", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
