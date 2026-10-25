import { spawn, type ChildProcess } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { test, expect, waitForHydration } from "../support/fixtures";
import { isCmsRequest, trackRequests } from "../support/cms";
import { formatsSection, INSIGHT_PATH, INSIGHT_TITLES } from "../support/insights";
import { h1Text, rendersElementText, robotsMeta } from "../support/html";
import { dirFor, locales, messages } from "../support/messages";

/**
 * Real Next.js server rendering of /[locale]/insights and /[locale]/blog (both
 * views of the Insight content model) against every CMS stub scenario, plus the
 * blog detail route's request accounting.
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
  variables?: { language?: string; first?: number; id?: string; slug?: string; after?: string };
  scenario?: string;
};

/** /insights shows 3 cards, so it must ask for 3 (see INSIGHTS_PAGE_CARDS). */
const CARDS = 3;
/** /blog asks for one grid page (see BLOG_PAGE_SIZE). */
const BLOG_PAGE = 12;

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
const stubInsights = async () => stubOps("Insights");
const stubArticles = async () => stubOps("InsightTypeInsights");
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
 *
 * Outcomes: `cms` (the CMS answered with Insights), `empty` (it answered with
 * none: an empty state, never static items) and `fallback-error` (it could not
 * answer: the locale's static items). Empty and failure must never look alike.
 */
type Outcome = "cms" | "empty" | "fallback-error";

/** A 200 with an unusable body may already be in the Next data cache, so wpFetch asks once more (no-store). */
const requestsFor = (name: string) =>
  ["graphql-error", "partial-errors", "malformed-json", "malformed-shape", "no-data"].includes(name) ? 2 : 1;

function scenarioSuite(name: string, expected: Outcome, body?: () => void) {
  const requestsPerRender = requestsFor(name);
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
        const asks = (await stubInsights()).filter((r) => r.variables?.language === LANGUAGE[locale]);
        expect(asks).toHaveLength(requestsPerRender);
        for (const ask of asks) {
          expect(ask.scenario).toBe(name);
          expect(ask.variables?.first).toBe(CARDS);
        }
        expect(await stubPosts()).toHaveLength(0); // the legacy Posts feed is not used

        expect(html).toMatch(new RegExp(`<html[^>]*\\blang="${locale}"`));
        expect(html).toMatch(new RegExp(`<html[^>]*\\bdir="${dirFor(locale)}"`));
        expect(html).toContain(`data-content-source="${expected}"`);
        const cards = formatsSection(html);
        const statics = messages[locale].Insights.items;
        if (expected === "cms") {
          expect(cards).toContain(INSIGHT_TITLES.lead[locale]);
          expect(cards).toContain(`href="/${locale}${INSIGHT_PATH.lead}"`);
          for (const item of statics) expect(cards).not.toContain(item.title);
        } else if (expected === "empty") {
          // The CMS has nothing: say so. No static items, no other language.
          expect(cards).toContain("data-empty");
          expect(cards).toContain(messages[locale].InsightsPage.formats.empty);
          for (const item of statics) expect(cards).not.toContain(item.title);
          expect(cards).not.toContain(INSIGHT_TITLES.lead[locale]);
          expect(cards).not.toContain("<h3");
        } else {
          // The CMS failed: static locale items, no empty state, no CMS card.
          expect(cards).not.toContain("data-empty");
          expect(cards).not.toContain(INSIGHT_TITLES.lead[locale]);
          for (const item of statics) expect(cards).toContain(item.title);
        }
        // Metadata never depends on the CMS.
        expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/${locale}/insights"`);
        expect(html).toMatch(/<meta name="robots" content="index, follow"/);

        // Hydration keeps the server markup and starts no CMS traffic.
        const cmsRequests = trackRequests(page, isCmsRequest);
        await page.goto(`/${locale}/insights`, { timeout: 45_000 });
        await waitForHydration(page);
        const section = page.locator("section[data-content-source]");
        await expect(section).toHaveAttribute("data-content-source", expected);
        const settled = (await stubInsights()).length;
        await page.waitForTimeout(1_500);
        await expect(section).toHaveAttribute("data-content-source", expected);
        expect((await stubInsights()).length).toBe(settled); // nothing fetched after hydration
        expect(cmsRequests).toEqual([]);
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
          expect(formatsSection(html)).toContain(INSIGHT_TITLES.lead[locale]);
        }
      });
    }
  });
}

/**
 * The Blog listing (`article` Insights, term-side query) in the same scenarios.
 * A reachable CMS decides what shows (articles or an empty state); only a CMS
 * failure falls back to the locale's static posts.
 */
function blogScenarioSuite(name: string, expected: Outcome) {
  const requestsPerRender = requestsFor(name);
  test.describe(`blog listing, scenario ${name}`, () => {
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
      test(`${locale}: /blog -> ${expected}`, async ({ page, request, consoleErrors }) => {
        const res = await request.get(`/${locale}/blog`, { timeout: 45_000 });
        expect(res.status()).toBe(200);
        const html = await res.text();
        expect(html).toContain(`data-content-source="${expected}"`);

        // The term-side query carries no language, so EN and AR share one data-cache entry: the
        // first locale asks the CMS (once, or twice for an unusable 200), the second reuses a cached
        // success (and re-asks after a failure). Never Posts, never the all-types list.
        const asks = await stubArticles();
        if (locale === "en") expect(asks).toHaveLength(requestsPerRender);
        else expect(asks.length).toBeLessThanOrEqual(requestsPerRender * 4);
        for (const ask of asks) {
          expect(ask.scenario).toBe(name);
          expect(ask.variables).toMatchObject({ slug: "article", first: BLOG_PAGE });
        }
        expect(await stubPosts()).toHaveLength(0);
        expect(await stubInsights()).toHaveLength(0);

        const titles = messages[locale].Blog.posts.map((post) => post.title);
        const rendered = (text: string) => html.includes(`>${text}<`);
        if (expected === "cms") {
          expect(rendered(INSIGHT_TITLES.lead[locale])).toBe(true);
          expect(html).toContain(`href="/${locale}${INSIGHT_PATH.lead}"`);
          for (const title of titles) expect(rendered(title)).toBe(false);
        } else if (expected === "empty") {
          expect(html).toContain("data-empty");
          expect(html).toContain(messages[locale].Blog.page.empty.title);
          for (const title of titles) expect(rendered(title)).toBe(false);
          expect(rendered(INSIGHT_TITLES.lead[locale])).toBe(false);
          expect(html).not.toContain(`href="/${locale}/blog/`);
        } else {
          expect(html).not.toContain("data-empty");
          for (const title of titles) expect(rendered(title)).toBe(true);
          expect(rendered(INSIGHT_TITLES.lead[locale])).toBe(false);
        }

        const cmsRequests = trackRequests(page, isCmsRequest);
        await page.goto(`/${locale}/blog`, { timeout: 45_000 });
        await waitForHydration(page);
        await expect(page.locator("main")).toHaveAttribute("data-content-source", expected);
        await expect(page.locator("main h1")).toHaveCount(1);
        if (expected === "empty") {
          await expect(page.locator("main [data-empty]")).toBeVisible();
          await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
        }
        expect(cmsRequests).toEqual([]);
        expect(consoleErrors).toEqual([]);
      });
    }

    if (expected === "fallback-error") {
      test("recovers on the next render once the CMS is healthy", async ({ request }) => {
        await stubAdmin("/__scenario", { scenario: "ok" });
        for (const locale of locales) {
          const html = await (await request.get(`/${locale}/blog`, { timeout: 45_000 })).text();
          expect(html).toContain('data-content-source="cms"');
          expect(html).toContain(`>${INSIGHT_TITLES.lead[locale]}<`);
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
    expect((await stubInsights()).filter((r) => r.variables?.language === "EN")).toHaveLength(1);
  });
});
scenarioSuite("null-acf", "cms");
scenarioSuite("partial", "cms", () => {
  test("a sparse CMS item is still listed and linked to its CMS URI", async ({ request }) => {
    for (const locale of locales) {
      const cards = formatsSection(await (await request.get(`/${locale}/insights`)).text());
      expect(cards).toContain(`href="/${locale}${INSIGHT_PATH.lead}"`);
      expect(cards).not.toContain("data-unlinked");
    }
  });
});

/**
 * Request accounting for blog detail. Server fetches are cached in the Next
 * data cache for the life of a server, so counts are only meaningful on a cold
 * one: this suite owns its server and assumes nothing about earlier tests.
 * (The detail route and its Posts lookups are unchanged by the listing work.)
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
    test(`${locale}: the article costs one post lookup plus one locale-list check, and a repeat is fully cached`, async ({ request }) => {
      await stubAdmin("/__reset", {});
      const res = await request.get(`/${locale}/blog/${CMS_SLUG[locale]}`);
      expect(res.status()).toBe(200);
      expect(await res.text()).toContain("Second paragraph.");
      expect(await postSlugs()).toEqual([CMS_SLUG[locale]]);
      expect(await listSizes(LANGUAGE[locale])).toEqual([100]);

      await request.get(`/${locale}/blog/${CMS_SLUG[locale]}`); // repeat: fully cached
      expect(await postSlugs()).toEqual([CMS_SLUG[locale]]);
      expect(await listSizes(LANGUAGE[locale])).toEqual([100]);
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
scenarioSuite("empty", "empty");
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
    const before = (await stubInsights()).length;
    await request.get("/ar/insights"); // AR was cached as an error body earlier in this server's life
    const html = await (await request.get("/ar/insights")).text();
    const asks = (await stubInsights()).length - before;
    // Poisoned entry: each render re-asks fresh (1 cache hit + 1 request); bounded, never a loop.
    expect(asks).toBeGreaterThanOrEqual(1); // it really went back to the CMS
    expect(asks).toBeLessThanOrEqual(2);
    expect(html).toContain('data-content-source="cms"'); // and the recovered content is what renders
    expect(formatsSection(html)).toContain(INSIGHT_TITLES.lead.ar);
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

for (const [name, expected] of [
  ["ok", "cms"],
  ["null-acf", "cms"],
  ["partial", "cms"],
  ["empty", "empty"],
  ["graphql-error", "fallback-error"],
  ["partial-errors", "fallback-error"],
  ["http-error", "fallback-error"],
  ["malformed-json", "fallback-error"],
  ["malformed-shape", "fallback-error"],
  ["no-data", "fallback-error"],
  ["network-error", "fallback-error"],
  ["hang", "fallback-error"],
  ["stalled-body", "fallback-error"],
] as [string, Outcome][]) {
  blogScenarioSuite(name, expected);
}

/**
 * Arabic Insights are not published yet (the live CMS today). English is
 * unaffected; Arabic must show an empty state on both views, never the English
 * records and never static English copy presented as CMS content.
 */
test.describe("scenario arabic-insights-unpublished", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeAll(async () => {
    await useScenario("arabic-insights-unpublished");
    await startServer();
  });
  test.afterAll(async () => {
    await stopServer();
    await stubAdmin("/__reset", {});
  });

  test("/en/insights and /en/blog still serve the CMS", async ({ request }) => {
    const insights = await (await request.get("/en/insights")).text();
    expect(insights).toContain('data-content-source="cms"');
    expect(formatsSection(insights)).toContain(INSIGHT_TITLES.lead.en);
    const blog = await (await request.get("/en/blog")).text();
    expect(blog).toContain('data-content-source="cms"');
    expect(blog).toContain(`>${INSIGHT_TITLES.lead.en}<`);
  });

  test("/ar/insights is an empty state: no English record, no static items", async ({ request, page, consoleErrors }) => {
    const html = await (await request.get("/ar/insights")).text();
    expect(html).toContain('data-content-source="empty"');
    const cards = formatsSection(html);
    expect(cards).toContain(messages.ar.InsightsPage.formats.empty);
    expect(cards).not.toContain("<h3");
    for (const key of ["lead", "event", "news"] as const) {
      expect(cards).not.toContain(INSIGHT_TITLES[key].en);
      expect(cards).not.toContain(INSIGHT_TITLES[key].ar);
    }
    for (const item of messages.ar.Insights.items) expect(cards).not.toContain(item.title);
    const asks = (await stubInsights()).filter((r) => r.variables?.language === "AR");
    expect(asks.length).toBeGreaterThan(0);

    await page.goto("/ar/insights");
    await waitForHydration(page);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("section[data-content-source] [data-empty]")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("/ar/blog is an empty state: no English article, no static posts", async ({ request }) => {
    const html = await (await request.get("/ar/blog")).text();
    expect(html).toContain('data-content-source="empty"');
    expect(html).toContain("data-empty");
    expect(html).toContain(messages.ar.Blog.page.empty.title);
    expect(html).not.toContain(`>${INSIGHT_TITLES.lead.en}<`);
    expect(html).not.toContain(`>${INSIGHT_TITLES.minimal.en}<`);
    for (const post of messages.ar.Blog.posts) expect(html).not.toContain(`>${post.title}<`);
    expect(html).not.toContain('href="/ar/blog/');
  });

  test("detail: /ar/insights/<slug> never falls back to the English record (locale mismatch)", async ({ request }) => {
    // Polylang answers the unpublished /ar/ lookup with the English record; the language check rejects it.
    const ar = await request.get(`/ar${INSIGHT_PATH.lead}`);
    const html = await ar.text();
    expect(ar.status()).toBe(200);
    expect(h1Text(html)).toBe(messages.ar.Blog.page.single.notFoundTitle);
    expect(robotsMeta(html)).toMatch(/^noindex/);
    expect(html).not.toContain(INSIGHT_TITLES.lead.en);
    expect(html).not.toContain('data-content-source="cms"');
    const asked = (await stubOps("InsightByUri")).map((r) => (r.variables as { uri?: string }).uri);
    expect(asked).toContain(`/ar${INSIGHT_PATH.lead}/`);

    // English is untouched.
    const en = await (await request.get(`/en${INSIGHT_PATH.lead}`)).text();
    expect(h1Text(en)).toBe(INSIGHT_TITLES.lead.en);
  });
});

test.describe("insight detail, CMS failure (http-error)", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeAll(async () => {
    await useScenario("http-error");
    await startServer();
  });
  test.afterAll(async () => {
    await stopServer();
    await stubAdmin("/__reset", {});
  });

  test("an outage is a server error, never a cacheable soft 404, and recovers", async ({ request }) => {
    for (const locale of locales) {
      const res = await request.get(`/${locale}${INSIGHT_PATH.lead}`, { timeout: 45_000 });
      expect(res.status(), locale).toBeGreaterThanOrEqual(500);
      // Locale messages ride in every payload, so look at rendered elements only.
      expect(rendersElementText(await res.text(), messages[locale].Blog.page.single.notFoundTitle), locale).toBe(false);
    }
    await stubAdmin("/__scenario", { scenario: "ok" });
    for (const locale of locales) {
      const html = await (await request.get(`/${locale}${INSIGHT_PATH.lead}`, { timeout: 45_000 })).text();
      expect(h1Text(html)).toBe(INSIGHT_TITLES.lead[locale]);
    }
  });
});

/**
 * More articles than fit one page. The term-side connection mixes languages,
 * so a page of 12 holds only the 6 records of one language and "Load more"
 * still has more. Load more runs as a server action on the page's own origin:
 * the browser never calls the CMS.
 */
test.describe("blog Load more (many-article-insights)", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeAll(async () => {
    await useScenario("many-article-insights");
    await startServer();
  });
  test.afterAll(async () => {
    await stopServer();
    await stubAdmin("/__reset", {});
  });

  for (const locale of locales) {
    test(`${locale}: pages through all 16 articles once, newest first, then the button goes away`, async ({
      page,
      consoleErrors,
    }) => {
      const cmsRequests = trackRequests(page, isCmsRequest);
      const baseline = (await stubArticles()).length;
      const actions: string[] = [];
      page.on("request", (r) => {
        if (r.method() === "POST" && r.headers()["next-action"]) actions.push(new URL(r.url()).origin);
      });
      await page.goto(`/${locale}/blog`, { timeout: 45_000 });
      await waitForHydration(page);

      const grid = page.locator("main h3");
      const button = page.getByRole("button", { name: messages[locale].Blog.page.loadMore });
      const title = (n: number) => (locale === "ar" ? `مقال إضافي ${n}` : `Bulk article ${n}`);

      await expect(grid).toHaveCount(6); // lead, minimal, bulk 1-4 (one language of a 12-record page)
      await expect(button).toBeVisible();
      // EN and AR share the term-side cache entries (no language in the query): the second locale may add none.
      expect((await stubArticles()).length - baseline).toBeLessThanOrEqual(1);

      await button.click();
      await expect(grid).toHaveCount(12);
      await button.click();
      await expect(grid).toHaveCount(16);
      await expect(button).toHaveCount(0);

      const titles = await grid.allTextContents();
      expect(new Set(titles).size).toBe(16); // no duplicates
      expect(titles.slice(0, 2)).toEqual([INSIGHT_TITLES.lead[locale], INSIGHT_TITLES.minimal[locale]]);
      expect(titles.slice(2)).toEqual(Array.from({ length: 14 }, (_, i) => title(i + 1)));
      for (const heading of titles) expect(heading).not.toContain(locale === "en" ? "مقال" : "Bulk");

      // The next pages were asked of the CMS by the server, with the cursor, from the same article term.
      const asks = (await stubArticles()).slice(baseline);
      expect(asks.length).toBeLessThanOrEqual(3);
      expect(asks.every((a) => a.variables?.slug === "article")).toBe(true);
      expect(asks.filter((a) => a.variables?.after).length).toBe(Math.max(0, asks.length - (asks[0]?.variables?.after ? 0 : 1)));
      expect(actions.length).toBe(2);
      expect(actions.every((origin) => origin === ORIGIN)).toBe(true);
      expect(cmsRequests).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
});

/** The CMS fails while the browser asks for the next page (cold server: failures are never cached, successes are). */
test.describe("blog Load more failure (many-article-insights)", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeAll(async () => {
    await useScenario("many-article-insights");
    await startServer();
  });
  test.afterAll(async () => {
    await stopServer();
    await stubAdmin("/__reset", {});
  });

  // English only: Arabic shares the same cached term-side pages (no language in the query).
  for (const locale of ["en"] as const) {
    test(`${locale}: a failed Load more keeps the list, shows an alert and can be retried`, async ({ page }) => {
      await page.goto(`/${locale}/blog`, { timeout: 45_000 });
      await waitForHydration(page);
      const grid = page.locator("main h3");
      await expect(grid).toHaveCount(6);

      await stubAdmin("/__scenario", { scenario: "http-error" });
      const button = page.getByRole("button", { name: messages[locale].Blog.page.loadMore });
      await button.click();
      await expect(page.locator('p[role="alert"]')).toHaveText(messages[locale].Blog.page.loadMoreError);
      await expect(grid).toHaveCount(6);

      await stubAdmin("/__scenario", { scenario: "many-article-insights" });
      await button.click();
      await expect(grid).toHaveCount(12);
      await expect(page.locator('p[role="alert"]')).toHaveCount(0);
    });
  }
});

/**
 * An Arabic article exists but sits behind more than five consecutive pages of
 * English-only records. The bounded scan must not conclude "no articles": the
 * page keeps Load more (no empty state), and continuing reaches the article.
 */
test.describe("scenario arabic-articles-buried", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeAll(async () => {
    await useScenario("arabic-articles-buried");
    await startServer();
  });
  test.afterAll(async () => {
    await stopServer();
    await stubAdmin("/__reset", {});
  });

  test("/ar/blog is not an empty state; Load more finds the Arabic articles", async ({ page, request, consoleErrors }) => {
    const html = await (await request.get("/ar/blog", { timeout: 45_000 })).text();
    expect(html).toContain('data-content-source="cms"');
    expect(html).not.toContain("data-empty");
    expect((await stubArticles()).length).toBe(6); // first page + at most five skipped pages

    await page.goto("/ar/blog", { timeout: 45_000 });
    await waitForHydration(page);
    const grid = page.locator("main h3");
    await expect(grid).toHaveCount(0);
    await page.getByRole("button", { name: messages.ar.Blog.page.loadMore }).click();
    await expect(grid).toHaveText([INSIGHT_TITLES.lead.ar, INSIGHT_TITLES.minimal.ar]);
    await expect(page.getByRole("button", { name: messages.ar.Blog.page.loadMore })).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test("/en/blog is unaffected", async ({ request }) => {
    const html = await (await request.get("/en/blog")).text();
    expect(html).toContain('data-content-source="cms"');
    expect(html).toContain(">English only 1<");
  });
});

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
    expect(en).toContain(INSIGHT_TITLES.lead.en);
    expect(en).not.toContain(INSIGHT_TITLES.lead.ar);
    expect(ar).toContain(INSIGHT_TITLES.lead.ar);
    expect(ar).not.toContain(INSIGHT_TITLES.lead.en);
    const languages = (await stubInsights()).map((r) => r.variables?.language).sort();
    expect(languages).toEqual(["AR", "EN"]);

    // The blog is one more view of the same content: one term-side request per locale.
    const blogEn = await (await request.get("/en/blog")).text();
    const blogAr = await (await request.get("/ar/blog")).text();
    expect(blogEn).toContain(INSIGHT_TITLES.lead.en);
    expect(blogEn).not.toContain(INSIGHT_TITLES.lead.ar);
    expect(blogAr).toContain(INSIGHT_TITLES.lead.ar);
    expect(blogAr).not.toContain(INSIGHT_TITLES.lead.en);
    // The term query has no language, so both locales share one cached CMS answer and filter it per locale.
    expect((await stubArticles()).map((r) => r.variables?.slug)).toEqual(["article"]);
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
      // Neither the 500 page nor the soft 404 carries the shared closing CTA.
      expect(html).not.toMatch(new RegExp(String.raw`<h2[^>]*>\s*${messages.en.HomeV1.cta.title}`));
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
