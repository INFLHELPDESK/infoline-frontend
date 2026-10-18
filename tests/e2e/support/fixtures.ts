import { test as base, expect, type Page } from "@playwright/test";
import { isolateNetwork } from "./network";

type Diagnostics = {
  /** URLs of off-origin requests aborted by the network guard. */
  blockedRequests: string[];
  /** Uncaught page errors (a failure unless matched by `knownPageErrors`). */
  pageErrors: Error[];
  /** console.error output, excluding resources the guard aborted. */
  consoleErrors: string[];
};

type Options = {
  /**
   * Page errors tolerated by a describe block, each tied to a known defect.
   * Narrow patterns only: any error that does not match still fails the test.
   */
  knownPageErrors: RegExp[];
};

export const test = base.extend<Diagnostics & Options>({
  knownPageErrors: [[], { option: true }],

  blockedRequests: [
    async ({ context, baseURL }, use) => {
      const { blocked } = await isolateNetwork(context, new URL(baseURL!).origin);
      await use(blocked);
    },
    { auto: true },
  ],

  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        if (/Failed to load resource|ERR_BLOCKED_BY_CLIENT/.test(msg.text())) return;
        errors.push(msg.text());
      });
      await use(errors);
    },
    { auto: true },
  ],

  pageErrors: [
    async ({ page, knownPageErrors }, use) => {
      const errors: Error[] = [];
      page.on("pageerror", (err) => errors.push(err));
      await use(errors);
      const unexpected = errors
        .map((e) => e.message)
        .filter((message) => !knownPageErrors.some((re) => re.test(message)));
      expect(unexpected, "uncaught page errors").toEqual([]);
    },
    { auto: true },
  ],
});

/**
 * Resolve once React has hydrated the element (it carries a fiber), plus two
 * frames so recoverable hydration errors have been reported.
 */
export async function waitForHydration(page: Page, selector = "footer") {
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber$"));
  }, selector);
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}

export { expect };
