import { test, expect } from "../support/fixtures";
import { locales } from "../support/messages";

/**
 * The shared CMS stub (tests/support/cms-stub, started by playwright.config)
 * is the only CMS the suite can reach. No public page is wired to WordPress
 * yet, so it must stay silent while the real production build serves pages.
 * Read-only on purpose: tests run in parallel, and anything that issued a
 * GraphQL request would (correctly) trip the teardown tripwire.
 */

const endpoint = new URL(process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT!);

test.describe("local CMS stub", () => {
  test("is up on the configured loopback origin", async ({ request }) => {
    expect(["127.0.0.1", "localhost", "[::1]"]).toContain(endpoint.hostname);
    const health = await request.get(`${endpoint.origin}/__health`);
    expect(health.ok()).toBe(true);
    expect(await health.text()).toBe("ok");
  });

  test("answers CORS preflight like the browser expects", async ({ request }) => {
    const res = await request.fetch(endpoint.href, { method: "OPTIONS" });
    expect(res.status()).toBe(204);
    expect(res.headers()["access-control-allow-origin"]).toBe("*");
  });

  for (const locale of locales) {
    test(`server rendering /${locale} pages makes no CMS request`, async ({ page, request }) => {
      for (const path of ["", "/solutions", "/industries", "/careers", "/blog"]) {
        const response = await page.goto(`/${locale}${path}`);
        expect(response?.status()).toBe(200);
      }
      const log = await (await request.get(`${endpoint.origin}/__requests`)).json();
      expect(log).toEqual([]);
    });
  }
});
