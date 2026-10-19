import { QueryClient, dehydrate } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INSIGHTS_LIMIT, toInsights } from "@/lib/content-adapters";
import { loadInsightsFeed } from "@/lib/insights-feed";
import { wpKeys } from "@/lib/wp/keys";
import { getLatestPostCards } from "@/lib/wp/api";
import type { PostCard, PostListItem } from "@/lib/wp";
import { startCmsStub } from "../../support/cms-stub/harness";

/**
 * The server half of the Insights route: prefetch through lib/wp into a
 * per-request QueryClient and decide CMS vs static fallback. Runs the real
 * client, prefetch helper and normalizers against the CMS stub.
 */

const stub = startCmsStub();

const load = (locale: "en" | "ar" = "en") => {
  const qc = new QueryClient();
  return loadInsightsFeed(qc, locale).then((feed) => ({ feed, qc }));
};
const ops = () => stub.graphqlRequests().map((r) => [r.operation, r.variables?.language]);

afterEach(() => vi.restoreAllMocks());

describe("loadInsightsFeed: CMS content", () => {
  it.each([
    ["en", "EN"],
    ["ar", "AR"],
  ] as const)("serves %s posts from the CMS with one request and a locale-keyed cache entry", async (locale, language) => {
    const { feed, qc } = await load(locale);
    expect(feed).toEqual({ source: "cms" });
    expect(ops()).toEqual([["Posts", language]]);
    expect(dehydrate(qc).queries.map((q) => q.queryKey)).toEqual([wpKeys.latestPosts(locale, INSIGHTS_LIMIT)]);
  });

  it.each(["null-acf", "partial"] as const)("treats %s posts as CMS content (adapter fills the gaps)", async (scenario) => {
    stub.setScenario(scenario);
    const { feed, qc } = await load();
    expect(feed.source).toBe("cms");
    const [{ state }] = dehydrate(qc).queries.map((q) => ({ state: q.state.data as PostCard[] }));
    expect(toInsights(state)[0]).toMatchObject({ category: "Insights", image: "/assets/insights/i1.svg" });
  });

  it("a valid empty CMS selects the static fallback, and says it was empty", async () => {
    stub.setScenario("empty");
    const { feed, qc } = await load();
    expect(feed).toEqual({ source: "fallback-empty" });
    expect(dehydrate(qc).queries[0].state.data).toEqual([]); // a real, successful empty answer
    expect(ops()).toHaveLength(1);
  });
});

describe("loadInsightsFeed: infrastructure failures are never empty content", () => {
  const originalError = console.error;
  afterEach(() => {
    console.error = originalError;
  });

  it.each([
    ["graphql-error", "graphql", undefined],
    ["partial-errors", "graphql", undefined],
    ["http-error", "http", 500],
    ["malformed-json", "malformed", undefined],
    ["malformed-shape", "missing-root", undefined],
    ["no-data", "malformed", undefined],
    ["network-error", "network", undefined],
  ] as const)("%s -> fallback-error (%s)", async (scenario, kind, status) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    stub.setScenario(scenario);
    const { feed, qc } = await load();
    expect(feed.source).toBe("fallback-error");
    expect(feed.failure).toEqual({ kind, ...(status ? { status } : {}) });
    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0][0])).toContain(`CMS unavailable (${kind}`);
    expect(dehydrate(qc).queries).toEqual([]); // a failed query is never handed to the client
    // An unusable 200 body gets exactly one fresh (no-store) re-ask; transport failures none.
    expect(stub.graphqlRequests()).toHaveLength(["graphql", "malformed", "missing-root"].includes(kind) ? 2 : 1);
  });

  it("a hung CMS ends as a timeout fallback, not a hang", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const realTimeout = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, "timeout").mockImplementation(() => realTimeout(100));
    stub.setScenario("hang");
    const { feed } = await load();
    expect(feed).toEqual({ source: "fallback-error", failure: { kind: "timeout" } });
  });

  it("a stalled body also ends as a timeout fallback", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const realTimeout = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, "timeout").mockImplementation(() => realTimeout(100));
    stub.setScenario("stalled-body");
    expect((await load()).feed.failure).toEqual({ kind: "timeout" });
  });

  it("a missing endpoint is a config failure (fallback, logged), not an empty CMS", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT", "");
    const { feed } = await load();
    expect(feed).toEqual({ source: "fallback-error", failure: { kind: "config" } });
    expect(log).toHaveBeenCalledOnce();
    expect(stub.requests).toHaveLength(0);
  });

  it("the log line carries no query text, variables or endpoint", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    stub.setScenario("http-error");
    await load();
    const line = String(log.mock.calls[0][0]);
    expect(line).not.toMatch(/query|variables|127\.0\.0\.1|http:/i);
  });
});

describe("loadInsightsFeed: not a CMS outcome -> rethrown", () => {
  it("cancellation propagates instead of selecting the fallback", async () => {
    const abort = new DOMException("aborted", "AbortError");
    await expect(loadInsightsFeed(new QueryClient(), "en", () => Promise.reject(abort))).rejects.toBe(abort);
  });

  it("a programming error propagates instead of being masked by the fallback", async () => {
    const bug = new TypeError("x is not a function");
    await expect(loadInsightsFeed(new QueryClient(), "en", () => Promise.reject(bug))).rejects.toBe(bug);
  });
});

describe("bounded fetch and minimal hydration payload", () => {
  const FIELDS = ["categories", "image", "slug", "title"];

  it("asks the CMS for exactly the cards the page shows", async () => {
    await load();
    expect(stub.graphqlRequests()[0].variables).toMatchObject({ first: INSIGHTS_LIMIT, language: "EN" });
  });

  it("dehydrates only teaser fields: no excerpt, date, id, uri or body", async () => {
    const { qc } = await load();
    const dehydrated = dehydrate(qc);
    const cards = dehydrated.queries[0].state.data as PostCard[];
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect(Object.keys(card).sort()).toEqual(FIELDS);
    const json = JSON.stringify(dehydrated);
    for (const dropped of ["excerpt", "databaseId", "uri", "date", "content"]) {
      expect(json, dropped).not.toContain(`"${dropped}"`);
    }
    expect(json.length).toBeLessThan(1_500);
  });

  it("does not touch the shared full-list cache entry", async () => {
    const { qc } = await load();
    expect(qc.getQueryData(wpKeys.posts("en"))).toBeUndefined();
  });

  it("stays bounded however much the CMS returns: count, categories and bytes", async () => {
    const node = (n: number) => ({
      databaseId: n,
      title: `Post ${n}`,
      slug: `post-${n}`,
      uri: `/blog/post-${n}/`,
      date: "2026-01-01T00:00:00",
      excerpt: `<p>${"x".repeat(20_000)}</p>`,
      featuredImage: { node: { sourceUrl: `http://127.0.0.1/${n}.jpg`, altText: "a" } },
      categories: { nodes: ["A", "B", "C"].map((name) => ({ name, slug: name.toLowerCase() })) },
    });
    // A CMS that ignores `first` and returns ten fat posts.
    vi.stubGlobal("fetch", async () =>
      new Response(JSON.stringify({ data: { posts: { nodes: Array.from({ length: 10 }, (_, i) => node(i)) } } })),
    );
    const cards = await getLatestPostCards("en", INSIGHTS_LIMIT);
    expect(cards).toHaveLength(INSIGHTS_LIMIT);
    expect(cards.every((c) => c.categories.length === 1)).toBe(true);

    const qc = new QueryClient();
    await loadInsightsFeed(qc, "en");
    expect(JSON.stringify(dehydrate(qc)).length).toBeLessThan(1_500); // not 200 KB
  });
});

describe("toInsights", () => {
  const post = (n: number): PostListItem => ({
    databaseId: n,
    title: `P${n}`,
    slug: `p${n}`,
    uri: `/blog/p${n}/`,
    date: "2026-01-01T00:00:00",
    excerpt: null,
    image: null,
    categories: [],
  });

  it(`keeps the first ${INSIGHTS_LIMIT} posts, in CMS order`, () => {
    expect(toInsights([1, 2, 3, 4, 5].map(post)).map((i) => i.title)).toEqual(["P1", "P2", "P3"]);
  });

  it("maps an empty list to no cards", () => {
    expect(toInsights([])).toEqual([]);
  });
});
