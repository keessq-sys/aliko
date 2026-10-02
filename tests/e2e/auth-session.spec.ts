import { test, expect } from "@playwright/test";

test("authentication rejects unsupported flows and oversized requests", async ({
  request,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const invalid = await request.post("/api/auth/session", {
    headers: { origin },
    data: { provider: "password", params: { flow: "grant-admin" } },
  });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({
    error: "Invalid authentication request",
  });
  const oversized = await request.post("/api/auth/session", {
    headers: { origin, "content-type": "application/json" },
    data: "x".repeat(17000),
  });
  expect(oversized.status()).toBe(413);
});

test("anonymous sessions are private and cross-site token reads are forbidden", async ({
  request,
}) => {
  const response = await request.get("/api/auth/session");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ token: null });
  expect(response.headers()["cache-control"]).toContain("no-store");
  const crossSite = await request.get("/api/auth/session", {
    headers: { "sec-fetch-site": "cross-site" },
  });
  expect(crossSite.status()).toBe(403);
});

test("login remains on the form when the backend has not created a session", async ({
  page,
}) => {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      json:
        route.request().method() === "POST"
          ? { signedIn: false }
          : { token: null },
    });
  });
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "Email Address", exact: true })
    .fill("buyer@example.com");
  await page.locator('input[type="password"]').fill("test-password");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByText("Sign in was not completed. Please try again.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
