import { beforeEach, describe, expect, it, vi } from "vitest";

type FormsModule = typeof import("@/lib/forms");
type Result = Parameters<FormsModule["classifyInquiryResult"]>[0];

const DEFAULT_ENDPOINT = "https://green-tarsier-764009.hostingersite.com/graphql";

const result = (overrides: Partial<Result> = {}): Result => ({
  success: true,
  message: "",
  entryId: 42,
  emailSent: true,
  validationErrors: [],
  ...overrides,
});

/** Fresh module per test: the endpoint is read from env at import time. */
async function loadForms(endpoint?: string): Promise<FormsModule> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT", endpoint);
  return import("@/lib/forms");
}

function stubFetch(response: { ok?: boolean; status?: number; body?: unknown }) {
  const fetchMock = vi.fn(async () => ({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.body,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const input = {
  action: "service_inquiry" as const,
  name: "Jane Smith",
  organisation: "Example Org",
  workEmail: "jane@example.com",
  country: "Oman",
  service: "Contact Centre Outsourcing",
  message: "Two or three sentences on the operation.",
  website: "",
  turnstileToken: "",
};

describe("classifyInquiryResult", () => {
  let forms: FormsModule;
  beforeEach(async () => {
    forms = await loadForms();
  });

  it.each<[string, Partial<Result>, string]>([
    ["stored submission", { success: true, entryId: 42 }, "success"],
    // Honeypot hit: API reports success with entryId 0 — must look like success.
    ["honeypot catch (entryId 0)", { success: true, entryId: 0 }, "success"],
    [
      "field validation errors",
      {
        success: false,
        entryId: 0,
        validationErrors: [{ field: "workEmail", message: "Enter a valid email address." }],
      },
      "field_errors",
    ],
    ["rate limit / server error", { success: false, entryId: 0, message: "Too many requests" }, "general_error"],
    // Not described by the handover; current behaviour treats it as an error.
    [
      "success flag with field errors",
      { success: true, validationErrors: [{ field: "country", message: "Required" }] },
      "general_error",
    ],
  ])("classifies %s", (_label, overrides, expected) => {
    expect(forms.classifyInquiryResult(result(overrides))).toBe(expected);
  });
});

describe("submitInquiry", () => {
  it("POSTs the SubmitInquiry mutation with the input as variables to the default endpoint", async () => {
    const forms = await loadForms();
    const fetchMock = stubFetch({ body: { data: { submitInquiry: result() } } });

    await forms.submitInquiry(input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(DEFAULT_ENDPOINT);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    const body = JSON.parse(init.body as string);
    expect(body.variables).toEqual({ input });
    expect(body.query).toMatch(/mutation SubmitInquiry\(\$input: SubmitInquiryInput!\)/);
    expect(body.query).toMatch(/validationErrors\s*\{\s*field\s+message\s*\}/);
  });

  it("uses NEXT_PUBLIC_WPGRAPHQL_ENDPOINT when set", async () => {
    const forms = await loadForms("https://cms.test/graphql");
    const fetchMock = stubFetch({ body: { data: { submitInquiry: result() } } });

    await forms.submitInquiry(input);

    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe("https://cms.test/graphql");
  });

  it("forwards the abort signal", async () => {
    const forms = await loadForms();
    const fetchMock = stubFetch({ body: { data: { submitInquiry: result() } } });
    const controller = new AbortController();

    await forms.submitInquiry(input, { signal: controller.signal });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });

  it("returns the payload and normalises a null validationErrors to []", async () => {
    const forms = await loadForms();
    stubFetch({
      body: { data: { submitInquiry: { ...result(), validationErrors: null } } },
    });

    await expect(forms.submitInquiry(input)).resolves.toEqual(result());
  });

  it("throws on a non-2xx HTTP status", async () => {
    const forms = await loadForms();
    stubFetch({ ok: false, status: 503, body: {} });

    await expect(forms.submitInquiry(input)).rejects.toThrow(
      "Inquiry request failed: HTTP 503",
    );
  });

  it("throws with joined messages on GraphQL errors", async () => {
    const forms = await loadForms();
    stubFetch({ body: { errors: [{ message: "First" }, { message: "Second" }] } });

    await expect(forms.submitInquiry(input)).rejects.toThrow("First · Second");
  });

  it("throws when the response has no submitInquiry payload", async () => {
    const forms = await loadForms();
    stubFetch({ body: { data: {} } });

    await expect(forms.submitInquiry(input)).rejects.toThrow(
      "Inquiry API returned no payload",
    );
  });
});
