import { test, expect } from "@playwright/test";
const slugs = [
  "interior-design",
  "decoration-styling",
  "furnishing",
  "turkish-tiles-supply",
  "building-materials-supply",
  "smart-home-installation",
  "construction-services",
  "general-contracts",
  "renovation-refurbishment",
  "architectural-design",
  "space-planning",
  "property-development",
  "land-real-estate-brokerage",
];
for (const slug of slugs) {
  test(`${slug} renders on the server and opens its request form`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`/services/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Full Name *", exact: true }),
    ).toBeVisible();
    await page.goto(`/request?service=${slug}`);
    await expect(
      page.getByRole("textbox", { name: "Email Address *", exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
test("unknown service returns a controlled 404", async ({ page }) => {
  const response = await page.goto("/services/does-not-exist");
  expect(response?.status()).toBe(404);
});
for (const width of [1440, 390]) {
  test(`public menu is a right-hand scrolling card at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const link = page
      .locator("header")
      .getByRole("link", { name: "Admin Login", exact: true });
    await expect(link).toBeVisible();
    const card = page.locator("header .mobile-dropdown");
    const box = await card.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(353);
    expect(box!.x).toBeGreaterThanOrEqual(width - 380);
    expect(box!.height).toBeLessThanOrEqual(520);
    const scroll = await card.locator(".dropdown-scroll").evaluate((el) => ({
      overflow: getComputedStyle(el).overflowY,
      height: el.clientHeight,
      total: el.scrollHeight,
    }));
    expect(scroll.overflow).toBe("auto");
    expect(scroll.total).toBeGreaterThan(scroll.height);
    await page.keyboard.press("Escape");
    await expect(card).toHaveCount(0);
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page.mouse.click(10, 650);
    await expect(card).toHaveCount(0);
  });
}
test("retired authenticator URL sends guests to admin password sign-in", async ({
  page,
}) => {
  await page.goto("/auth/security");
  await expect(page).toHaveURL(/\/auth\/admin/);
  await expect(
    page.getByRole("heading", { name: "Administrator sign in" }),
  ).toBeVisible();
});

test("service links navigate without a full-page error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/services");
  await page
    .locator('main a[href="/services/interior-design"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/services\/interior-design/);
  await expect(
    page.getByRole("textbox", { name: "Full Name *", exact: true }),
  ).toBeVisible();
  await page
    .locator('main a[href="/services/decoration-styling"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/services\/decoration-styling/);
  await expect(
    page.getByRole("textbox", { name: /^Project Brief/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("browser-only forms cannot submit natively before their handlers are ready", async ({
  browser, baseURL,
}) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto("/auth/admin");
    await expect(
      page.getByRole("button", { name: "Sign In", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("textbox", { name: "Email Address", exact: true }),
    ).toBeDisabled();
    await page.goto("/request?service=interior-design");
    await expect(
      page.getByRole("textbox", { name: "Full Name *", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /^Submit Interior/ }),
    ).toBeDisabled();
  } finally {
    await context.close();
  }
});
