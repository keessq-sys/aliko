import { writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1280])
  for (const theme of ["light", "dark"])
    for (const route of [
      "/",
      "/properties",
      "/map",
      "/services",
      "/auth",
      "/plots",
      "/agents",
      "/properties/emerald-lekki-duplex",
      "/request?service=interior-design",
      "/register/agent",
      "/register/manager",
    ]) {
      test(`${theme} accessibility and layout ${width}px ${route}`, async ({
        page,
      }, testInfo) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width, height: 844 });
        await page.addInitScript(
          (value) => localStorage.setItem("adk-theme", value),
          theme,
        );
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await page.waitForTimeout(700);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        await writeFile(
          testInfo.outputPath("accessibility.json"),
          JSON.stringify(results.violations),
        );
        await testInfo.attach("accessibility-results", {
          body: JSON.stringify(results.violations),
          contentType: "application/json",
        });
        const failures = results.violations.filter((v) =>
          ["critical", "serious"].includes(v.impact ?? ""),
        );
        expect(
          failures.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes
              .slice(0, 3)
              .map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        ).toEqual([]);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);
        await page.keyboard.press("Tab");
        expect(
          await page.evaluate(() => document.activeElement?.tagName),
        ).not.toBe("BODY");
      });
    }
test("private workspaces require authentication", async ({ page }) => {
  for (const path of [
    "/dashboard/messages",
    "/dashboard/account",
    "/dashboard/operations",
    "/admin/finance",
    "/admin/content",
  ]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\?/);
  }
});
