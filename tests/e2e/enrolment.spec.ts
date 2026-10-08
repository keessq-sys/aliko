import { test, expect } from "@playwright/test";
async function accountFields(page: any) {
  await page
    .locator('input[autocomplete="new-password"]')
    .fill("Strong-test-password-482!");
  await page.locator('input[name="nin"]').fill("12345678901");
  await page
    .getByRole("checkbox", { name: /I consent to NIN collection/ })
    .check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
}
test("manager enters account and enrolment once and retains the selected plan on a submission error", async ({
  page,
}) => {
  let payload: any;
  await page.route("**/api/auth/enrolment", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        accountReady: false,
        error: "Temporarily unavailable. Please retry.",
      }),
    });
  });
  await page.goto("/auth?tab=signup&role=manager");
  await expect(page).toHaveURL(/\/register\/manager$/);
  await page
    .getByRole("textbox", { name: "Company Name *", exact: true })
    .fill("One Form Management");
  await page
    .getByRole("textbox", { name: "Contact Person *", exact: true })
    .fill("Manager Applicant");
  await page
    .getByRole("textbox", { name: "Corporate Email *", exact: true })
    .fill("manager@example.invalid");
  await page
    .getByRole("textbox", { name: "Phone Number *", exact: true })
    .fill("08000000000");
  await page
    .getByRole("textbox", { name: "Company / legal address", exact: true })
    .fill("10 Test Road, Ikeja, Lagos");
  await page
    .getByRole("combobox", { name: "State / Abuja FCT" })
    .selectOption("Lagos");
  await page
    .getByRole("combobox", { name: "Local Government Area" })
    .selectOption("Ikeja");
  await accountFields(page);
  await page.getByRole("button", { name: /Starter/ }).click();
  await page
    .getByRole("button", { name: "Submit Enrolment", exact: true })
    .click();
  await expect(
    page.getByText("Temporarily unavailable. Please retry."),
  ).toBeVisible();
  expect(payload.kind).toBe("MANAGER");
  expect(payload.application).toMatchObject({
    companyName: "One Form Management",
    contactName: "Manager Applicant",
    operatingState: "Lagos",
    operatingLga: "Ikeja",
    plan: "STARTER",
  });
  expect(payload.registration.flow).toBe("signUp");
  await expect(page).toHaveURL(/\/register\/manager$/);
  await expect(
    page.getByRole("textbox", { name: "Company Name *", exact: true }),
  ).toHaveValue("One Form Management");
});
test("agent completes the wizard and account details without redirecting to a second signup form", async ({
  page,
}) => {
  let payload: any;
  await page.route("**/api/auth/enrolment", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accountReady: false,
        reference: "ADK-AGT-TEST-ONE-FORM",
      }),
    });
  });
  await page.goto("/auth?tab=signup&role=agent");
  await expect(page).toHaveURL(/\/register\/agent$/);
  await accountFields(page);
  await page.locator("#agent-fullname").fill("Agent Applicant");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("#agent-agency-name").fill("One Form Agency");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("#agent-phone").fill("8012345678");
  await page.locator("#agent-email").fill("agent@example.invalid");
  await page
    .getByRole("combobox", { name: "State / Abuja FCT" })
    .selectOption("Lagos");
  await page
    .getByRole("combobox", { name: "Local Government Area" })
    .selectOption("Ikeja");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("checkbox", { name: /I confirm that all information/ })
    .check();
  await page
    .getByRole("button", { name: "Submit Application", exact: true })
    .click();
  await expect(
    page.getByText("ADK-AGT-TEST-ONE-FORM", { exact: true }),
  ).toBeVisible();
  expect(payload.application).toMatchObject({
    fullName: "Agent Applicant",
    agencyName: "One Form Agency",
    email: "agent@example.invalid",
    operatingState: "Lagos",
    operatingLga: "Ikeja",
  });
  expect(payload.registration.flow).toBe("signUp");
  await expect(page).toHaveURL(/\/register\/agent$/);
});
