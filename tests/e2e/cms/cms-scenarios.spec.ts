import { spawn, type ChildProcess } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { test, expect, waitForHydration } from "../support/fixtures";
import { dehydratedQueries, formatsSection, NON_CARD_FIELDS, payloadHasKey } from "../support/insights";
import { h1Text, robotsMeta } from "../support/html";
import { dirFor, locales, messages } from "../support/messages";

/**
 * Real Next.js server rendering of /[locale]/insights against every CMS stub
 * scenario.
 *
 * Server-side CMS fetches go through the Next data cache (revalidate 300s), in
 * memory and on disk under `.next/cache/fetch-cache`, so one long-lived server
 * cannot see a scenario change. Each scenario therefore gets its own
 * `next start` process on a separate port, started after the disk cache is
 * deleted. Every scenario asserts that its first request really reached the
 * stub, which proves it was served fresh and not from a stale cache entry.
 *
 * The scenario project runs after the rest of the suite (playwright.config)
 * because it changes the shared stub's global scenario. It uses the same
 * production build and the same loopback endpoint; production caching
 * behavior is not altered anywhere.
 */

const PORT = Number(process.env.E2E_SCENARIO_PORT ?? 3200);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const stubOrigin = new URL(process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT!).origin;

test.use({ baseURL: ORIGIN });
test.setTimeout(90_000);

const SEASONAL = { en: "How to staff a seasonal peak", ar: "كيف تُجهّز فريقك لموسم الذروة" };
const LANGUAGE = { en: "EN", ar: "AR" } as const;

type StubEntry = {
  kind: string;
  operation?: string;
  variables?: { language?: string; first?: number; id?: string };
  scenario?: string;
};

/** The route shows 3 cards, so it must ask for 3 (see lib/insights-feed). */
const CARDS = 3;

async function stubAdmin(path: string, body?: unknown) {
  const res = await fetch(`${stubOrigin}${path}`, {
    method: body === undefined ? "GET" : "POST",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`stub ${path} -> ${res.status}`);
  return res.json();
}
const stubOps = async (operation: string) =>
  ((await stubAdmin("/__requests")) as StubEntry[]).filter((r) => r.kind === "graphql" && r.operation === operation);
const stubPosts = async () =>
  ((await stubAdmin("/__requests")) as StubEntry[]).filter((r) => r.kind === "graphql" && r.operation === "Posts");

async function useScenario(name: string) {
  await stubAdmin("/__reset", {});
  await stubAdmin("/__scenario", { scenario: name });
}

let server: ChildProcess | undefined;

async function startServer() {
  // A cold data cache: nothing from an earlier scenario, run or the main server.
  rmSync(join(process.cwd(), ".next", "cache", "fetch-cache"), { recursive: true, force: true });
  const next = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [next, "start", "-p", String(PORT), "-H", "127.0.0.1"], {
    env: { ...process.env, CMS_ISOLATED: "1" },
    stdio: "ignore",
  });
  server = child;
  const deadline = Date.now() + 60_000;
  for (;;) {
    if (child.exitCode !== null) throw new Error("scenario server exited early");
    try {
      if ((await fetch(`${ORIGIN}/en`)).ok) break;
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) throw new Error("scenario server did not start");
    await new Promise((r) => setTimeout(r, 250));
  }
}

async function stopServer() {
  const child = server;
  server = undefined;
  if (!child || child.exitCode !== null) return;
  await new Promise<void>((done) => {
    child.once("exit", () => done());
    child.kill();
  });
}

/**
 * The last scenario's responses (an empty answer is a cacheable 200) stay in
 * the on-disk Next data cache and would be served to the next run's main
 * server. Leave nothing behind.
 */
test.afterAll(() => {
  rmSync(join(process.cwd(), ".next", "cache", "fetch-cache"), { recursive: true, force: true });
});

/**
 * Every scenario: own server, cold cache, stub on that scenario. `startServer`
 * hits /en once for readiness, which is a different route from /insights, so
 * it never touches the CMS.
 */
function scenarioSuite(
  name: string,
  expected: "cms" | "fallback-empty" | "fallback-error",
  body?: () => void,
) {
  // A 200 with an unusable body may already be in the Next data cache, so
  // wpFetch asks the CMS once more (no-store); every other outcome costs one.
  const requestsPerRender = ["graphql-error", "partial-errors", "malformed-json", "malformed-shape", "no-data"].includes(name)
    ? 2
    : 1;
  test.describe(`scenario ${name}`, () => {
    test.describe.configure({ mode: "serial" });

    test.beforeAll(async () => {
      await useScenario(name);
      await startServer();
    });
    test.afterAll(async () => {
      await stopServer();
      await stubAdmin("/__reset", {});
    });

    for (const locale of locales) {
      test(`${locale}: server HTML, hydration, no client refetch -> ${expected}`, async ({
        page,
        request,
        consoleErrors,
      }) => {
        const started = Date.now();
        const res = await request.get(`/${locale}/insights`, { timeout: 45_000 });
        expect(res.status()).toBe(200);
        const html = await res.text();
        expect(Date.now() - started).toBeLessThan(40_000); // a hung CMS must not hang the page

        // Fresh CMS requests for this locale (not a stale cache entry), bounded to the cards shown.
        const posts = (await stubPosts()).filter((r) => r.variables?.language === LANGUAGE[locale]);
        expect(posts).toHaveLength(requestsPerRender);
        for (const post of posts) {
          expect(post.scenario).toBe(name);
          expect(post.variables?.first).toBe(CARDS);
        }

        expect(html).toMatch(new RegExp(`<html[^>]*\\blang="${locale}"`));
        expect(html).toMatch(new RegExp(`<html[^>]*\\bdir="${dirFor(locale)}"`));
        expect(html).toContain(`data-content-source="${expected}"`);
        // Hydration payload: only when CMS content was dehydrated, and then teaser fields only.
        if (expected === "cms") {
          const payload = dehydratedQueries(html);
          for (const dropped of NON_CARD_FIELDS) {
            expect(payloadHasKey(payload, dropped), `payload must not carry ${dropped}`).toBe(false);
          }
          expect(payload.length).toBeLessThan(1_500);
        } else if (expected === "fallback-error") {
          // A failed fetch dehydrates nothing: no posts query reaches the browser.
          expect(html).not.toContain("dehydratedAt");
        }
        const cards = formatsSection(html);
        const statics = messages[locale].Insights.items;
        if (expected === "cms") {
          expect(cards).toContain(SEASONAL[locale]);
          for (const item of statics) expect(cards).not.toContain(item.title);
        } else {
          expect(cards).not.toContain(SEASONAL[locale]);
          for (const item of statics) expect(cards).toContain(item.title);
        }
        // Metadata never depends on the CMS.
        expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/${locale}/insights"`);
        expect(html).toMatch(/<meta name="robots" content="index, follow"/);

        // Hydration keeps the server markup and starts no CMS traffic.
        await page.goto(`/${locale}/insights`, { timeout: 45_000 });
        await waitForHydration(page);
        const section = page.locator("section[data-content-source]");
        await expect(section).toHaveAttribute("data-content-source", expected);
        const settled = (await stubPosts()).length;
        await page.waitForTimeout(1_500);
        await expect(section).toHaveAttribute("data-content-source", expected);
        expect((await stubPosts()).length).toBe(settled); // nothing fetched after hydration
        expect(consoleErrors).toEqual([]); // no hydration mismatch
        await expect(page.locator("main h1")).toHaveCount(1);
      });
    }

    body?.(); // scenario-specific tests first: they rely on the scenario still being active

    if (expected === "fallback-error") {
      test("recovers on the next render once the CMS is healthy (nothing stays cached as success or failure)", async ({
        request,
      }) => {
        await stubAdmin("/__scenario", { scenario: "ok" });
        for (const locale of locales) {
          const html = await (await request.get(`/${locale}/insights`, { timeout: 45_000 })).text();
          expect(html).toContain('data-content-source="cms"');
          expect(formatsSection(html)).toContain(SEASONAL[locale]);
        }
      });
    }
  });
}

const CMS_SLUG = { en: "seasonal-peak", ar: "seasonal-peak-ar" };
const CMS_TITLE = SEASONAL;
/** Scenarios answered with a 200 whose body is unusable (Next may have cached it). */
const BODY_FAILURES = ["graphql-error", "partial-errors", "malformed-json", "malformed-shape", "no-data"];
const notFoundTitle = (locale: "en" | "ar") => messages[locale].Blog.page.single.notFoundTitle;

scenarioSuite("ok", "cms", () => {
  test("production caching is unchanged: a repeat render is served from the Next data cache", async ({
    request,
  }) => {
    await request.get("/en/insights");
    await request.get("/en/insights");
    expect((await stubPosts()).filter((r) => r.variables?.language === "EN")).toHaveLength(1);
  });
});
scenarioSuite("null-acf", "cms");
scenarioSuite("partial", "cms", () => {
  test("an incomplete CMS post is neither linked from Insights nor rendered (noindex soft 404)", async ({ request }) => {
    for (const locale of locales) {
      const cards = formatsSection(await (await request.get(`/${locale}/insights`)).text());
      expect(cards).not.toContain(`/blog/${CMS_SLUG[locale]}`);
      expect(cards).toContain("data-unlinked");
      const html = await (await request.get(`/${locale}/blog/${CMS_SLUG[locale]}`)).text();
      expect(h1Text(html)).toBe(notFoundTitle(locale));
      expect(robotsMeta(html)).toMatch(/^noindex/);
    }
  });
});

/**
 * Request accounting for blog detail. Server fetches are cached in the Next
 * data cache for the life of a server, so counts are only meaningful on a cold
 * one: this suite owns its server and assumes nothing about earlier tests.
 */
test.describe("blog detail: cache sharing and request counts (cold server)", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeAll(async () => {
    await useScenario("ok");
    await startServer();
  });
  test.afterAll(async () => {
    await stopServer();
    await stubAdmin("/__reset", {});
  });

  const postSlugs = async () => (await stubOps("PostBySlug")).map((r) => r.variables?.id);
  const listSizes = async (language: string) =>
    (await stubOps("Posts")).filter((r) => r.variables?.language === language).map((r) => r.variables?.first);

  for (const locale of locales) {
    test(`${locale}: Insights verifies its card once; the article then reuses that lookup`, async ({ request }) => {
      await stubAdmin("/__reset", {});
      const cards = formatsSection(await (await request.get(`/${locale}/insights`)).text());
      expect(cards).toContain(`href="/${locale}/blog/${CMS_SLUG[locale]}"`);
      // The cards list (3) plus one link check. The locale check is skipped there: the slug came from the list.
      expect(await listSizes(LANGUAGE[locale])).toEqual([CARDS]);
      expect(await postSlugs()).toEqual([CMS_SLUG[locale]]);

      const res = await request.get(`/${locale}/blog/${CMS_SLUG[locale]}`);
      expect(res.status()).toBe(200);
      expect(await res.text()).toContain("Second paragraph.");
      // Same PostBySlug data-cache entry; only the locale's post list (bound 100) is new.
      expect(await postSlugs()).toEqual([CMS_SLUG[locale]]);
      expect(await listSizes(LANGUAGE[locale])).toEqual([CARDS, 100]);

      await request.get(`/${locale}/blog/${CMS_SLUG[locale]}`); // repeat: fully cached
      expect(await postSlugs()).toEqual([CMS_SLUG[locale]]);
      expect(await listSizes(LANGUAGE[locale])).toEqual([CARDS, 100]);
    });

    test(`${locale}: an unknown slug costs one lookup for metadata and page together, then is cached`, async ({ request }) => {
      await stubAdmin("/__reset", {});
      const slug = `ghost-${locale}`;
      const res = await request.get(`/${locale}/blog/${slug}`);
      expect(h1Text(await res.text())).toBe(notFoundTitle(locale));
      await request.get(`/${locale}/blog/${slug}`);
      expect(await postSlugs()).toEqual([slug]);
      expect(await stubOps("Posts")).toHaveLength(0); // nothing to locale-check
    });
  }

  // After the lookups above: asserts only what a warm or cold data cache cannot change.
  for (const locale of locales) {
    test(`${locale}: the other locale's slug is a noindex soft 404 and is never rendered`, async ({ request }) => {
      const other = locale === "en" ? "ar" : "en";
      const res = await request.get(`/${locale}/blog/${CMS_SLUG[other]}`);
      const html = await res.text();
      expect(res.status()).toBe(200);
      expect(h1Text(html)).toBe(notFoundTitle(locale));
      expect(h1Text(html)).not.toBe(CMS_TITLE[other]);
      expect(html).not.toContain("Second paragraph.");
      expect(robotsMeta(html)).toMatch(/^noindex/);
    });
  }
});
scenarioSuite("empty", "fallback-empty");
scenarioSuite("graphql-error", "fallback-error", () => {
  test("a 200 carrying GraphQL errors is not served from cache once the CMS recovers", async ({ request }) => {
    await request.get("/en/insights"); // outage: the 200 error body is written to the data cache
    await stubAdmin("/__scenario", { scenario: "ok" });
    const html = await (await request.get("/en/insights")).text();
    // Previously pinned as a defect (fallback for the whole revalidate window).
    expect(html).toContain('data-content-source="cms"');
  });

  test("recovery is repeatable and healthy content is cached normally afterwards", async ({ request }) => {
    await stubAdmin("/__reset", {});
    await stubAdmin("/__scenario", { scenario: "ok" });
    const before = (await stubPosts()).length;
    await request.get("/ar/insights"); // AR was cached as an error body earlier in this server's life
    const html = await (await request.get("/ar/insights")).text();
    const asks = (await stubPosts()).length - before;
    // Poisoned entry: each render re-asks fresh (1 cache hit + 1 request); bounded, never a loop.
    expect(asks).toBeGreaterThanOrEqual(1); // it really went back to the CMS
    expect(asks).toBeLessThanOrEqual(2);
    expect(html).toContain('data-content-source="cms"'); // and the recovered content is what renders
    expect(formatsSection(html)).toContain(SEASONAL.ar);
  });
});
scenarioSuite("partial-errors", "fallback-error");
scenarioSuite("malformed-json", "fallback-error");
scenarioSuite("malformed-shape", "fallback-error");
scenarioSuite("no-data", "fallback-error");
scenarioSuite("network-error", "fallback-error");
scenarioSuite("http-error", "fallback-error", () => {
  test("an HTTP failure is not cached: the next render retries and recovers", async ({ request }) => {
    await request.get("/en/insights");
    await stubAdmin("/__scenario", { scenario: "ok" });
    const html = await (await request.get("/en/insights")).text();
    expect(html).toContain('data-content-source="cms"');
  });
});
// Timeouts: the client's 10s budget ends the wait and the page falls back.
scenarioSuite("hang", "fallback-error");
scenarioSuite("stalled-body", "fallback-error");

test.describe("locale isolation of the cache", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeAll(async () => {
    await useScenario("ok");
    await startServer();
  });
  test.afterAll(async () => {
    await stopServer();
    await stubAdmin("/__reset", {});
  });

  test("EN and AR are cached separately and never mix", async ({ request }) => {
    const en = formatsSection(await (await request.get("/en/insights")).text());
    const ar = formatsSection(await (await request.get("/ar/insights")).text());
    expect(en).toContain(SEASONAL.en);
    expect(en).not.toContain(SEASONAL.ar);
    expect(ar).toContain(SEASONAL.ar);
    expect(ar).not.toContain(SEASONAL.en);
    const languages = (await stubPosts()).map((r) => r.variables?.language).sort();
    expect(languages).toEqual(["AR", "EN"]);
  });
});

test.describe("stub image through next/image", () => {
  test.beforeAll(async () => {
    await useScenario("ok");
    await startServer();
  });
  test.afterAll(async () => {
    await stopServer();
    await stubAdmin("/__reset", {});
  });

  test("the optimizer's verdict on a stub-hosted CMS image", async ({ request }) => {
    const cards = formatsSection(await (await request.get("/en/insights")).text());
    const img = [...cards.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    const src = img.map((tag) => /\bsrc="(\/_next\/image\?[^"]+)"/.exec(tag)?.[1]).find(Boolean);
    expect(src, "CMS card image uses next/image").toBeTruthy();
    const res = await request.get(src!.replaceAll("&amp;", "&"));
    test.info().annotations.push({ type: "image-optimizer-status", description: String(res.status()) });
    expect(res.status()).toBe(200);
  });
});

/**
 * Blog detail against each failing or empty scenario, on its own server and a
 * cold data cache. A CMS failure is an error response, never the "not found"
 * page; an empty answer is the noindex soft 404.
 */
function blogScenario(name: string, outcome: "error" | "not-found") {
  test.describe(`blog detail, scenario ${name}`, () => {
    test.describe.configure({ mode: "serial" });
    test.beforeAll(async () => {
      await useScenario(name);
      await startServer();
    });
    test.afterAll(async () => {
      await stopServer();
      await stubAdmin("/__reset", {});
    });

    // Next resolves the lookup twice on a failing render (generateMetadata runs again for
    // the error response), and failures are not in the data cache, so each costs a request.
    // A 200 with an unusable body is cached: the second lookup finds it, discards it and
    // asks once more (no-store), so the whole render costs 3 instead of 2.
    const asksPerRender = BODY_FAILURES.includes(name) ? 3 : 2;

    test(`en: a CMS post lookup is ${outcome}`, async ({ request }) => {
      // No wall-clock budget: a hung CMS fails the request timeout, and the exact request
      // counts below show each lookup ended at the client's own timeout instead of retrying.
      const res = await request.get(`/en/blog/${CMS_SLUG.en}`, { timeout: 45_000 });
      const html = await res.text();
      const asks = await stubOps("PostBySlug");
      expect(asks).toHaveLength(outcome === "error" ? asksPerRender : 1);
      for (const ask of asks) expect(ask.scenario).toBe(name);
      expect(html).not.toContain("Second paragraph.");
      expect(await stubOps("Posts")).toHaveLength(0); // never got as far as a locale check
      if (outcome === "error") {
        expect(res.status()).toBe(500);
        expect(h1Text(html)).not.toBe(notFoundTitle("en")); // not the "not found" page
        expect(h1Text(html)).not.toBe(CMS_TITLE.en);
        // Next's error response carries noindex; the CMS post must never be advertised as indexable.
        expect(robotsMeta(html)).toMatch(/^noindex/);
      } else {
        expect(res.status()).toBe(200);
        expect(h1Text(html)).toBe(notFoundTitle("en"));
        expect(robotsMeta(html)).toMatch(/^noindex/);
      }
    });

    if (outcome === "error") {
      test("static posts never depend on the CMS", async ({ request }) => {
        const post = messages.en.Blog.posts[0];
        const before = (await stubOps("PostBySlug")).length;
        const res = await request.get(`/en/blog/${post.slug}`);
        expect(res.status()).toBe(200);
        expect(h1Text(await res.text())).toBe(post.title);
        // No CMS call for a static slug (the count did not move).
        expect(await stubOps("PostBySlug")).toHaveLength(before);
      });

      test("recovers on the next render once the CMS is healthy; the failure was not cached", async ({ request }) => {
        // Fails (rather than passing vacuously) if the failing render above never ran.
        const failed = (await stubOps("PostBySlug")).length;
        expect(failed).toBeGreaterThanOrEqual(1);
        await stubAdmin("/__scenario", { scenario: "ok" });
        for (const locale of locales) {
          const res = await request.get(`/${locale}/blog/${CMS_SLUG[locale]}`, { timeout: 45_000 });
          expect(res.status()).toBe(200);
          const html = await res.text();
          expect(h1Text(html)).toBe(CMS_TITLE[locale]);
          expect(html).toContain("Second paragraph.");
        }
        // Healthy answers came from the CMS afresh: the outage left nothing cached.
        const after = await stubOps("PostBySlug");
        expect(after.length).toBeGreaterThan(failed);
        expect(after.at(-1)?.scenario).toBe("ok");
      });
    }
  });
}
for (const name of ["graphql-error", "partial-errors", "http-error", "malformed-json", "malformed-shape", "no-data", "network-error", "hang", "stalled-body"]) {
  blogScenario(name, "error");
}
blogScenario("empty", "not-found");
