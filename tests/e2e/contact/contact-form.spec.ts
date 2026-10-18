import { test, expect } from "../support/fixtures";
import { ContactPage, applicant } from "../support/contact";
import { inquiry, mockSubmitInquiry, reply } from "../support/network";
import { messages } from "../support/messages";

const en = messages.en.ContactPage.form;
const country = en.countries[0];
const service = messages.en.Solutions.items[0].title;
const serviceMessage = "We need to stabilise a 200-seat contact centre.";

/**
 * Known defects are asserted against the intended contract. Each test calls
 * `test.fail()` immediately before the defect assertion, so a broken setup
 * step still fails the run instead of counting as the expected failure.
 */
const knownDefect = (id: string, description: string) => {
  test.info().annotations.push({ type: "known-defect", description: `${id}: ${description}` });
};

async function fillServiceInquiry(contact: ContactPage) {
  await contact.fillDetails({ ...applicant, country });
  await contact.field(en.service).selectOption(service);
  await contact.field(en.fix).fill(serviceMessage);
}

async function fillProjectInquiry(contact: ContactPage) {
  await contact.chooseRoute("project");
  await contact.fillDetails({ ...applicant, country });
  await contact.field(en.projectType).selectOption(en.projectTypeOptions[0]);
  await contact.form.getByRole("button", { name: en.timelineOptions[0], exact: true }).click();
  await contact.field(en.build).fill("A customer portal integrated with our CRM.");
}

test.describe("contact form — route selection", () => {
  test("defaults to the service route", async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto();
    await expect(contact.routeCard("service")).toHaveAttribute("aria-pressed", "true");
    await expect(contact.field(en.service)).toBeVisible();
  });

  test("preselects the route from ?route=", async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto("?route=project");
    await expect(contact.routeCard("project")).toHaveAttribute("aria-pressed", "true");
    await expect(contact.field(en.projectType)).toBeVisible();
  });

  test("falls back to the service route for an unknown ?route=", async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto("?route=bogus");
    await expect(contact.routeCard("service")).toHaveAttribute("aria-pressed", "true");
  });

  test("swaps the route-specific fields when another card is chosen", async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto();
    await contact.chooseRoute("careers");
    await expect(contact.routeCard("careers")).toHaveAttribute("aria-pressed", "true");
    await expect(contact.routeCard("service")).toHaveAttribute("aria-pressed", "false");
    await expect(contact.field(en.roleInterest)).toBeVisible();
    await expect(contact.field(en.service)).toHaveCount(0);
    await expect(contact.submitButton("careers")).toBeVisible();
  });
});

/** Focus and blur each field so the form marks it as touched. */
async function touch(contact: ContactPage, labels: string[]) {
  for (const label of labels) {
    await contact.field(label).focus();
    await contact.field(label).blur();
  }
}

test.describe("contact form — client validation", () => {
  test("[D-8] the first submit of an untouched, empty form is blocked", async ({ page }) => {
    knownDefect(
      "D-8",
      "handleSubmit reads `invalid` from the render before touched is set, so the first submit skips validation and sends empty fields",
    );
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto();

    await contact.submitButton("service").click();
    // Pin today's defective behaviour exactly, so any other change fails red.
    expect(await api.fetchCalls()).toBe(1);

    test.fail(); // from here on: the defect itself
    expect(await api.fetchCalls()).toBe(0);
  });

  test("service route: touched empty fields show every required error and block submit", async ({
    page,
  }) => {
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto();
    await touch(contact, [en.name, en.organisation, en.workEmail, en.country, en.service, en.fix]);

    await contact.submitButton("service").click();

    for (const key of ["name", "email", "organisation", "country", "service", "message"] as const) {
      await expect(contact.error(en.errors[key])).toBeVisible();
    }
    expect(await api.fetchCalls()).toBe(0);
  });

  test("project route requires project type and timeline (blocked on resubmit)", async ({
    page,
  }) => {
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.rateLimited()));
    await contact.goto("?route=project");

    // Timeline is a button group and cannot be "touched" without choosing a
    // value, so the first (unvalidated, see D-8) attempt marks every field.
    await contact.submitButton("project").click();
    await expect(contact.error(en.errors.projectType)).toBeVisible();
    await expect(contact.error(en.errors.timeline)).toBeVisible();

    const before = await api.fetchCalls();
    await contact.submitButton("project").click();
    expect(await api.fetchCalls()).toBe(before);
  });

  test("careers route only requires name, email and role", async ({ page }) => {
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto("?route=careers");
    await touch(contact, [en.name, en.organisation, en.workEmail, en.country, en.roleInterest]);

    await contact.submitButton("careers").click();

    await expect(contact.error(en.errors.name)).toBeVisible();
    await expect(contact.error(en.errors.email)).toBeVisible();
    await expect(contact.error(en.errors.role)).toBeVisible();
    await expect(contact.error(en.errors.organisation)).toHaveCount(0);
    await expect(contact.error(en.errors.country)).toHaveCount(0);
    await expect(contact.error(en.errors.message)).toHaveCount(0);
    expect(await api.fetchCalls()).toBe(0);
  });

  test("validates on blur and clears once the value is valid", async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto();

    await contact.email.fill("not-an-email");
    await contact.email.blur();
    await expect(contact.error(en.errors.email)).toBeVisible();
    await expect(contact.email).toHaveClass(/border-red-400/);

    await contact.email.fill("jane@example.com");
    await expect(contact.error(en.errors.email)).toHaveCount(0);

    await contact.name.fill("J");
    await contact.name.blur();
    await expect(contact.error(en.errors.name)).toBeVisible();

    const message = contact.field(en.fix);
    await message.fill("Too short");
    await message.blur();
    await expect(contact.error(en.errors.message)).toBeVisible();
  });
});

test.describe("contact form — service inquiry submission", () => {
  test("sends the documented GraphQL payload and shows the confirmation", async ({ page }) => {
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto();
    await fillServiceInquiry(contact);

    api.hold();
    await contact.submitButton("service").click();
    const pending = contact.form.getByRole("button", { name: en.submitting });
    await expect(pending).toBeDisabled();
    api.release();

    await expect(contact.successHeading("service")).toBeVisible();
    await expect(page.locator("#enquiry")).toContainText(applicant.email);

    expect(api.requests).toHaveLength(1);
    expect(api.requests[0].query).toContain("submitInquiry(input: $input)");
    expect(api.lastInput()).toEqual({
      action: "service_inquiry",
      name: applicant.name,
      organisation: applicant.organisation,
      workEmail: applicant.email,
      country,
      service,
      message: serviceMessage,
      website: "",
      turnstileToken: "",
    });
  });

  test("treats a honeypot catch (success, entryId 0) as success", async ({ page }) => {
    const contact = new ContactPage(page);
    await mockSubmitInquiry(page, reply.payload(inquiry.stored({ entryId: 0 })));
    await contact.goto();
    await fillServiceInquiry(contact);
    await contact.submitButton("service").click();
    await expect(contact.successHeading("service")).toBeVisible();
  });

  test("'send another' resets the form", async ({ page }) => {
    const contact = new ContactPage(page);
    await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto();
    await fillServiceInquiry(contact);
    await contact.submitButton("service").click();
    await expect(contact.successHeading("service")).toBeVisible();

    await page.getByRole("button", { name: messages.en.ContactPage.success.again }).click();

    await expect(contact.name).toHaveValue("");
    await expect(contact.email).toHaveValue("");
    await expect(contact.error(en.errors.name)).toHaveCount(0);
  });
});

test.describe("contact form — server responses", () => {
  test("maps server field errors to translated copy, never the server message", async ({
    page,
  }) => {
    const contact = new ContactPage(page);
    const serverMessage = "Enter a valid email address.";
    await mockSubmitInquiry(
      page,
      reply.payload(
        inquiry.fieldErrors([
          { field: "workEmail", message: serverMessage },
          { field: "country", message: "This field is required." },
        ]),
      ),
    );
    await contact.goto();
    await fillServiceInquiry(contact);
    await contact.submitButton("service").click();

    await expect(contact.error(en.errors.email)).toBeVisible();
    await expect(contact.error(en.errors.country)).toBeVisible();
    await expect(page.getByText(serverMessage)).toHaveCount(0);
    await expect(contact.successHeading("service")).toHaveCount(0);
    await expect(contact.submitButton("service")).toBeEnabled();
  });

  test("[D-4] the user can resubmit after correcting server field errors", async ({ page }) => {
    knownDefect(
      "D-4",
      "server field errors are never cleared, so the form stays 'invalid' and later submits are swallowed",
    );
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(
      page,
      reply.payload(inquiry.fieldErrors([{ field: "workEmail", message: "Invalid" }])),
      reply.payload(inquiry.stored()),
    );
    await contact.goto();
    await fillServiceInquiry(contact);
    await contact.submitButton("service").click();
    await expect(contact.error(en.errors.email)).toBeVisible();

    await contact.email.fill("jane.smith@example.com");
    await contact.submitButton("service").click();
    // Pin today's defective behaviour exactly, so any other change fails red.
    expect(await api.fetchCalls()).toBe(1);

    test.fail(); // from here on: the defect itself
    await expect.poll(() => api.requests.length, { timeout: 3_000 }).toBe(2);
  });

  const generalFailures = [
    ["rate limit (success:false, no field errors)", reply.payload(inquiry.rateLimited())],
    ["HTTP 500", reply.http(500)],
    ["GraphQL errors", reply.graphqlErrors("Internal server error")],
    ["network failure", reply.networkError()],
  ] as const;

  for (const [label, failure] of generalFailures) {
    test(`shows the general error on ${label} and keeps the form`, async ({ page }) => {
      const contact = new ContactPage(page);
      await mockSubmitInquiry(page, failure);
      await contact.goto();
      await fillServiceInquiry(contact);
      await contact.submitButton("service").click();

      await expect(contact.generalError).toBeVisible();
      await expect(contact.successHeading("service")).toHaveCount(0);
      await expect(contact.submitButton("service")).toBeEnabled();
      await expect(contact.name).toHaveValue(applicant.name);
    });
  }

  test("clears the general error when a retry succeeds", async ({ page }) => {
    const contact = new ContactPage(page);
    await mockSubmitInquiry(page, reply.http(503), reply.payload(inquiry.stored()));
    await contact.goto();
    await fillServiceInquiry(contact);
    await contact.submitButton("service").click();
    await expect(contact.generalError).toBeVisible();

    await contact.submitButton("service").click();
    await expect(contact.successHeading("service")).toBeVisible();
  });
});

test.describe("contact form — project inquiry", () => {
  test("sends a project_inquiry with the shared fields", async ({ page }) => {
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto();
    await fillProjectInquiry(contact);
    await contact.submitButton("project").click();

    await expect(contact.successHeading("project")).toBeVisible();
    expect(api.lastInput()).toMatchObject({
      action: "project_inquiry",
      name: applicant.name,
      organisation: applicant.organisation,
      workEmail: applicant.email,
      country,
      message: "A customer portal integrated with our CRM.",
      website: "",
      turnstileToken: "",
    });
  });

  test("[D-1] sends fixed API keys for projectType and startTimeline", async ({ page }) => {
    knownDefect(
      "D-1",
      "keyForLabel() is called with label/key arrays swapped, so the UI label (e.g. 'New build') is sent instead of the key",
    );
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto();
    await fillProjectInquiry(contact);
    await contact.submitButton("project").click();
    await expect(contact.successHeading("project")).toBeVisible();
    // Pin today's defective behaviour exactly, so any other change fails red.
    expect(api.lastInput()).toMatchObject({
      projectType: en.projectTypeOptions[0],
      startTimeline: en.timelineOptions[0],
    });

    test.fail(); // from here on: the defect itself
    expect(api.lastInput()).toMatchObject({
      projectType: en.projectTypeKeys[0],
      startTimeline: en.timelineKeys[0],
    });
  });
});

test.describe("contact form — vendor route", () => {
  test("validates touched fields, then completes locally without calling the API", async ({
    page,
  }) => {
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto("?route=vendor");
    await touch(contact, [en.name, en.organisation, en.workEmail, en.country, en.vendorCategory]);

    await contact.submitButton("vendor").click();
    await expect(contact.error(en.errors.vendor)).toBeVisible();
    await expect(contact.form).toBeVisible();

    await contact.fillDetails({ ...applicant, country });
    await contact.field(en.vendorCategory).selectOption(en.vendorCategoryOptions[0]);
    await contact.submitButton("vendor").click();

    await expect(contact.form).toHaveCount(0);
    expect(await api.fetchCalls()).toBe(0);
  });

  test("[D-8] an untouched, empty vendor form does not reach the confirmation", async ({
    page,
  }) => {
    knownDefect("D-8", "the first submit skips validation, so an empty vendor form 'succeeds'");
    const contact = new ContactPage(page);
    await contact.goto("?route=vendor");

    await contact.submitButton("vendor").click();
    // Pin today's defective behaviour exactly, so any other change fails red.
    await expect(contact.form).toHaveCount(0);

    test.fail(); // from here on: the defect itself
    await expect(contact.error(en.errors.vendor)).toBeVisible({ timeout: 2_000 });
  });

  test("[D-3] the vendor confirmation shows translated copy", async ({ page, consoleErrors }) => {
    knownDefect("D-3", "success.title.vendor / success.description.vendor are missing from both locales");
    const contact = new ContactPage(page);
    await contact.goto("?route=vendor");
    await contact.fillDetails({ ...applicant, country });
    await contact.field(en.vendorCategory).selectOption(en.vendorCategoryOptions[0]);
    await contact.submitButton("vendor").click();

    // The confirmation panel is the parent of the "send another" button.
    const panel = page
      .getByRole("button", { name: messages.en.ContactPage.success.again })
      .locator("xpath=..");
    const confirmation = panel.locator("h3");
    await expect(confirmation).toBeVisible();
    // Pin today's defective behaviour exactly, so any other change fails red.
    await expect(confirmation).toHaveText("ContactPage.success.title.vendor");

    test.fail(); // from here on: the defect itself
    await expect(confirmation).not.toContainText("ContactPage.");
    expect(consoleErrors.filter((e) => e.includes("MISSING_MESSAGE"))).toEqual([]);
  });
});

test.describe("contact form — spam protection", () => {
  test("ships an off-screen, unfocusable honeypot named 'website'", async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto();
    await expect(contact.honeypot).toHaveCount(1);
    await expect(contact.honeypot).toHaveAttribute("tabindex", "-1");
    await expect(contact.honeypot).toHaveAttribute("autocomplete", "off");
    const box = await contact.honeypot.boundingBox();
    expect(box && box.x + box.width).toBeLessThan(0);
  });

  test("[D-5] forwards a bot-filled honeypot value so the API can discard it", async ({ page }) => {
    knownDefect("D-5", "the form always sends website: '' and never reads the honeypot input");
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored({ entryId: 0 })));
    await contact.goto();
    await fillServiceInquiry(contact);
    await contact.honeypot.fill("https://spam.example", { force: true });
    await contact.submitButton("service").click();
    await expect(contact.successHeading("service")).toBeVisible();
    // Pin today's defective behaviour exactly, so any other change fails red.
    expect(api.lastInput()?.website).toBe("");

    test.fail(); // from here on: the defect itself
    expect(api.lastInput()?.website).toBe("https://spam.example");
  });

  test("Turnstile is inert without a site key: no widget, no script, empty token", async ({
    page,
    blockedRequests,
  }) => {
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto();
    await expect(page.locator("[data-turnstile-placeholder]")).toHaveCount(0);

    await fillServiceInquiry(contact);
    await contact.submitButton("service").click();
    await expect(contact.successHeading("service")).toBeVisible();

    expect(api.lastInput()?.turnstileToken).toBe("");
    expect(blockedRequests.filter((u) => u.includes("challenges.cloudflare.com"))).toEqual([]);
  });
});

test.describe("contact form — Arabic", () => {
  test("shows Arabic validation copy and Arabic copy for server field errors", async ({ page }) => {
    const ar = messages.ar.ContactPage.form;
    const contact = new ContactPage(page, "ar");
    const serverMessage = "Enter a valid email address.";
    await mockSubmitInquiry(
      page,
      reply.payload(inquiry.fieldErrors([{ field: "workEmail", message: serverMessage }])),
    );
    await contact.goto();

    await contact.submitButton("service").click();
    await expect(contact.error(ar.errors.name)).toBeVisible();

    await contact.fillDetails({ ...applicant, country: ar.countries[0] });
    await contact.field(ar.service).selectOption(messages.ar.Solutions.items[0].title);
    await contact.field(ar.fix).fill(serviceMessage);
    await contact.submitButton("service").click();

    await expect(contact.error(ar.errors.email)).toBeVisible();
    await expect(page.getByText(serverMessage)).toHaveCount(0);
    await expect(contact.email).toHaveAttribute("dir", "ltr");
  });
});
