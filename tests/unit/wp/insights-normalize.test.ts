import { describe, expect, it } from "vitest";
import {
  insightLocaleOf,
  normalizeInsight,
  normalizeInsightListItem,
  normalizeInsightPage,
  normalizeInsightTermSummary,
  type RawInsight,
} from "@/lib/wp/normalize";

/** Pure edge cases of the Insight normalizers (no stub, no network). */

const raw = (over: Partial<RawInsight> = {}): RawInsight => ({
  databaseId: 1,
  title: "Title",
  slug: "title",
  uri: "/insights/title/",
  date: "2026-10-01T09:00:00",
  excerpt: "<p>x</p>",
  language: { code: "EN" },
  translations: [],
  featuredImage: null,
  insightTypes: { nodes: [{ name: "Article", slug: "article" }] },
  insightTopics: { nodes: [] },
  insightContent: { isFeatured: false },
  eventDetails: null,
  ...over,
});

describe("language guard", () => {
  it("reads the Polylang code case-insensitively and rejects anything else", () => {
    expect(insightLocaleOf({ code: "EN" })).toBe("en");
    expect(insightLocaleOf({ code: "ar" })).toBe("ar");
    expect(insightLocaleOf({ code: "FR" })).toBeNull();
    expect(insightLocaleOf({ code: null })).toBeNull();
    expect(insightLocaleOf(null)).toBeNull();
    expect(insightLocaleOf(undefined)).toBeNull();
  });

  it("accepts a record only in the locale it was requested for", () => {
    expect(normalizeInsightListItem(raw(), "en")).toMatchObject({ locale: "en" });
    expect(normalizeInsightListItem(raw(), "ar")).toBeNull();
    expect(normalizeInsightListItem(raw({ language: { code: "AR" } }), "en")).toBeNull();
    expect(normalizeInsightListItem(raw({ language: { code: "AR" } }), "ar")).toMatchObject({ locale: "ar" });
  });

  it("rejects a record whose language is missing: it cannot be verified", () => {
    expect(normalizeInsightListItem(raw({ language: null }), "en")).toBeNull();
    expect(normalizeInsight(raw({ language: { code: null } }), "en")).toBeNull();
  });

  it("rejects null and records without an authoritative uri", () => {
    expect(normalizeInsightListItem(null, "en")).toBeNull();
    expect(normalizeInsightListItem(raw({ uri: null }), "en")).toBeNull();
    expect(normalizeInsight(null, "en")).toBeNull();
  });

  it("never rewrites the uri", () => {
    expect(normalizeInsightListItem(raw({ uri: "/ar/insights/x/", language: { code: "AR" } }), "ar")!.uri).toBe(
      "/ar/insights/x/",
    );
  });
});

describe("translations", () => {
  it("keeps valid counterparts with a lowercase locale and the CMS uri", () => {
    const item = normalizeInsightListItem(
      raw({
        translations: [
          { uri: "/ar/insights/title/", language: { code: "AR" } },
          { uri: null, language: { code: "AR" } },
          { uri: "/fr/insights/title/", language: { code: "FR" } },
          { uri: "/x/", language: null },
        ],
      }),
      "en",
    )!;
    expect(item.translations).toEqual([{ locale: "ar", uri: "/ar/insights/title/" }]);
  });

  it("null translations are an empty list", () => {
    expect(normalizeInsightListItem(raw({ translations: null }), "en")!.translations).toEqual([]);
  });
});

describe("eventDetails", () => {
  const event = (eventDetails: RawInsight["eventDetails"]) =>
    normalizeInsightListItem(raw({ eventDetails }), "en")!.eventDetails;

  it("is null for records without event data, and when every field is empty", () => {
    expect(event(null)).toBeNull();
    expect(event({ eventStart: null, eventEnd: null, eventLocation: null, eventUrl: null })).toBeNull();
    expect(event({ eventStart: " ", eventEnd: "", eventLocation: "\n", eventUrl: " " })).toBeNull();
  });

  it("trims text and keeps every field independently optional", () => {
    expect(
      event({ eventStart: " 2026-11-17T00:00:00+00:00 ", eventEnd: null, eventLocation: " Muscat ", eventUrl: null }),
    ).toEqual({ start: "2026-11-17T00:00:00+00:00", end: null, location: "Muscat", url: null });
  });

  it("keeps http(s) and root-relative links, and drops anything executable or protocol-relative", () => {
    const url = (eventUrl: string) =>
      event({ eventStart: "2026-11-17T00:00:00+00:00", eventEnd: null, eventLocation: null, eventUrl })!.url;
    expect(url("https://example.test/register")).toBe("https://example.test/register");
    expect(url("HTTP://example.test")).toBe("HTTP://example.test");
    expect(url("/contact")).toBe("/contact");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.test/x", "example.test", "mailto:a@b.c"]) {
      expect(url(bad), bad).toBeNull();
    }
  });
});

describe("featured flag", () => {
  it("is false unless the CMS sent true", () => {
    for (const insightContent of [null, { isFeatured: null }, { isFeatured: false }]) {
      expect(normalizeInsightListItem(raw({ insightContent }), "en")!.isFeatured).toBe(false);
    }
    expect(normalizeInsightListItem(raw({ insightContent: { isFeatured: true } }), "en")!.isFeatured).toBe(true);
  });

  it("invents no uniqueness or ordering: several flagged items and the CMS order survive", () => {
    const flagged = (slug: string, isFeatured: boolean) =>
      raw({ slug, uri: `/insights/${slug}/`, insightContent: { isFeatured } });
    const page = normalizeInsightPage(
      { pageInfo: { hasNextPage: false, endCursor: null } },
      [flagged("a", false), flagged("b", true), flagged("c", true), flagged("d", false)],
      "en",
    );
    expect(page.items.map((i) => [i.slug, i.isFeatured])).toEqual([
      ["a", false],
      ["b", true],
      ["c", true],
      ["d", false],
    ]);
  });
});

describe("terms, image and text", () => {
  it("drops terms without a name or slug", () => {
    const item = normalizeInsightListItem(
      raw({
        insightTypes: { nodes: [{ name: "Event", slug: "event" }, { name: null, slug: "x" }, { name: "Y", slug: null }] },
        insightTopics: null,
      }),
      "en",
    )!;
    expect(item.types).toEqual([{ name: "Event", slug: "event" }]);
    expect(item.topics).toEqual([]);
  });

  it("normalizes a missing image, and a missing date, to null", () => {
    const item = normalizeInsightListItem(
      raw({ featuredImage: { node: { sourceUrl: null, altText: "x" } }, date: null }),
      "en",
    )!;
    expect(item.image).toBeNull();
    expect(item.date).toBeNull();
  });

  it("turns empty SEO strings into null and trims the rest", () => {
    const insight = normalizeInsight(
      raw({
        content: "<p>b</p>",
        seo: { title: " T ", metaDesc: "", opengraphTitle: null, opengraphDescription: "  " },
      }),
      "en",
    )!;
    expect(insight.seo).toEqual({ title: "T", description: null, openGraphTitle: null, openGraphDescription: null });
    expect(insight.content).toBe("<p>b</p>");
  });

  it("a missing seo object is four nulls", () => {
    expect(normalizeInsight(raw({ seo: null }), "en")!.seo).toEqual({
      title: null,
      description: null,
      openGraphTitle: null,
      openGraphDescription: null,
    });
  });
});

describe("page and term summary", () => {
  it("drops records of other languages from a page", () => {
    const page = normalizeInsightPage(
      { pageInfo: { hasNextPage: true, endCursor: "c" } },
      [raw(), raw({ uri: "/ar/insights/title/", language: { code: "AR" } }), raw({ uri: "/x/", language: null })],
      "en",
    );
    expect(page.items.map((i) => i.uri)).toEqual(["/insights/title/"]);
    expect(page).toMatchObject({ hasNextPage: true, endCursor: "c" });
  });

  it("treats a missing pageInfo as the last page", () => {
    expect(normalizeInsightPage({}, [], "en")).toEqual({ items: [], hasNextPage: false, endCursor: null });
  });

  it("summarizes a term, or null without a slug", () => {
    expect(normalizeInsightTermSummary({ name: "Article", slug: "article", count: 3 })).toEqual({
      name: "Article",
      slug: "article",
      allLanguagesCount: 3,
    });
    expect(normalizeInsightTermSummary({ name: "A", slug: "a" })!.allLanguagesCount).toBeNull();
    expect(normalizeInsightTermSummary({ name: "A", slug: null })).toBeNull();
    expect(normalizeInsightTermSummary(null)).toBeNull();
  });
});
