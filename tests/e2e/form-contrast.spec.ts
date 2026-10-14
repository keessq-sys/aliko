import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
function contrast(a: string, b: string) {
  const luminance = (color: string) => {
    const values = color
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const theme of ["light", "dark"])
  for (const role of ["client", "manager", "agent"]) {
    test(`${theme}: ${role} password, NIN, location and consent have consistent readable colours`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript(
        (value) => localStorage.setItem("adk-theme", value),
        theme,
      );
      await page.goto(`/auth?tab=signup&role=${role}`);
      if (role !== "client")
        await expect(page).toHaveURL(new RegExp(`/register/${role}$`));
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const password = page
        .locator('input[autocomplete="new-password"]')
        .first();
      await password.fill("Strong-test-password-482!");
      await page.locator('input[name="nin"]').fill("12345678901");
      await page
        .getByRole("checkbox", { name: /I consent to NIN collection/ })
        .check();
      await expect(
        page.getByText("11-digit format complete", { exact: false }),
      ).toBeVisible();
      if (role === "agent") {
        await page.locator("#agent-fullname").fill("Agent Applicant");
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .click();
        await page.locator("#agent-agency-name").fill("Test Agency");
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .click();
      }
      const state = page.getByRole("combobox", {
        name: "State / Abuja FCT",
        exact: true,
      });
      await state.selectOption("Lagos");
      await page
        .getByRole("combobox", { name: "Local Government Area", exact: true })
        .selectOption("Ikeja");
      const controls = [
        password,
        page.locator('input[name="nin"]'),
        state,
        page.getByRole("combobox", {
          name: "Local Government Area",
          exact: true,
        }),
      ];
      const colours = [];
      for (const control of controls) {
        const style = await control.evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            color: s.color,
            background: s.backgroundColor,
            border: s.borderTopColor,
          };
        });
        expect(contrast(style.color, style.background)).toBeGreaterThanOrEqual(
          4.5,
        );
        expect(contrast(style.border, style.background)).toBeGreaterThanOrEqual(
          3,
        );
        colours.push(style.background);
      }
      expect(new Set(colours).size).toBe(1);
      await password.focus();
      const focus = await password.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          color: s.outlineColor,
          width: s.outlineWidth,
          background: s.backgroundColor,
        };
      });
      expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(2);
      expect(contrast(focus.color, focus.background)).toBeGreaterThanOrEqual(3);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations
          .filter((v) => ["critical", "serious"].includes(v.impact ?? ""))
          .map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
      ).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(390);
    });
  }
