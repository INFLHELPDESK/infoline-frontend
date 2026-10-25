import type { Page } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { ContactPage, applicant } from "../support/contact";
import { inquiry, mockApply, mockSubmitInquiry, reply } from "../support/network";
import { messages } from "../support/messages";

/**
 * Careers applications: the Careers page hosts the on-page application form
 * (`#apply`), which posts multipart to REST /apply with the CV. Everything
 * runs against mocks. The contact form's careers route is pinned separately.
 */

const en = messages.en.ContactPage.form;
const careerMessage = "Five years in contact-centre QA.";
const role = "Quality analyst";

async function fillCareers(contact: ContactPage) {
  await contact.fillDetails({ name: applicant.name, email: applicant.email });
  await contact.field(en.roleInterest).fill(role);
  await contact.field(en.messageOptional).fill(careerMessage);
}

const a = messages.en.CareersPage.apply.form;
const ar = messages.ar.CareersPage.apply.form;
const roles = messages.en.CareersPage.vacancies.roles;
const cv = { name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") };
const successTitle = messages.en.CareersPage.apply.success.title;

function apply(page: Page, form: typeof a = a) {
  const root = page.locator("#apply form");
  return {
    root,
    field: (label: string) => root.getByLabel(label, { exact: true }),
    submit: root.getByRole("button", { name: form.submit, exact: true }),
    error: (text: string) => root.getByRole("alert").filter({ hasText: text }),
    generalError: root.getByRole("alert").filter({ hasText: form.submitError }),
  };
}

async function openApply(page: Page, path = "/en/careers") {
  await page.goto(path);
  await waitForHydration(page, "#apply form");
  return apply(page);
}

async function fillApplication(page: Page, file: typeof cv = cv) {
  const f = apply(page);
  await f.field(a.name).fill(applicant.name);
  await f.field(a.email).fill(applicant.email);
  await f.field(a.phone).fill("+968 9000 0000");
  await f.field(a.position).selectOption(roles[0].title);
  await f.field(a.message).fill(careerMessage);
  await f.field(a.cv).setInputFiles(file);
  return f;
}

test.describe("careers page", () => {
  test("the general-application CTA opens the contact page (service route)", async ({ page }) => {
    const cta = messages.en.CareersPage.cta.button;
    await page.goto("/en/careers");
    const link = page.locator("main").getByRole("link", { name: cta.label });
    await expect(link).toHaveAttribute("href", `/en${cta.href}`);

    await link.click();
    await expect(page).toHaveURL(/\/en\/contact$/);
    await expect(new ContactPage(page).routeCard("service")).toHaveAttribute("aria-pressed", "true");
  });

  test("[D-6] vacancy 'Apply' links open the on-page application with the role preselected", async ({
    page,
  }) => {
    await page.goto("/en/careers");
    const applyLinks = page.locator('main a[href$="#apply"]');
    await expect(applyLinks).toHaveCount(roles.length);
    await expect(page.locator("#apply")).toHaveCount(1);

    await applyLinks.nth(1).click();
    await expect(page.locator("#apply form")).toBeVisible();
    await expect(apply(page).field(a.position)).toHaveValue(roles[1].title);
  });
});

test.describe("contact form — careers route", () => {
  test("is reachable by deep link", async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto("?route=careers");
    await expect(contact.routeCard("careers")).toHaveAttribute("aria-pressed", "true");
    await expect(contact.field(en.roleInterest)).toBeVisible();
  });

  test("still submits a GraphQL project_inquiry (pinned: it has no phone or CV for REST /apply)", async ({
    page,
  }) => {
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto("?route=careers");
    await fillCareers(contact);
    await contact.submitButton("careers").click();

    await expect(contact.successHeading("careers")).toBeVisible();
    expect(api.requests).toHaveLength(1);
    expect(api.lastInput()?.action).toBe("project_inquiry");
  });
});

test.describe("careers application — REST /apply", () => {
  test("[D-2] sends a multipart application with the role as position and the CV", async ({
    page,
  }) => {
    const api = await mockApply(page, reply.payload(inquiry.stored()));
    await openApply(page);
    const f = await fillApplication(page);

    api.hold();
    await f.submit.click();
    await expect(f.root.getByRole("button", { name: a.submitting })).toBeDisabled();
    api.release();

    await expect(page.locator("#apply h3", { hasText: successTitle })).toBeVisible();
    expect(api.requests).toHaveLength(1);
    expect(api.last()?.contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(api.last()?.fields).toEqual({
      name: applicant.name,
      email: applicant.email,
      phone: "+968 9000 0000",
      position: roles[0].title,
      message: careerMessage,
      website: "",
      turnstileToken: "",
    });
    expect(api.last()?.files).toEqual({ cv: "cv.pdf" });
  });

  test("an empty submit shows every required error and sends nothing", async ({ page }) => {
    const api = await mockApply(page, reply.payload(inquiry.stored()));
    const f = await openApply(page);
    await f.submit.click();

    for (const key of ["name", "email", "phone", "position", "cv"] as const) {
      await expect(f.error(a.errors[key])).toBeVisible();
    }
    expect(api.requests).toHaveLength(0);
  });

  test("rejects a CV that is not PDF, DOC or DOCX", async ({ page }) => {
    const api = await mockApply(page, reply.payload(inquiry.stored()));
    await openApply(page);
    const f = await fillApplication(page, {
      name: "photo.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("x"),
    });
    await f.submit.click();
    await expect(f.error(a.errors.cvType)).toBeVisible();
    expect(api.requests).toHaveLength(0);
  });

  test("rejects a CV over 5 MB", async ({ page }) => {
    const api = await mockApply(page, reply.payload(inquiry.stored()));
    await openApply(page);
    const f = await fillApplication(page, { ...cv, buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
    await f.submit.click();
    await expect(f.error(a.errors.cvSize)).toBeVisible();
    expect(api.requests).toHaveLength(0);
  });

  test("maps server field errors to translated copy and allows a corrected resubmit", async ({
    page,
  }) => {
    const serverMessage = "A CV is required.";
    const api = await mockApply(
      page,
      reply.payload(inquiry.fieldErrors([{ field: "cv", message: serverMessage }])),
      reply.payload(inquiry.stored()),
    );
    await openApply(page);
    const f = await fillApplication(page);
    await f.submit.click();

    await expect(f.error(a.errors.cv)).toBeVisible();
    await expect(page.getByText(serverMessage)).toHaveCount(0);

    await f.field(a.cv).setInputFiles({ ...cv, name: "cv.docx" });
    await expect(f.error(a.errors.cv)).toHaveCount(0);
    await f.submit.click();
    await expect(page.locator("#apply h3", { hasText: successTitle })).toBeVisible();
    expect(api.requests).toHaveLength(2);
  });

  const failures = [
    ["rate limit (422, no field errors)", reply.payload(inquiry.rateLimited())],
    ["HTTP 500", reply.http(500)],
    ["network failure", reply.networkError()],
  ] as const;

  for (const [label, failure] of failures) {
    test(`shows the general error on ${label} and keeps the form`, async ({ page }) => {
      await mockApply(page, failure);
      await openApply(page);
      const f = await fillApplication(page);
      await f.submit.click();
      await expect(f.generalError).toBeVisible();
      await expect(f.submit).toBeEnabled();
      await expect(f.field(a.name)).toHaveValue(applicant.name);
    });
  }

  test("a double click sends a single request", async ({ page }) => {
    const api = await mockApply(page, reply.payload(inquiry.stored()));
    await openApply(page);
    const f = await fillApplication(page);
    api.hold();
    await f.submit.dblclick();
    api.release();
    await expect(page.locator("#apply h3", { hasText: successTitle })).toBeVisible();
    expect(api.requests).toHaveLength(1);
  });

  test("forwards a bot-filled honeypot value", async ({ page }) => {
    const api = await mockApply(page, reply.payload(inquiry.stored({ entryId: 0 })));
    await openApply(page);
    const f = await fillApplication(page);
    await f.root.locator('input[name="website"]').fill("https://spam.example", { force: true });
    await f.submit.click();
    await expect(page.locator("#apply h3", { hasText: successTitle })).toBeVisible();
    expect(api.last()?.fields.website).toBe("https://spam.example");
  });

  test("shows Arabic validation copy in RTL", async ({ page }) => {
    await mockApply(page, reply.payload(inquiry.stored()));
    await openApply(page, "/ar/careers");
    const f = apply(page, ar);
    await f.submit.click();
    await expect(f.error(ar.errors.name)).toBeVisible();
    await expect(f.error(ar.errors.cv)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
