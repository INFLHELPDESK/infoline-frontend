import type { BrowserContext, Page, Request, Route } from "@playwright/test";

/**
 * Network isolation for E2E tests.
 *
 * Every request that leaves the app's own origin is aborted unless a test
 * registers a mock for it. Playwright evaluates routes in reverse
 * registration order, so mocks added inside a test win over this guard.
 * Nothing in the suite can reach the production CMS, Turnstile or any other
 * third party, even if a mock is forgotten.
 */
export async function isolateNetwork(context: BrowserContext, appOrigin: string) {
  const blocked: string[] = [];
  await context.route(
    (url) => url.origin !== appOrigin,
    (route) => {
      blocked.push(route.request().url());
      return route.abort("blockedbyclient");
    },
  );
  // Decorative background video (About hero, 1.7 MB, preload="auto"). Under
  // parallel workers `next start` takes ~20s to stream it, which delays the
  // `load` event past the test timeout. No test asserts on video playback.
  await context.route(/\.(webm|mp4)$/, (route) => route.abort("blockedbyclient"));
  return { blocked };
}

/** The forms endpoint compiled into the build (see lib/forms). */
export const GRAPHQL_URL = /\/graphql(\?.*)?$/;

export type InquiryPayload = {
  success: boolean;
  message: string;
  entryId: number;
  emailSent: boolean;
  validationErrors: { field: string; message: string }[];
};

export const inquiry = {
  stored: (overrides: Partial<InquiryPayload> = {}): InquiryPayload => ({
    success: true,
    message: "Thanks, we received your inquiry.",
    entryId: 101,
    emailSent: true,
    validationErrors: [],
    ...overrides,
  }),
  fieldErrors: (errors: InquiryPayload["validationErrors"]): InquiryPayload => ({
    success: false,
    message: "Please correct the highlighted fields.",
    entryId: 0,
    emailSent: false,
    validationErrors: errors,
  }),
  rateLimited: (): InquiryPayload => ({
    success: false,
    message: "Too many submissions. Please wait a few minutes.",
    entryId: 0,
    emailSent: false,
    validationErrors: [],
  }),
};

type Reply =
  | { kind: "payload"; payload: InquiryPayload }
  | { kind: "graphqlErrors"; messages: string[] }
  | { kind: "http"; status: number }
  | { kind: "networkError" };

export type CapturedInquiry = {
  query: string;
  variables: { input: Record<string, unknown> };
};

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

/**
 * Mock the WPGraphQL `submitInquiry` mutation. Replies are consumed in order;
 * the last one repeats. Returns the captured request bodies, and lets a test
 * hold the response (`hold()` -> `release()`) to observe pending UI.
 */
export async function mockSubmitInquiry(page: Page, ...replies: Reply[]) {
  const requests: CapturedInquiry[] = [];
  let gate: Promise<void> | null = null;
  let open: () => void = () => {};

  // Count GraphQL fetch() calls in the page itself. The submit handler calls
  // fetch synchronously, so once `click()` resolves the count is final —
  // "no request was made" can be asserted without waiting for a timeout.
  await page.addInitScript(() => {
    const w = window as unknown as { __graphqlFetches: number };
    w.__graphqlFetches = 0;
    const original = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (/\/graphql(\?|$)/.test(url)) w.__graphqlFetches++;
      return original.call(this, input, init);
    };
  });

  await page.route(GRAPHQL_URL, async (route: Route, request: Request) => {
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS });
    }
    requests.push(request.postDataJSON() as CapturedInquiry);
    const reply = replies[Math.min(requests.length - 1, replies.length - 1)];
    if (gate) await gate;

    switch (reply.kind) {
      case "networkError":
        return route.abort("connectionrefused");
      case "http":
        return route.fulfill({ status: reply.status, headers: CORS, body: "" });
      case "graphqlErrors":
        return route.fulfill({
          headers: CORS,
          json: { errors: reply.messages.map((message) => ({ message })) },
        });
      case "payload":
        return route.fulfill({ headers: CORS, json: { data: { submitInquiry: reply.payload } } });
    }
  });

  return {
    requests,
    /** Latest captured `input` variables. */
    lastInput: () => requests.at(-1)?.variables.input,
    /** GraphQL fetch() calls the page has started (synchronous, see above). */
    fetchCalls: () =>
      page.evaluate(() => (window as unknown as { __graphqlFetches: number }).__graphqlFetches),
    hold() {
      gate = new Promise<void>((resolve) => (open = resolve));
    },
    release() {
      open();
      gate = null;
    },
  };
}

export const reply = {
  payload: (payload: InquiryPayload): Reply => ({ kind: "payload", payload }),
  graphqlErrors: (...messages: string[]): Reply => ({ kind: "graphqlErrors", messages }),
  http: (status: number): Reply => ({ kind: "http", status }),
  networkError: (): Reply => ({ kind: "networkError" }),
};
