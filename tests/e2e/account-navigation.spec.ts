import { test, expect } from "@playwright/test";
test("administrator entry is separate and never displays supplied credentials", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("link", { name: "Admin Login", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/auth\/admin/);
  await expect(
    page.getByRole("heading", { name: "Administrator sign in" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Email Address", exact: true }),
  ).toHaveValue("");
  await expect(page.locator('input[type="password"]')).toHaveValue("");
});
test("registration has password visibility controls and a working strength meter", async ({
  page,
}) => {
  await page.goto("/auth?tab=signup");
  const password = page.locator('input[autocomplete="new-password"]').first();
  await password.fill("Strong-password-482!");
  await expect(
    page.getByRole("meter", { name: "Password strength" }).first(),
  ).toHaveAttribute("value", "5");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .first()
    .click();
  await expect(password).toHaveAttribute("type", "text");
  await page
    .getByRole("button", { name: "Hide password", exact: true })
    .first()
    .click();
  await expect(password).toHaveAttribute("type", "password");
});
test("hero search retains dark readable fields in light mode", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("adk-theme", "light"));
  await page.goto("/");
  const colors = await page
    .getByRole("combobox", { name: "State / Abuja FCT", exact: true })
    .evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
    }));
  expect(colors.background).not.toBe("rgb(255, 255, 255)");
  expect(colors.color).toBe("rgb(255, 255, 255)");
});
