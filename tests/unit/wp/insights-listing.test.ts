import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BLOG_PAGE_SIZE,
  INSIGHTS_PAGE_CARDS,
  loadArticleListing,
  loadInsightsListing,
  type ListingResult,
} from "@/lib/insights-listing";
import { pickFeatured, toInsightCard } from "@/lib/insights-cards";
import { wpKeys } from "@/lib/wp/keys";
import { BURIED_ARABIC, MANY_ARTICLES, NO_ARABIC_INSIGHTS } from "../../support/cms-stub/fixtures.mjs";
import { startCmsStub } from "../../support/cms-stub/harness";

/**
 * The server loaders behind /insights (every type) and /blog (`article` only),
 * with the real client, prefetch helpers and normalizers against the CMS stub.
 */

const stub = startCmsStub();
const ops = () => stub.graphqlRequests().map((r) => [r.operation, r.variables]);
const cmsItems = (r: ListingResult) => {
  if (r.status !== "cms") throw new Error(`expected cms, got ${r.status}`);
  return r.items;
};
const slugs = (r: ListingResult) => cmsItems(r).map((i) => i.slug);

afterEach(() => vi.restoreAllMocks());

describe("Insights listing: every content type", () => {
  it("returns articles, events and news together, newest first, in English", async () => {
    const result = await loadInsightsListing(new QueryClient(), "en", 12);
    expect(slugs(result)).toEqual([
      "lead-article",
      "event-conference",
      "news-update",
      "event-open-ended",
      "minimal-article",
    ]);
    const types = new Set(cmsItems(result).flatMap((i) => i.types.map((t) => t.slug)));
    expect(types).toEqual(new Set(["article", "event", "news"]));
    const dates = cmsItems(result).map((i) => i.date!);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("asks the CMS for one language, newest first, and never for Posts", async () => {
    await loadInsightsListing(new QueryClient(), "en");
    expect(ops()).toEqual([["Insights", { first: INSIGHTS_PAGE_CARDS, language: "EN" }]]);
    expect(stub.graphqlRequests()[0].query).toMatch(/orderby:\s*\{\s*field:\s*DATE,\s*order:\s*DESC\s*\}/);
  });

  it("walks the cursor: the next page continues where the first stopped, with no repeats", async () => {
    const qc = new QueryClient();
    const first = await loadInsightsListing(qc, "en", 2);
    expect(first).toMatchObject({ status: "cms", hasNextPage: true, endCursor: expect.any(String) });
    expect(slugs(first)).toEqual(["lead-article", "event-conference"]);

    const next = await loadInsightsListing(qc, "en", 2, (first as { endCursor: string }).endCursor);
    expect(slugs(next)).toEqual(["news-update", "event-open-ended"]);
    const last = await loadInsightsListing(qc, "en", 2, (next as { endCursor: string }).endCursor);
    expect(slugs(last)).toEqual(["minimal-article"]);
    expect(last).toMatchObject({ hasNextPage: false });
  });

  it("caches each page under a locale-keyed entry", async () => {
    const qc = new QueryClient();
    await loadInsightsListing(qc, "ar", INSIGHTS_PAGE_CARDS);
    expect(qc.getQueryData(wpKeys.insights("ar", INSIGHTS_PAGE_CARDS, undefined))).toBeDefined();
    expect(qc.getQueryData(wpKeys.insights("en", INSIGHTS_PAGE_CARDS, undefined))).toBeUndefined();
  });
});

describe("Insights listing: language isolation and Arabic emptiness", () => {
  it("Arabic requests return only Arabic records", async () => {
    const result = await loadInsightsListing(new QueryClient(), "ar", 12);
    expect(cmsItems(result).length).toBeGreaterThan(0);
    expect(cmsItems(result).every((i) => i.locale === "ar" && i.uri.startsWith("/ar/"))).toBe(true);
    expect(stub.graphqlRequests()[0].variables).toMatchObject({ language: "AR" });
  });

  it("with no Arabic Insights published, Arabic is `empty` (not English, not an error)", async () => {
    stub.setScenario(NO_ARABIC_INSIGHTS);
    expect(await loadInsightsListing(new QueryClient(), "ar")).toEqual({ status: "empty" });
    // English is unaffected.
    expect((await loadInsightsListing(new QueryClient(), "en")).status).toBe("cms");
  });

  it("drops a record that comes back in the wrong language instead of showing it", async () => {
    // The by-uri/term-side guard is the data layer's; the listing inherits it. Simulate a
    // CMS that ignores `where.language` by asking Arabic of an English-only listing.
    stub.setScenario(NO_ARABIC_INSIGHTS);
    const result = await loadArticleListing(new QueryClient(), "ar");
    expect(result).toEqual({ status: "empty" });
  });
});

describe("Blog listing: articles only, from the term side", () => {
  it("queries the `article` insightType term and nothing else", async () => {
    await loadArticleListing(new QueryClient(), "en");
    expect(ops()).toEqual([["InsightTypeInsights", { slug: "article", first: BLOG_PAGE_SIZE }]]);
    expect(stub.graphqlRequests()[0].query).not.toMatch(/taxQuery/);
  });

  it("returns only articles, newest first", async () => {
    const result = await loadArticleListing(new QueryClient(), "en");
    expect(slugs(result)).toEqual(["lead-article", "minimal-article"]);
    expect(cmsItems(result).every((i) => i.types.some((t) => t.slug === "article"))).toBe(true);
    expect(cmsItems(result).some((i) => i.types.some((t) => t.slug !== "article"))).toBe(false);
  });

  it("returns only Arabic articles for Arabic although the term connection mixes languages", async () => {
    const result = await loadArticleListing(new QueryClient(), "ar");
    expect(slugs(result)).toEqual(["lead-article", "minimal-article"]);
    expect(cmsItems(result).every((i) => i.locale === "ar")).toBe(true);
    expect(cmsItems(result).map((i) => i.title)).toEqual(["نتيجة لم تتحرك منذ أرباع", "مقال مختصر"]);
  });

  it("selects the flagged article as featured, else the newest", async () => {
    const cards = cmsItems(await loadArticleListing(new QueryClient(), "en")).map((i) => toInsightCard(i));
    expect(pickFeatured(cards)?.slug).toBe("lead-article");
    const unflagged = cards.map((c) => ({ ...c, isFeatured: false }));
    expect(pickFeatured(unflagged)?.slug).toBe("lead-article"); // newest
    expect(pickFeatured([...unflagged].reverse())?.slug).toBe("minimal-article");
  });

  it("skips pages of other-language records instead of reporting an empty list", async () => {
    // first=1, Arabic: page 1 is the English lead article (dropped, but more pages exist).
    const result = await loadArticleListing(new QueryClient(), "ar", 1);
    expect(slugs(result)).toEqual(["lead-article"]);
    expect(cmsItems(result)[0].locale).toBe("ar");
    expect(stub.graphqlRequests().length).toBe(2);
  });

  it("Load more: the cursor continues the same article listing without repeats", async () => {
    const qc = new QueryClient();
    const first = await loadArticleListing(qc, "en", 2);
    // EN lead, AR lead, EN minimal, AR minimal -> first=2 holds EN lead (+ dropped AR lead).
    expect(slugs(first)).toEqual(["lead-article"]);
    expect(first).toMatchObject({ hasNextPage: true });
    const more = await loadArticleListing(qc, "en", 2, (first as { endCursor: string }).endCursor);
    expect(slugs(more)).toEqual(["minimal-article"]);
    expect(more).toMatchObject({ status: "cms", hasNextPage: false });
  });

  it("an `after` page with nothing new is still a CMS page, not the empty state", async () => {
    const qc = new QueryClient();
    const first = await loadArticleListing(qc, "en", 4);
    expect(first).toMatchObject({ hasNextPage: false });
    // Cursor of the last node: nothing after it.
    const done = await loadArticleListing(qc, "en", 4, (first as { endCursor: string }).endCursor);
    expect(done).toMatchObject({ status: "cms", items: [], hasNextPage: false });
  });
});

describe("Blog listing: more articles than one page", () => {
  const walk = async (locale: "en" | "ar") => {
    stub.setScenario(MANY_ARTICLES);
    const qc = new QueryClient();
    const items: { slug: string; date: string | null; locale: string }[] = [];
    let after: string | undefined;
    let pages = 0;
    do {
      const result = await loadArticleListing(qc, locale, BLOG_PAGE_SIZE, after);
      if (result.status !== "cms") throw new Error(`expected cms, got ${result.status}`);
      items.push(...result.items);
      after = result.hasNextPage ? (result.endCursor ?? undefined) : undefined;
      pages += 1;
    } while (after);
    return { items, pages };
  };

  it.each(["en", "ar"] as const)("%s: Load more reaches every article once, newest first", async (locale) => {
    const { items, pages } = await walk(locale);
    expect(items).toHaveLength(16);
    expect(new Set(items.map((i) => i.slug)).size).toBe(16);
    expect(items.every((i) => i.locale === locale)).toBe(true);
    expect(items[0].slug).toBe("lead-article");
    const dates = items.map((i) => i.date!);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(pages).toBeGreaterThan(1);
  });
});

describe("Blog listing: an Arabic article buried behind many English-only pages", () => {
  // 80 English-only articles come first: every page of 12 mixed records holds no Arabic one for
  // the first 6 pages (72 records); the first Arabic article is on the 7th.
  it("a bounded, incomplete scan is NOT reported as 'no articles'", async () => {
    stub.setScenario(BURIED_ARABIC);
    const result = await loadArticleListing(new QueryClient(), "ar");
    expect(result).toMatchObject({ status: "cms", items: [], hasNextPage: true, endCursor: expect.any(String) });
    expect(result.status).not.toBe("empty");
    // Bounded: the first page plus at most five skipped pages, then it stops.
    expect(stub.graphqlRequests()).toHaveLength(6);
  });

  it("continuing from the returned cursor reaches the Arabic articles, again within the bound", async () => {
    stub.setScenario(BURIED_ARABIC);
    const qc = new QueryClient();
    const first = await loadArticleListing(qc, "ar");
    if (first.status !== "cms" || !first.endCursor) throw new Error("expected a cursor");
    const next = await loadArticleListing(qc, "ar", BLOG_PAGE_SIZE, first.endCursor);
    expect(slugs(next)).toEqual(["lead-article", "minimal-article"]);
    expect(cmsItems(next).every((i) => i.locale === "ar")).toBe(true);
    expect(stub.graphqlRequests().length).toBeLessThanOrEqual(12);
  });

  it("English is unaffected: its articles are on the first page", async () => {
    stub.setScenario(BURIED_ARABIC);
    const result = await loadArticleListing(new QueryClient(), "en");
    expect(cmsItems(result).length).toBe(12);
    expect(stub.graphqlRequests()).toHaveLength(1);
  });
});

describe("empty versus failure are different outcomes", () => {
  it("a valid empty CMS is `empty` for both listings", async () => {
    stub.setScenario("empty");
    expect(await loadInsightsListing(new QueryClient(), "en")).toEqual({ status: "empty" });
    expect(await loadArticleListing(new QueryClient(), "en")).toEqual({ status: "empty" });
  });

  it.each([
    ["graphql-error", "graphql", undefined],
    ["http-error", "http", 500],
    ["network-error", "network", undefined],
    ["malformed-json", "malformed", undefined],
  ] as const)("%s is an `error`, never empty content", async (scenario, kind, status) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    stub.setScenario(scenario);
    for (const load of [loadInsightsListing, loadArticleListing]) {
      const result = await load(new QueryClient(), "en");
      expect(result).toEqual({ status: "error", failure: { kind, ...(status ? { status } : {}) } });
    }
    expect(log).toHaveBeenCalledTimes(2);
    for (const [line] of log.mock.calls) expect(String(line)).not.toMatch(/query|variables|127\.0\.0\.1|http:/i);
  });

  it("a missing endpoint is a config error without any CMS request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT", "");
    expect(await loadInsightsListing(new QueryClient(), "en")).toEqual({
      status: "error",
      failure: { kind: "config" },
    });
    expect(await loadArticleListing(new QueryClient(), "en")).toMatchObject({ status: "error" });
    expect(stub.requests).toHaveLength(0);
  });

  it("a non-CMS error is rethrown, not turned into a result", async () => {
    const bug = new TypeError("boom");
    vi.stubGlobal("fetch", () => Promise.reject(bug));
    // A fetch rejection is a CMS `network` failure by the client's contract...
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await loadInsightsListing(new QueryClient(), "en")).status).toBe("error");
    // ...while a failure outside the client is a bug and propagates.
    const failingClient = new QueryClient();
    failingClient.fetchQuery = () => Promise.reject(bug);
    await expect(loadInsightsListing(failingClient, "en")).rejects.toBe(bug);
  });
});
