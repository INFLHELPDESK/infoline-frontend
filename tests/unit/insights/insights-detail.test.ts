import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadInsightDetail, loadRelatedInsights, toInsightDetail } from "@/lib/insights-detail";
import { WpRequestError } from "@/lib/wp/client";
import type { Insight } from "@/lib/wp/types";

vi.mock("@/providers/query-client/get-query-client", () => ({ getQueryClient: () => ({}) }));

const insight = (over: Partial<Insight> = {}): Insight => ({
  databaseId: 1,
  title: "A title",
  slug: "a-title",
  uri: "/insights/a-title/",
  date: "2026-10-12T09:00:00",
  excerpt: "<p>Short excerpt</p>\n",
  image: { src: "https://cms.test/a.jpg", alt: "alt" },
  locale: "en",
  translations: [],
  types: [{ name: "Article", slug: "article" }],
  topics: [{ name: "Clarity & Speed", slug: "clarity-speed" }],
  isFeatured: false,
  eventDetails: null,
  content: "<p>Lead.</p>\n<p>Body.</p>\n",
  seo: { title: "SEO title", description: "SEO description", openGraphTitle: null, openGraphDescription: null },
  ...over,
});

const prefetch = vi.fn();
beforeEach(() => prefetch.mockReset());
const load = (slug: string, locale: "en" | "ar" = "en") =>
  loadInsightDetail(slug, locale, {}, prefetch as never);

describe("loadInsightDetail", () => {
  it("looks the record up by its authoritative /insights/<slug>/ URI in the requested locale", async () => {
    prefetch.mockResolvedValue(insight());
    const result = await load("a-title");
    expect(prefetch).toHaveBeenCalledWith({}, "/insights/a-title/", "en");
    expect(result.kind).toBe("cms");
  });

  it("asks for the Arabic record in Arabic and never rewrites to English", async () => {
    prefetch.mockResolvedValue(
      insight({ locale: "ar", uri: "/ar/insights/a-title/", title: "عنوان", content: "<p>نص</p>", excerpt: null }),
    );
    const result = await load("a-title", "ar");
    expect(prefetch).toHaveBeenCalledWith({}, "/insights/a-title/", "ar");
    expect(result.kind === "cms" && result.detail.post.title).toBe("عنوان");
    expect(result.kind === "cms" && result.detail.post.href).toBe("/insights/a-title");
  });

  it("treats a record the data layer rejected for locale (null) as not found", async () => {
    prefetch.mockResolvedValue(null);
    expect((await load("english-only", "ar")).kind).toBe("not-found");
  });

  it("treats a missing or unpublished record as not found", async () => {
    prefetch.mockResolvedValue(null);
    expect((await load("gone")).kind).toBe("not-found");
  });

  it("does not send junk slugs to the CMS", async () => {
    for (const slug of ["a/b", "..", "x%00y", "a b", "a".repeat(101), "%E0%A4%A", ""]) {
      expect((await load(slug)).kind).toBe("not-found");
    }
    expect(prefetch).not.toHaveBeenCalled();
  });

  it("accepts a percent-encoded non-Latin slug", async () => {
    prefetch.mockResolvedValue(insight({ slug: "مقال" }));
    await load(encodeURIComponent("مقال"));
    expect(prefetch).toHaveBeenCalledWith({}, "/insights/مقال/", "en");
  });

  it("reports an incomplete record (no title, or nothing to read)", async () => {
    prefetch.mockResolvedValueOnce(insight({ title: "  " }));
    expect((await load("a")).kind).toBe("incomplete");
    prefetch.mockResolvedValueOnce(insight({ content: null, excerpt: null }));
    expect((await load("a")).kind).toBe("incomplete");
  });

  it("turns a CMS failure into `error`, not not-found", async () => {
    const error = new WpRequestError("timeout", "timed out");
    vi.spyOn(console, "error").mockImplementation(() => {});
    // A plain function: a vi.fn would track the rejected promise as unhandled.
    const result = await loadInsightDetail("a", "en", {}, () => Promise.reject(error));
    expect(result).toMatchObject({ kind: "error", failure: { kind: "timeout" } });
  });

  it("rethrows anything that is not a CMS infrastructure failure", async () => {
    await expect(loadInsightDetail("a", "en", {}, () => Promise.reject(new TypeError("bug")))).rejects.toThrow("bug");
  });
});

describe("toInsightDetail", () => {
  it("maps title, excerpt, image, date, type and topic", () => {
    const d = toInsightDetail(insight(), "en", { article: "Articles" });
    expect(d).toMatchObject({
      type: "article",
      topic: "Clarity & Speed",
      backHref: "/blog",
      post: {
        title: "A title",
        excerpt: "Short excerpt",
        image: "https://cms.test/a.jpg",
        date: "2026-10-12",
        category: "Articles",
      },
    });
    expect(d?.post.dateLabel).toMatch(/2026/);
  });

  it("calculates reading time from the body, not the excerpt", () => {
    const words = (n: number) => `<p>${Array(n).fill("word").join(" ")}</p>`;
    expect(toInsightDetail(insight({ content: words(450) }), "en")?.readMinutes).toBe(3);
    expect(toInsightDetail(insight({ content: words(5) }), "en")?.readMinutes).toBe(1);
    expect(toInsightDetail(insight({ content: null }), "en")?.readMinutes).toBeUndefined();
  });

  it("falls back to the excerpt as the article when there is no body", () => {
    const d = toInsightDetail(insight({ content: null }), "en");
    expect(d?.bodyHtml).toBe("");
    expect(d?.post.body).toEqual(["Short excerpt"]);
  });

  it("uses the default image when the record has none", () => {
    expect(toInsightDetail(insight({ image: null }), "en")?.post.image).toBe("/assets/insights/i1.svg");
  });

  it("sanitizes the body", () => {
    const d = toInsightDetail(insight({ content: '<p>ok</p><script>x()</script><a href="javascript:1">l</a>' }), "en");
    expect(d?.bodyHtml).toBe("<p>ok</p>l");
  });

  it.each([
    ["news", "News", "/insights"],
    ["event", "Event", "/insights"],
  ])("a %s item goes back to Insights, not the Blog", (slug, name, back) => {
    const d = toInsightDetail(insight({ types: [{ name, slug }] }), "en");
    expect(d?.type).toBe(slug);
    expect(d?.backHref).toBe(back);
  });

  it("carries event details only when the CMS has them", () => {
    const event = { start: "2026-11-17T00:00:00+00:00", end: null, location: "Muscat", url: "https://example.test/r" };
    expect(toInsightDetail(insight({ types: [{ name: "Event", slug: "event" }], eventDetails: event }), "en")?.event).toEqual(event);
    expect(toInsightDetail(insight(), "en")?.event).toBeNull();
  });

  it("keeps translation URIs and gives router paths without a doubled locale", () => {
    const d = toInsightDetail(
      insight({ translations: [{ locale: "ar", uri: "/ar/insights/a-title/" }] }),
      "en",
    );
    expect(d?.translations).toEqual([{ locale: "ar", uri: "/ar/insights/a-title/", href: "/insights/a-title" }]);
    const ar = toInsightDetail(
      insight({ locale: "ar", uri: "/ar/insights/a-title/", translations: [{ locale: "en", uri: "/insights/a-title/" }] }),
      "ar",
    );
    expect(ar?.post.href).toBe("/insights/a-title");
    expect(ar?.post.href).not.toMatch(/\/ar\/ar|^\/ar/);
  });
});

describe("loadRelatedInsights", () => {
  const item = (id: number) => ({ ...insight({ databaseId: id, slug: `s${id}`, uri: `/insights/s${id}/` }) });
  const listing = (ids: number[]) =>
    vi.fn().mockResolvedValue({ status: "cms", items: ids.map(item), hasNextPage: false, endCursor: null });

  it("asks for one extra record, drops the current one and de-duplicates", async () => {
    const list = listing([1, 2, 2, 3, 4]);
    const posts = await loadRelatedInsights("en", 1, {}, 3, list as never);
    expect(list).toHaveBeenCalledWith({}, "en", 4);
    expect(posts.map((p) => p.id)).toEqual([2, 3, 4]);
  });

  it("is empty on a CMS failure or an empty listing", async () => {
    const error = vi.fn().mockResolvedValue({ status: "error", failure: { kind: "network" } });
    const empty = vi.fn().mockResolvedValue({ status: "empty" });
    expect(await loadRelatedInsights("en", 1, {}, 3, error as never)).toEqual([]);
    expect(await loadRelatedInsights("ar", 1, {}, 3, empty as never)).toEqual([]);
  });
});
