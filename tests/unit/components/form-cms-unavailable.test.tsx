// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
import Apply from "@/components/sections/careers/apply";
import Form from "@/components/sections/contact/form";
import { RouteProvider } from "@/components/sections/contact/route-context";

const submitInquiry = vi.fn();
const submitApplication = vi.fn();

vi.mock("@/lib/forms", () => ({
  submitInquiry: (...args: unknown[]) => submitInquiry(...args),
  submitApplication: (...args: unknown[]) => submitApplication(...args),
  classifyInquiryResult: (r: { success: boolean }) => (r.success ? "success" : "error"),
  CHOICE: {},
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/components/ui/motion", () => {
  const Box = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  );
  return { Reveal: Box, Stagger: Box, StaggerItem: Box };
});

const ENDPOINT = "http://127.0.0.1:3199/graphql";
const locales = { en, ar } as const;

function renderIn(locale: "en" | "ar", ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale={locale} messages={locales[locale]}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const contact = () => (
  <RouteProvider>
    <Form services={[{ title: "Contact Centre" }]} />
  </RouteProvider>
);

function submitButton() {
  return document.querySelector<HTMLButtonElement>('form button[type="submit"]')!;
}

beforeEach(() => {
  submitInquiry.mockReset();
  submitApplication.mockReset();
});
afterEach(cleanup);

describe.each(["en", "ar"] as const)("forms without a CMS endpoint (%s)", (locale) => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT", ""));

  it("Contact: stays visible, submit is disabled, and a status message explains why", () => {
    renderIn(locale, contact());
    const message = locales[locale].ContactPage.form.unavailable;
    expect(screen.getByRole("status").textContent).toBe(message);
    expect(submitButton().disabled).toBe(true);
  });

  it("Contact: a forced form submit never reaches the API client", () => {
    renderIn(locale, contact());
    fireEvent.submit(submitButton().closest("form")!);
    expect(submitInquiry).not.toHaveBeenCalled();
  });

  it("Careers: stays visible, submit is disabled, and a status message explains why", () => {
    renderIn(locale, <Apply />);
    const message = locales[locale].CareersPage.apply.form.unavailable;
    expect(screen.getByRole("status").textContent).toBe(message);
    expect(submitButton().disabled).toBe(true);
  });

  it("Careers: a forced form submit never reaches the API client", () => {
    renderIn(locale, <Apply />);
    fireEvent.submit(submitButton().closest("form")!);
    expect(submitApplication).not.toHaveBeenCalled();
  });
});

describe("forms with a CMS endpoint", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT", ENDPOINT));

  it("Contact: no unavailable message and the submit button is enabled", () => {
    renderIn("en", contact());
    expect(screen.queryByRole("status")).toBeNull();
    expect(submitButton().disabled).toBe(false);
  });

  it("Contact: a valid submission still calls the API client (mocked)", async () => {
    submitInquiry.mockResolvedValue({ success: true, validationErrors: [] });
    renderIn("en", contact());
    const form = en.ContactPage.form;
    fireEvent.change(screen.getByLabelText(form.name), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(form.organisation), { target: { value: "Test Org" } });
    fireEvent.change(screen.getByLabelText(form.workEmail), { target: { value: "test@example.com" } });
    const service = screen.getByLabelText(form.service);
    fireEvent.change(service, { target: { value: "Contact Centre" } });
    fireEvent.change(document.querySelector("form textarea")!, {
      target: { value: "We need a managed contact centre for a national rollout." },
    });
    fireEvent.submit(submitButton().closest("form")!);
    await waitFor(() => expect(submitInquiry).toHaveBeenCalledTimes(1));
  });

  it("Careers: no unavailable message and the submit button is enabled", () => {
    renderIn("en", <Apply />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(submitButton().disabled).toBe(false);
  });

  it("Careers: validation still runs and a valid application calls the API client (mocked)", async () => {
    submitApplication.mockResolvedValue({ success: true, validationErrors: [] });
    renderIn("en", <Apply />);
    fireEvent.submit(submitButton().closest("form")!);
    expect(submitApplication).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);

    const text = (type: string) => document.querySelector<HTMLInputElement>(`form input[type=${type}]`)!;
    const nameInput = document.querySelector<HTMLInputElement>('form input[autocomplete="name"]')!;
    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(text("email"), { target: { value: "test@example.com" } });
    fireEvent.change(text("tel"), { target: { value: "+968 1234 5678" } });
    const select = document.querySelector<HTMLSelectElement>("form select")!;
    fireEvent.change(select, { target: { value: select.options[1].value } });
    const cv = new File(["cv"], "cv.pdf", { type: "application/pdf" });
    fireEvent.change(text("file"), { target: { files: [cv] } });
    fireEvent.submit(submitButton().closest("form")!);
    await waitFor(() => expect(submitApplication).toHaveBeenCalledTimes(1));
  });
});

describe("locale parity", () => {
  it("both forms have a non-empty unavailable message in EN and AR", () => {
    for (const l of [en, ar]) {
      expect(l.ContactPage.form.unavailable.length).toBeGreaterThan(0);
      expect(l.CareersPage.apply.form.unavailable.length).toBeGreaterThan(0);
    }
  });
});
