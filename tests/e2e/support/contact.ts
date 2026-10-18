import type { Locator, Page } from "@playwright/test";
import { waitForHydration } from "./fixtures";
import { messages, type Locale } from "./messages";

export type RouteId = "service" | "project" | "vendor" | "careers";

const ROUTE_KEYS: Record<RouteId, "routeA" | "routeB" | "routeC" | "routeD"> = {
  service: "routeA",
  project: "routeB",
  vendor: "routeC",
  careers: "routeD",
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Page object for the adaptive contact form (components/sections/contact). */
export class ContactPage {
  readonly copy;
  readonly form: Locator;

  constructor(
    readonly page: Page,
    readonly locale: Locale = "en",
  ) {
    this.copy = messages[locale].ContactPage;
    this.form = page.locator("#enquiry form");
  }

  async goto(query = "") {
    await this.page.goto(`/${this.locale}/contact${query}`);
    await waitForHydration(this.page, "#enquiry form");
  }

  routeCard(route: RouteId) {
    const title = this.copy.routes[ROUTE_KEYS[route]].title;
    return this.page.getByRole("button", { name: new RegExp(escape(title)) });
  }

  async chooseRoute(route: RouteId) {
    await this.routeCard(route).click();
  }

  field(label: string) {
    return this.form.getByLabel(label, { exact: true });
  }

  get name() {
    return this.field(this.copy.form.name);
  }
  get organisation() {
    return this.field(this.copy.form.organisation);
  }
  get email() {
    return this.field(this.copy.form.workEmail);
  }
  get country() {
    return this.field(this.copy.form.country);
  }
  get honeypot() {
    return this.form.locator('input[name="website"]');
  }

  submitButton(route: RouteId) {
    const f = this.copy.form;
    const label = { service: f.sendService, project: f.sendProject, vendor: f.sendProject, careers: f.sendCareers }[route];
    return this.form.getByRole("button", { name: label, exact: true });
  }

  /** Inline alert for a field-level error message. */
  error(text: string) {
    return this.form.getByRole("alert").filter({ hasText: text });
  }

  get generalError() {
    return this.error(this.copy.form.submitError);
  }

  successHeading(route: RouteId) {
    const title = (this.copy.success.title as Record<string, string>)[route];
    return this.page.locator("#enquiry h3", { hasText: title });
  }

  async fillDetails(values: { name: string; organisation?: string; email: string; country?: string }) {
    await this.name.fill(values.name);
    if (values.organisation !== undefined) await this.organisation.fill(values.organisation);
    await this.email.fill(values.email);
    if (values.country !== undefined) await this.country.selectOption(values.country);
  }
}

export const applicant = {
  name: "Jane Smith",
  organisation: "Example Org",
  email: "jane@example.com",
};
