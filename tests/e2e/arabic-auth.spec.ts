import { test, expect } from "@playwright/test";
for (const locale of ["en", "ar"])
  for (const path of ["/auth?tab=signin", "/auth/admin"]) {
    test(`${locale} credential integrity and mobile layout at ${path}`, async ({
      page,
      context,
      baseURL,
    }) => {
      await context.addCookies([
        { name: "adk-language", value: locale, url: baseURL! },
      ]);
      let submitted: any;
      await page.route("**/api/auth/session", async (route) => {
        if (route.request().method() === "POST") {
          submitted = route.request().postDataJSON();
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ error: "Email or password is incorrect." }),
          });
        } else
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: '{"token":null}',
          });
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const password = "Exact-كلمة-١٢-Test-482!";
      await page.locator("#email").fill("member@example.invalid");
      await page.locator("#password").fill(password);
      await expect(page.locator("#password")).toHaveAttribute("dir", "ltr");
      await page
        .locator("form")
        .filter({ has: page.locator("#password") })
        .locator("button[type=submit]")
        .click();
      await expect.poll(() => submitted?.params?.password).toBe(password);
      expect(submitted.provider).toBe("password");
      expect(submitted.params.flow).toBe("signIn");
      expect(submitted.params.email).toBe("member@example.invalid");
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "ar" ? "rtl" : "ltr",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    });
  }
