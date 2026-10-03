import { test, expect } from "@playwright/test";

test("language switch translates navigation, persists and restores English", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Language / اللغة" })
    .selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const menu = page
    .locator("header")
    .getByRole("button", { name: /فتح القائمة|افتح القائمة/ });
  await menu.click();
  await expect(
    page.locator("header").getByRole("link", { name: "العقارات", exact: true }),
  ).toBeVisible();
  await page
    .locator("header")
    .getByRole("link", { name: "العقارات", exact: true })
    .click();
  await expect(page).toHaveURL(/\/properties$/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page
    .getByRole("combobox", { name: "Language / اللغة" })
    .selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", { name: /Verified Property Listings/i }),
  ).toBeVisible();
});

test("Arabic is rendered on the server and supports Unicode name and NIN fields", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: "adk-language", value: "ar", url: baseURL! },
  ]);
  const response = await page.goto("/auth?tab=signup");
  expect(response?.headers()["content-language"]).toBe("ar");
  expect(await response!.text()).toContain('lang="ar" dir="rtl"');
  const name = page.locator('input[autocomplete="name"]');
  await name.fill("أحمد إبراهيم");
  await expect(name).toHaveValue("أحمد إبراهيم");
  await expect(name).toHaveAttribute("dir", "auto");
  const nin = page.locator('input[name="nin"]');
  await expect(nin).toHaveAttribute("required", "");
  await nin.fill("١٢٣٤٥٦٧٨٩٠١");
  await expect(nin).toHaveValue("١٢٣٤٥٦٧٨٩٠١");
  await expect(
    page.getByText("رقم التعريف الوطني (NIN)", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('form input[type="checkbox"][required]'),
  ).toHaveCount(1);
});

test("signup requires identity details for buyers, renters, agents and managers", async ({
  page,
}) => {
  for (const role of ["client", "agent", "manager"]) {
    await page.goto(`/auth?tab=signup&role=${role}`);
    await expect(page.locator('input[name="nin"]')).toBeVisible();
    await expect(page.locator('input[name="nin"]')).toHaveAttribute(
      "required",
      "",
    );
    await expect(
      page.getByRole("link", { name: "KYC consent notice" }),
    ).toBeVisible();
  }
  await page.goto("/auth?tab=signup");
  await page
    .getByRole("combobox", { name: "Account type" })
    .selectOption("RENTER");
  await expect(
    page.getByRole("combobox", { name: "Account type" }),
  ).toHaveValue("RENTER");
});

test("the desktop header shows route links only after opening its menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.locator("header");
  await expect(
    header.getByRole("link", { name: "Properties", exact: true }),
  ).toHaveCount(0);
  await header.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(
    header.getByRole("link", { name: "Properties", exact: true }),
  ).toHaveCount(1);
  await expect(
    header.getByRole("link", { name: "Properties", exact: true }),
  ).toBeVisible();
});

test("Arabic mobile forms fit the viewport and preserve the language choice", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/auth?tab=signup");
  await page
    .getByRole("combobox", { name: "Language / اللغة" })
    .selectOption("ar");
  await page.locator('input[autocomplete="name"]').fill("فاطمة أحمد");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
