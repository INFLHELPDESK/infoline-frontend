import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import * as api from "@/lib/wp/api";
import { wpKeys } from "@/lib/wp/keys";
import { INSIGHT_TOPICS, INSIGHT_TYPES } from "@/lib/wp/queries";
import * as server from "@/lib/wp/server";
import { NO_ARABIC_INSIGHTS, uris } from "../../support/cms-stub/fixtures.mjs";
import { startCmsStub } from "../../support/cms-stub/harness";

/**
 * Insights (`insight` CPT) data layer against the local stub, over real HTTP.
 *
 * The stub reproduces what was observed on the Development CMS (read-only
 * introspection, CMS update Revision 1): `where.language` on `insights`, an
 * `/ar/<slug>/` lookup answered with the English record while no Arabic record
 * exists, language-neutral terms and a term-side connection that mixes
 * languages. Nothing here talks to a live CMS.
 */

const stub = startCmsStub();
const last = () => stub.graphqlRequests().at(-1)!;
const slugs = (items: { slug: string }[]) => items.map((i) => i.slug);

const ALL = ["lead-article", "event-conference", "news-update", "event-open-ended", "minimal-article"];

describe("listing request (verified)", () => {
  it("queries `insights` (not `posts`), newest first, with the Polylang language filter", async () => {
    await api.getInsights("en");
    expect(last()).toMatchObject({ operation: "Insights", variables: { first: 12, language: "EN" } });
    expect(last().query).toMatch(/insights\(/);
    expect(last().query).not.toMatch(/\bposts\b/);
    expect(last().query).toMatch(/orderby:\s*\{\s*field:\s*DATE,\s*order:\s*DESC\s*\}/);
    expect(last().query).not.toMatch(/taxQuery/);
    expect(last().query).toMatch(/pageInfo\s*\{\s*hasNextPage\s*endCursor\s*\}/);

    await api.getInsights("ar");
    expect(last().variables).toEqual({ first: 12, language: "AR" });
  });

  it("forwards first and the cursor", async () => {
    await api.getInsights("en", 2, "cursor-1");
    expect(last().variables).toEqual({ first: 2, after: "cursor-1", language: "EN" });
  });

  it("selects the language of every record (the guard needs it)", async () => {
    await api.getInsights("en");
    expect(last().query).toMatch(/language\s*\{\s*code\s*\}/);
  });
});

describe("English listing", () => {
  it("returns every record newest first with normalized fields", async () => {
    const page = await api.getInsights("en");
    expect(slugs(page.items)).toEqual(ALL);
    expect(page).toMatchObject({ hasNextPage: false, endCursor: expect.any(String) });
    expect(page.items.every((i) => i.locale === "en")).toBe(true);
    expect(page.items[0]).toMatchObject({
      title: "A score that had not moved in quarters",
      uri: "/insights/lead-article/",
      date: "2026-10-12T09:00:00",
      excerpt: "<p>A score that had not moved in quarters</p>\n",
      types: [{ name: "Article", slug: "article" }],
      topics: [{ name: "Clarity & Speed", slug: "clarity-speed" }],
      isFeatured: true,
    });
    expect(page.items[0].image).toEqual({
      src: "http://127.0.0.1:3199/stub-media/insight-lead-article.jpg",
      alt: "A score that had not moved in quarters",
    });
  });

  it("keeps the CMS URIs verbatim and never builds one", async () => {
    const page = await api.getInsights("en");
    expect(page.items.map((i) => i.uri)).toEqual(ALL.map((s) => `/insights/${s}/`));
  });

  it("carries the featured flag as stored: one flagged, the rest not", async () => {
    const page = await api.getInsights("en");
    expect(page.items.filter((i) => i.isFeatured).map((i) => i.slug)).toEqual(["lead-article"]);
  });

  it("covers Article, News and Event records, with event data only where it exists", async () => {
    const { items } = await api.getInsights("en");
    const bySlug = Object.fromEntries(items.map((i) => [i.slug, i]));
    expect(bySlug["lead-article"].types.map((t) => t.slug)).toEqual(["article"]);
    expect(bySlug["news-update"].types.map((t) => t.slug)).toEqual(["news"]);
    expect(bySlug["event-conference"].types.map((t) => t.slug)).toEqual(["event"]);
    expect(bySlug["lead-article"].eventDetails).toBeNull();
    expect(bySlug["news-update"].eventDetails).toBeNull();
    expect(bySlug["event-conference"].eventDetails).toEqual({
      start: "2026-11-17T00:00:00+00:00",
      end: "2026-11-18T00:00:00+00:00",
      location: "Example Convention Centre, Muscat",
      url: "https://example.test/register",
    });
    // optional pieces of an event stay individually optional
    expect(bySlug["event-open-ended"].eventDetails).toEqual({
      start: "2026-12-03T00:00:00+00:00",
      end: null,
      location: "Online",
      url: null,
    });
  });

  it("maps translation URIs and locale, only where a counterpart exists", async () => {
    const { items } = await api.getInsights("en");
    expect(items[0].translations).toEqual([{ locale: "ar", uri: "/ar/insights/lead-article/" }]);
    expect(items.slice(1).every((i) => i.translations.length === 0)).toBe(true);
  });

  it("has a null image where the CMS has none", async () => {
    const { items } = await api.getInsights("en");
    expect(items.find((i) => i.slug === "news-update")!.image).toBeNull();
  });
});

describe("Arabic listing", () => {
  it("returns Arabic records only, with /ar URIs and Arabic text", async () => {
    const page = await api.getInsights("ar");
    expect(slugs(page.items)).toEqual(ALL);
    expect(page.items.every((i) => i.locale === "ar" && i.uri.startsWith("/ar/insights/"))).toBe(true);
    expect(page.items[0].title).toBe("نتيجة لم تتحرك منذ أرباع");
    expect(page.items[0].translations).toEqual([{ locale: "en", uri: "/insights/lead-article/" }]);
  });

  it("never mixes English into the Arabic page, nor Arabic into the English one", async () => {
    const [en, ar] = [await api.getInsights("en"), await api.getInsights("ar")];
    expect(en.items.some((i) => i.locale === "ar")).toBe(false);
    expect(ar.items.some((i) => i.locale === "en")).toBe(false);
    expect(new Set([...en.items, ...ar.items].map((i) => i.databaseId)).size).toBe(10);
  });
});

describe("empty Arabic results (the live CMS today: no Arabic Insights)", () => {
  it("is an empty page, with no fallback to English", async () => {
    stub.setScenario(NO_ARABIC_INSIGHTS);
    const ar = await api.getInsights("ar");
    expect(ar).toEqual({ items: [], hasNextPage: false, endCursor: null });
    expect(last().variables).toMatchObject({ language: "AR" });
    expect(stub.graphqlRequests()).toHaveLength(1); // no second, English, attempt
    expect((await api.getInsights("en")).items).toHaveLength(5);
  });

  it("an empty CMS yields empty pages in both languages", async () => {
    stub.setScenario("empty");
    for (const locale of ["en", "ar"] as const) {
      expect(await api.getInsights(locale)).toEqual({ items: [], hasNextPage: false, endCursor: null });
    }
  });
});

describe("cursor pagination", () => {
  it("walks the pages with endCursor until hasNextPage is false", async () => {
    const seen: string[] = [];
    let after: string | undefined;
    let pages = 0;
    do {
      const page = await api.getInsights("en", 2, after);
      seen.push(...slugs(page.items));
      pages++;
      expect(page.hasNextPage).toBe(pages < 3);
      after = page.hasNextPage ? (page.endCursor ?? undefined) : undefined;
    } while (after);
    expect(pages).toBe(3);
    expect(seen).toEqual(ALL); // in order, no duplicates, none missed
    expect(stub.graphqlRequests().map((r) => r.variables!.after)).toEqual([undefined, expect.any(String), expect.any(String)]);
  });

  it("offers no cursor to follow when the CMS reports more pages but sends none", async () => {
    // `hasNextPage` without a cursor cannot be followed: it is reported as the last page.
    const { normalizeInsightPage } = await import("@/lib/wp/normalize");
    expect(
      normalizeInsightPage({ pageInfo: { hasNextPage: true, endCursor: null }, nodes: [] }, [], "en"),
    ).toEqual({ items: [], hasNextPage: false, endCursor: null });
  });
});

describe("detail lookup by URI", () => {
  it("uses the documented URI lookup and normalizes the full record", async () => {
    const insight = await api.getInsight(uris("en").insight, "en");
    expect(last()).toMatchObject({ operation: "InsightByUri", variables: { uri: "/insights/lead-article/" } });
    expect(last().query).toMatch(/insight\(id:\s*\$uri,\s*idType:\s*URI\)/);
    expect(insight).toMatchObject({
      title: "A score that had not moved in quarters",
      uri: "/insights/lead-article/",
      slug: "lead-article",
      locale: "en",
      content: "<p>A score that had not moved in quarters</p>\n<p>Body.</p>\n",
      isFeatured: true,
      types: [{ name: "Article", slug: "article" }],
      topics: [{ name: "Clarity & Speed", slug: "clarity-speed" }],
      eventDetails: null,
      translations: [{ locale: "ar", uri: "/ar/insights/lead-article/" }],
      seo: {
        title: "A score that had not moved in quarters - Infoline",
        description: null, // the CMS sends "" for an unset meta description
        openGraphTitle: "A score that had not moved in quarters - Infoline",
        openGraphDescription: "A score that had not moved in quarters",
      },
    });
    expect(insight?.image?.alt).toBe("A score that had not moved in quarters");
  });

  it("selects every field the contract names", async () => {
    await api.getInsight(uris("en").insight, "en");
    for (const field of [
      "title",
      "excerpt",
      "content",
      "date",
      "uri",
      "slug",
      "translations",
      "featuredImage",
      "insightTypes",
      "insightTopics",
      "isFeatured",
      "eventStart",
      "eventEnd",
      "eventLocation",
      "eventUrl",
      "metaDesc",
      "opengraphTitle",
      "opengraphDescription",
    ]) {
      expect(last().query, field).toContain(field);
    }
    expect(last().query).toMatch(/altText/);
  });

  it("addresses Arabic by /ar URI and returns the Arabic record", async () => {
    const stripped = uris("en").insight;
    const fromStripped = await api.getInsight(stripped, "ar");
    expect(last().variables).toEqual({ uri: "/ar/insights/lead-article/" });
    expect(fromStripped).toMatchObject({
      locale: "ar",
      uri: "/ar/insights/lead-article/",
      title: "نتيجة لم تتحرك منذ أرباع",
      translations: [{ locale: "en", uri: "/insights/lead-article/" }],
    });
    // an already /ar-prefixed URI is not prefixed twice, and a bare slug path is normalized
    await api.getInsight(uris("ar").insight, "ar");
    expect(last().variables).toEqual({ uri: "/ar/insights/lead-article/" });
    await api.getInsight("insights/lead-article/", "ar");
    expect(last().variables).toEqual({ uri: "/ar/insights/lead-article/" });
  });

  it("resolves null for a missing Insight (null response) and never throws", async () => {
    await expect(api.getInsight("/insights/nope/", "en")).resolves.toBeNull();
    stub.setScenario("empty");
    await expect(api.getInsight(uris("en").insight, "en")).resolves.toBeNull();
    await expect(api.getInsight(uris("en").insight, "ar")).resolves.toBeNull();
  });

  it("a record without an image or SEO text has null for each", async () => {
    const insight = await api.getInsight("/insights/minimal-article/", "en");
    expect(insight).toMatchObject({
      image: null,
      excerpt: null,
      content: null,
      topics: [],
      eventDetails: null,
      seo: { title: null, description: null, openGraphTitle: null, openGraphDescription: null },
    });
  });

  it.each(["null-acf", "partial"])("normalizes a record whose ACF groups are %s", async (scenario) => {
    stub.setScenario(scenario);
    const insight = await api.getInsight(uris("en").insight, "en");
    expect(insight).toMatchObject({
      title: "A score that had not moved in quarters",
      image: null,
      excerpt: null,
      content: null,
      translations: [],
      types: [],
      topics: [],
      isFeatured: false,
      eventDetails: null,
      seo: { title: null, description: null, openGraphTitle: null, openGraphDescription: null },
    });
  });

  it.each(["null-acf", "partial"])("lists tolerate %s content", async (scenario) => {
    stub.setScenario(scenario);
    const { items } = await api.getInsights("en");
    expect(items).toHaveLength(5);
    expect(items.every((i) => i.eventDetails === null && !i.isFeatured && i.image === null)).toBe(true);
  });
});

describe("locale mismatch", () => {
  it("an Arabic request answered with the English record resolves null, not the English article", async () => {
    // Polylang serves the English record for /ar/<slug>/ while no Arabic one exists.
    stub.setScenario(NO_ARABIC_INSIGHTS);
    await expect(api.getInsight(uris("en").insight, "ar")).resolves.toBeNull();
    expect(last().variables).toEqual({ uri: "/ar/insights/lead-article/" });
    expect(last().data.insight).toMatchObject({ language: { code: "EN" } }); // it really was served
    expect(stub.graphqlRequests()).toHaveLength(1); // and no English retry was made
  });

  it("an English request answered with an Arabic record resolves null", async () => {
    await expect(api.getInsight(uris("ar").insight, "en")).resolves.toBeNull();
    expect(last().variables).toEqual({ uri: "/ar/insights/lead-article/" });
    expect(last().data.insight).toMatchObject({ language: { code: "AR" } });
  });

  it("the English lookup of the same slug still works", async () => {
    stub.setScenario(NO_ARABIC_INSIGHTS);
    await expect(api.getInsight(uris("en").insight, "en")).resolves.toMatchObject({ locale: "en" });
  });
});

describe("taxonomies", () => {
  it("lists Insight types and topics, language-neutral, with the all-language count", async () => {
    const types = await api.getInsightTypes();
    expect(last()).toMatchObject({ operation: "InsightTypes", variables: {} });
    expect(types).toEqual([
      { name: "Article", slug: "article", allLanguagesCount: 4 },
      { name: "Event", slug: "event", allLanguagesCount: 4 },
      { name: "News", slug: "news", allLanguagesCount: 2 },
    ]);
    const topics = await api.getInsightTopics();
    expect(last()).toMatchObject({ operation: "InsightTopics", variables: {} });
    expect(topics.map((t) => t.slug)).toEqual([
      "ai-digital-acceleration",
      "clarity-speed",
      "culture-excellence",
      "value-growth",
    ]);
  });

  it("does not ask the CMS for term languages (both fail on the live schema)", () => {
    for (const query of [INSIGHT_TYPES, INSIGHT_TOPICS]) {
      expect(query).not.toMatch(/language/i);
    }
  });

  it("tolerates empty and partial term data", async () => {
    stub.setScenario("empty");
    expect(await api.getInsightTypes()).toEqual([]);
    stub.setScenario("partial");
    expect((await api.getInsightTopics())[0]).toMatchObject({ allLanguagesCount: null });
  });
});

describe("taxonomy filtering from the term side", () => {
  it("queries insightType by slug, never with taxQuery", async () => {
    await api.getInsightsByTerm("type", "article", "en");
    expect(last()).toMatchObject({
      operation: "InsightTypeInsights",
      variables: { slug: "article", first: 12 },
    });
    expect(last().query).toMatch(/insightType\(id:\s*\$slug,\s*idType:\s*SLUG\)/);
    expect(last().query).not.toMatch(/taxQuery/);
    await api.getInsightsByTerm("topic", "clarity-speed", "en");
    expect(last().operation).toBe("InsightTopicInsights");
    expect(last().query).toMatch(/insightTopic\(id:\s*\$slug,\s*idType:\s*SLUG\)/);
  });

  it("returns the term and only the requested language's records", async () => {
    const en = await api.getInsightsByTerm("type", "article", "en");
    expect(en?.term).toEqual({ name: "Article", slug: "article", allLanguagesCount: 4 });
    expect(slugs(en!.page.items)).toEqual(["lead-article", "minimal-article"]);
    expect(en!.page.items.every((i) => i.locale === "en")).toBe(true);
    // the CMS really did send both languages: the filtering is the client's
    expect(last().data.insightType.insights.nodes).toHaveLength(4);

    const ar = await api.getInsightsByTerm("type", "article", "ar");
    expect(slugs(ar!.page.items)).toEqual(["lead-article", "minimal-article"]);
    expect(ar!.page.items.every((i) => i.locale === "ar" && i.uri.startsWith("/ar/"))).toBe(true);
  });

  it("filters by topic the same way", async () => {
    const result = await api.getInsightsByTerm("topic", "clarity-speed", "en");
    expect(slugs(result!.page.items)).toEqual(["lead-article", "event-conference"]);
  });

  it("is empty for Arabic while no Arabic Insights exist", async () => {
    stub.setScenario(NO_ARABIC_INSIGHTS);
    const ar = await api.getInsightsByTerm("type", "article", "ar");
    expect(ar?.page.items).toEqual([]);
    expect(ar?.term.allLanguagesCount).toBe(2); // English only
    expect((await api.getInsightsByTerm("type", "article", "en"))!.page.items).toHaveLength(2);
  });

  it("an unknown term, and an empty CMS, resolve null", async () => {
    await expect(api.getInsightsByTerm("type", "nope", "en")).resolves.toBeNull();
    stub.setScenario("empty");
    await expect(api.getInsightsByTerm("type", "article", "en")).resolves.toBeNull();
  });

  it("paginates by cursor; a page of another language's records may be short but still has a next page", async () => {
    // Raw page 1 holds [lead-article EN]; the Arabic filter empties it, more pages remain.
    const first = await api.getInsightsByTerm("type", "article", "ar", 1);
    expect(first!.page.items).toEqual([]);
    expect(first!.page.hasNextPage).toBe(true);

    const seen: string[] = [];
    let after: string | undefined;
    for (let guard = 0; guard < 10; guard++) {
      const result = await api.getInsightsByTerm("type", "article", "ar", 1, after);
      seen.push(...slugs(result!.page.items));
      if (!result!.page.hasNextPage) break;
      after = result!.page.endCursor ?? undefined;
    }
    expect(seen).toEqual(["lead-article", "minimal-article"]);
  });
});

describe("errors", () => {
  const CALLS = [
    ["getInsights", () => api.getInsights("en")],
    ["getInsight", () => api.getInsight(uris("en").insight, "en")],
    ["getInsightTypes", () => api.getInsightTypes()],
    ["getInsightsByTerm", () => api.getInsightsByTerm("type", "article", "en")],
  ] as const;

  it.each(CALLS)("%s: a GraphQL error rejects and is never read as empty content", async (_n, call) => {
    stub.setScenario("graphql-error");
    await expect(call()).rejects.toMatchObject({ name: "WpRequestError", kind: "graphql" });
  });

  it.each(CALLS)("%s: a network failure rejects as `network`", async (_n, call) => {
    stub.setScenario("network-error");
    await expect(call()).rejects.toMatchObject({ kind: "network" });
  });

  it.each(CALLS)("%s: an HTTP failure rejects as `http`", async (_n, call) => {
    stub.setScenario("http-error");
    await expect(call()).rejects.toMatchObject({ kind: "http", status: 500 });
  });

  it("partial data with errors rejects: the data is discarded", async () => {
    stub.setScenario("partial-errors");
    await expect(api.getInsights("en")).rejects.toThrow(/stub: partial failure/);
  });
});

describe("locale-aware caching", () => {
  it("every key carries the locale, so EN and AR never share an entry", () => {
    expect(wpKeys.insights("en", 12)).not.toEqual(wpKeys.insights("ar", 12));
    expect(wpKeys.insight("/insights/x/", "en")).not.toEqual(wpKeys.insight("/insights/x/", "ar"));
    expect(wpKeys.insightTerms("type", "en")).not.toEqual(wpKeys.insightTerms("type", "ar"));
    expect(wpKeys.insightsByTerm("type", "a", "en", 12)).not.toEqual(
      wpKeys.insightsByTerm("type", "a", "ar", 12),
    );
  });

  it("pages, page sizes and term kinds are separate entries; `posts` is untouched", () => {
    const keys = [
      wpKeys.insights("en", 12),
      wpKeys.insights("en", 12, "c1"),
      wpKeys.insights("en", 6),
      wpKeys.insightsByTerm("type", "article", "en", 12),
      wpKeys.insightsByTerm("topic", "article", "en", 12),
      wpKeys.insightTerms("type", "en"),
      wpKeys.insightTerms("topic", "en"),
      wpKeys.posts("en"),
    ].map((k) => JSON.stringify(k));
    expect(new Set(keys).size).toBe(keys.length);
    expect(wpKeys.insights("en", 12, null)).toEqual(wpKeys.insights("en", 12));
  });

  it("one locale's entries share a prefix that excludes the other locale", () => {
    const prefix = ["wp", "insights", "ar"];
    expect(wpKeys.insights("ar", 12).slice(0, 3)).toEqual(prefix);
    expect(wpKeys.insightsByTerm("type", "a", "ar", 12).slice(0, 3)).toEqual(prefix);
    expect(wpKeys.insights("en", 12).slice(0, 3)).not.toEqual(prefix);
  });

  it("prefetching both locales into one client keeps them apart", async () => {
    const qc = new QueryClient();
    await server.prefetchInsights(qc, "en");
    await server.prefetchInsights(qc, "ar");
    const en = qc.getQueryData<Awaited<ReturnType<typeof api.getInsights>>>(wpKeys.insights("en", 12))!;
    const ar = qc.getQueryData<Awaited<ReturnType<typeof api.getInsights>>>(wpKeys.insights("ar", 12))!;
    expect(en.items.every((i) => i.locale === "en")).toBe(true);
    expect(ar.items.every((i) => i.locale === "ar")).toBe(true);

    await server.prefetchInsight(qc, uris("en").insight, "en");
    await server.prefetchInsight(qc, uris("en").insight, "ar");
    expect(qc.getQueryData<{ locale: string }>(wpKeys.insight(uris("en").insight, "en"))?.locale).toBe("en");
    expect(qc.getQueryData<{ locale: string }>(wpKeys.insight(uris("en").insight, "ar"))?.locale).toBe("ar");
  });

  it("a locale mismatch is cached as null under its own key, not as the English article", async () => {
    stub.setScenario(NO_ARABIC_INSIGHTS);
    const qc = new QueryClient();
    await expect(server.prefetchInsight(qc, uris("en").insight, "ar")).resolves.toBeNull();
    expect(qc.getQueryData(wpKeys.insight(uris("en").insight, "ar"))).toBeNull();
    expect(qc.getQueryData(wpKeys.insight(uris("en").insight, "en"))).toBeUndefined();
  });

  it("prefetch helpers resolve the normalized values", async () => {
    const qc = new QueryClient();
    expect((await server.prefetchInsightTypes(qc, "en")).map((t) => t.slug)).toEqual(["article", "event", "news"]);
    expect((await server.prefetchInsightTopics(qc, "en")).length).toBe(4);
    const byTerm = await server.prefetchInsightsByTerm(qc, "type", "news", "en");
    expect(slugs(byTerm!.page.items)).toEqual(["news-update"]);
    expect(qc.getQueryData(wpKeys.insightsByTerm("type", "news", "en", 12))).toBe(byTerm);
  });
});
