import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const theme of ["light", "dark"]) {
  test(`${theme}: featured cards load property photos and remain readable`, async ({
    page,
  }) => {
    await page.addInitScript(
      (value) => localStorage.setItem("adk-theme", value),
      theme,
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const section = page.getByTestId("featured-properties");
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator(".prop-card[href]")).toHaveCount(6);
    const photos = section.locator(".prop-card[href] > div:first-child > img");
    await expect(photos).toHaveCount(6);
    for (const photo of await photos.all()) {
      await expect
        .poll(() =>
          photo.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    const result = await new AxeBuilder({ page })
      .include('[data-testid="featured-properties"]')
      .withTags(["wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
    ).toEqual([]);
  });
}
test("featured photo falls back to another photo from the same gallery", async ({
  page,
}) => {
  await page.route("**/HOUSES/IMG-20260921-WA0199.jpg", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const section = page.getByTestId("featured-properties");
  await section.scrollIntoViewIfNeeded();
  const photo = section
    .locator(".prop-card[href]")
    .first()
    .locator("div")
    .first()
    .locator(":scope > img");
  await expect(photo).toHaveAttribute("src", /WA0223/);
  await expect
    .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});
test("unavailable galleries show an honest photo placeholder", async ({
  page,
}) => {
  await page.route("**/HOUSES/**", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const section = page.getByTestId("featured-properties");
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator(".property-image-unavailable")).toHaveCount(6);
  await expect(
    section.locator(".prop-card[href] > div:first-child > img"),
  ).toHaveCount(0);
});
test("light theme shared controls and dashboard badges meet contrast requirements", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("adk-theme", "light"));
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.evaluate(() => {
    const sample = document.createElement("section");
    sample.id = "theme-contract";
    sample.style.cssText =
      "background:white;padding:24px;position:relative;z-index:60";
    for (const className of [
      "btn-primary",
      "btn-secondary",
      "btn-danger",
      "btn-ghost",
      "tab-pill",
      "tab-pill-active",
      "sidebar-item",
      "sidebar-item-active",
      "badge-client",
      "badge-agent",
      "badge-manager",
      "wizard-step-inactive",
      "wizard-step-active",
      "wizard-step-complete",
    ]) {
      const node = document.createElement("span");
      node.className = className;
      node.textContent = "Sample";
      node.style.margin = "8px";
      sample.append(node);
    }
    document.body.append(sample);
  });
  const result = await new AxeBuilder({ page })
    .include("#theme-contract")
    .withTags(["wcag2aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.failureSummary),
    })),
  ).toEqual([]);
});
test("featured section reveals on a short mobile screen with animations enabled", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const section = page.getByTestId("featured-properties");
  await section.scrollIntoViewIfNeeded();
  await expect
    .poll(() => section.evaluate((node) => getComputedStyle(node).opacity))
    .toBe("1");
});
