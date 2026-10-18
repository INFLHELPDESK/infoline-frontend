import { test, expect } from "../support/fixtures";
import { ContactPage, applicant } from "../support/contact";
import { inquiry, mockSubmitInquiry, reply } from "../support/network";
import { messages } from "../support/messages";

/**
 * Careers applications today: the Careers page has no form of its own (the
 * `Apply` section component exists but is not mounted). Applications go
 * through the contact form's careers route. These tests capture exactly what
 * that route submits (against mocks only) and pin the gap to the backend
 * contract (REST /apply with phone, position and CV) as known defects.
 */

const en = messages.en.ContactPage.form;
const careerMessage = "Five years in contact-centre QA.";
const role = "Quality analyst";

async function fillCareers(contact: ContactPage) {
  await contact.fillDetails({ name: applicant.name, email: applicant.email });
  await contact.field(en.roleInterest).fill(role);
  await contact.field(en.messageOptional).fill(careerMessage);
}

test.describe("careers application", () => {
  test("the Careers page general-application CTA opens the contact page (service route)", async ({
    page,
  }) => {
    const cta = messages.en.CareersPage.cta.button;
    await page.goto("/en/careers");
    const link = page.locator("main").getByRole("link", { name: cta.label });
    await expect(link).toHaveAttribute("href", `/en${cta.href}`);

    await link.click();
    await expect(page).toHaveURL(/\/en\/contact$/);
    // No ?route=careers, so the visitor lands on the default service route.
    await expect(new ContactPage(page).routeCard("service")).toHaveAttribute("aria-pressed", "true");
  });

  test("[D-6] vacancy 'Apply' links resolve to an on-page application target", async ({ page }) => {
    test.info().annotations.push({
      type: "known-defect",
      description: "D-6: vacancy rows link to #apply but the Apply section is not mounted on /careers",
    });
    await page.goto("/en/careers");
    const applyLinks = page.locator('main a[href="#apply"]');
    await expect(applyLinks).toHaveCount(messages.en.CareersPage.vacancies.roles.length);
    // Pin today's defective behaviour exactly, so any other change fails red.
    await expect(page.locator("#apply")).toHaveCount(0);

    test.fail(); // from here on: the defect itself
    await expect(page.locator("#apply")).toHaveCount(1, { timeout: 1_000 });
  });

  test("the contact form's careers route is reachable by deep link", async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto("?route=careers");
    await expect(contact.routeCard("careers")).toHaveAttribute("aria-pressed", "true");
    await expect(contact.field(en.roleInterest)).toBeVisible();
  });

  test("current behaviour: submits a GraphQL project_inquiry without the role (pinned)", async ({
    page,
  }) => {
    test.info().annotations.push({
      type: "known-defect",
      description:
        "D-2: pins today's payload. Update deliberately when the careers flow is moved to REST /apply.",
    });
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto("?route=careers");
    await fillCareers(contact);
    await contact.submitButton("careers").click();

    await expect(contact.successHeading("careers")).toBeVisible();
    expect(api.requests).toHaveLength(1);
    expect(api.lastInput()).toEqual({
      action: "project_inquiry",
      name: applicant.name,
      organisation: "",
      workEmail: applicant.email,
      country: "",
      projectType: "",
      startTimeline: "",
      message: careerMessage,
      website: "",
      turnstileToken: "",
    });
  });

  test("[D-2] submits the applicant's role of interest", async ({ page }) => {
    test.info().annotations.push({
      type: "known-defect",
      description: "D-2: the role field is validated but never sent; the request is a project_inquiry",
    });
    const contact = new ContactPage(page);
    const api = await mockSubmitInquiry(page, reply.payload(inquiry.stored()));
    await contact.goto("?route=careers");
    await fillCareers(contact);
    await contact.submitButton("careers").click();
    await expect(contact.successHeading("careers")).toBeVisible();
    // Pin today's defective behaviour exactly, so any other change fails red.
    expect(api.requests).toHaveLength(1);
    expect(api.lastInput()?.action).toBe("project_inquiry");
    expect(JSON.stringify(api.lastInput())).not.toContain(role);

    test.fail(); // from here on: the defect itself
    expect(JSON.stringify(api.lastInput())).toContain(role);
    expect(api.lastInput()?.action).not.toBe("project_inquiry");
  });

  test("shows the general error when the submission fails", async ({ page }) => {
    const contact = new ContactPage(page);
    await mockSubmitInquiry(page, reply.payload(inquiry.rateLimited()));
    await contact.goto("?route=careers");
    await fillCareers(contact);
    await contact.submitButton("careers").click();
    await expect(contact.generalError).toBeVisible();
  });
});
