import { test, expect } from "@playwright/test";
test("logo stays left and all utility controls stay right in English and Arabic", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (const language of ["en", "ar"]) {
    await page
      .getByRole("combobox", { name: "Language / اللغة" })
      .selectOption(language);
    const logo = await page.locator("header img").boundingBox(),
      menu = await page
        .locator("header")
        .getByRole("button", {
          name: language === "en" ? "Open menu" : "فتح القائمة",
          exact: true,
        })
        .boundingBox();
    expect(logo!.x).toBeLessThan(menu!.x);
    expect(menu!.x).toBeGreaterThan(1000);
    await expect(page.locator('header a[href="/auth/admin"]')).toHaveCount(0);
  }
});
test("state selector contains every state and changes the dependent LGA", async ({
  page,
}) => {
  await page.goto("/");
  const state = page.getByRole("combobox", {
    name: "State / Abuja FCT",
    exact: true,
  });
  const lga = page.getByRole("combobox", {
    name: "Local Government Area",
    exact: true,
  });
  await expect(state.locator("option")).toHaveCount(38);
  await state.selectOption("Lagos");
  await lga.selectOption("Ikeja");
  await state.selectOption("Kano");
  await expect(lga).toHaveValue("");
  await expect(lga.locator('option[value="Ikeja"]')).toHaveCount(0);
  await state.selectOption("FCT Abuja");
  await expect(lga.locator("option")).toHaveCount(7);
});
test("professional signup uses required state, LGA and NIN fields on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const role of ["agent", "manager"]) {
    await page.goto(`/auth?tab=signup&role=${role}`);
    await expect(
      page.getByRole("combobox", { name: "State / Abuja FCT", exact: true }),
    ).toHaveAttribute("required", "");
    await page
      .getByRole("combobox", { name: "State / Abuja FCT", exact: true })
      .selectOption("Lagos");
    await page
      .getByRole("combobox", { name: "Local Government Area", exact: true })
      .selectOption("Ikeja");
    await expect(page.locator('input[name="nin"]')).toHaveAttribute(
      "required",
      "",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
