import { describe, expect, it } from "vitest";
import {
  cardToBlogPost,
  cardToInsight,
  insightHref,
  mergeById,
  pickFeatured,
  readingMinutes,
  toInsightCard,
  typeLabelsFromFilters,
} from "@/lib/insights-cards";
import type { Insight, InsightListItem } from "@/lib/wp/types";

const item = (over: Partial<InsightListItem> = {}): InsightListItem => ({
  databaseId: 1,
  title: "A title",
  slug: "a-title",
  uri: "/insights/a-title/",
  date: "2026-10-12T09:00:00",
  excerpt: "<p>Short   excerpt &amp; more</p>\n",
  image: { src: "https://cms.test/a.jpg", alt: "alt" },
  locale: "en",
  translations: [],
  types: [{ name: "Article", slug: "article" }],
  topics: [],
  isFeatured: false,
  eventDetails: null,
  ...over,
});

describe("insightHref", () => {
  it("keeps an English CMS URI as the router path, without the trailing slash", () => {
    expect(insightHref("/insights/a-title/", "en")).toBe("/insights/a-title");
  });

  it("drops the /ar segment so the locale-aware Link does not add it twice", () => {
    expect(insightHref("/ar/insights/a-title/", "ar")).toBe("/insights/a-title");
    expect(insightHref("/ar/", "ar")).toBe("/");
  });

  it("does not touch an English URI that merely starts with `ar`", () => {
    expect(insightHref("/arabic-news/", "ar")).toBe("/arabic-news");
  });

  it("repairs a URI with no leading slash", () => {
    expect(insightHref("insights/x/", "en")).toBe("/insights/x");
  });
});

describe("toInsightCard", () => {
  it("keeps the authoritative CMS URI and derives a separate router href", () => {
    const card = toInsightCard(item({ uri: "/ar/insights/x/", locale: "ar" }));
    expect(card.uri).toBe("/ar/insights/x/");
    expect(card.href).toBe("/insights/x");
  });

  it("uses the localized type label, falling back to the CMS term name", () => {
    const labels = typeLabelsFromFilters([
      { id: "all", label: "الكل" },
      { id: "articles", label: "مقالات" },
      { id: "events", label: "فعاليات" },
    ]);
    expect(toInsightCard(item(), labels).category).toBe("مقالات");
    expect(toInsightCard(item({ types: [{ name: "News", slug: "news" }] }), labels).category).toBe("News");
    expect(toInsightCard(item({ types: [] })).category).toBe("");
    expect(toInsightCard(item({ types: [] })).type).toBeNull();
  });

  it("strips the excerpt to plain text and caps it", () => {
    expect(toInsightCard(item()).excerpt).toBe("Short excerpt & more");
    const long = toInsightCard(item({ excerpt: `<p>${"word ".repeat(100)}</p>` })).excerpt!;
    expect(long.length).toBeLessThanOrEqual(161);
    expect(long.endsWith("…")).toBe(true);
    expect(toInsightCard(item({ excerpt: null })).excerpt).toBeNull();
  });

  it("falls back to the default art when there is no featured image", () => {
    expect(toInsightCard(item({ image: null })).image).toBe("/assets/insights/i1.svg");
  });

  it("computes no reading time for a list item (no body), but does when content is present", () => {
    expect(toInsightCard(item()).readMinutes).toBeUndefined();
    const full = { ...item(), content: `<p>${"word ".repeat(450)}</p>`, seo: {} } as unknown as Insight;
    expect(toInsightCard(full).readMinutes).toBe(3);
  });
});

describe("readingMinutes", () => {
  it("rounds up at 200 words per minute, minimum one minute", () => {
    expect(readingMinutes("<p>one two three</p>")).toBe(1);
    expect(readingMinutes(`<p>${"w ".repeat(200)}</p>`)).toBe(1);
    expect(readingMinutes(`<p>${"w ".repeat(201)}</p>`)).toBe(2);
  });

  it("handles missing, empty, non-text and non-string content without throwing", () => {
    for (const value of [null, undefined, "", "   ", "<p></p>", "<img src=x>", 42, {}, []]) {
      expect(readingMinutes(value)).toBeUndefined();
    }
  });

  it("counts Arabic words", () => {
    expect(readingMinutes("<p>مرحبا بكم في إنفولاين</p>")).toBe(1);
  });
});

describe("pickFeatured", () => {
  const cards = (flags: boolean[]) => flags.map((isFeatured, i) => ({ id: i, isFeatured }));

  it("prefers the first card the CMS flagged, wherever it sits", () => {
    expect(pickFeatured(cards([false, false, true, true]))?.id).toBe(2);
  });

  it("falls back to the newest (first) card when none is flagged", () => {
    expect(pickFeatured(cards([false, false]))?.id).toBe(0);
  });

  it("is null for no cards", () => {
    expect(pickFeatured([])).toBeNull();
  });
});

describe("mergeById", () => {
  it("appends new cards in order and drops ones already present", () => {
    const merged = mergeById([{ id: 1 }, { id: 2 }], [{ id: 2 }, { id: 3 }, { id: 4 }]);
    expect(merged.map((c) => c.id)).toEqual([1, 2, 3, 4]);
  });
});

describe("card -> section shapes", () => {
  it("cardToInsight keeps the router href and omits empty optionals", () => {
    const insight = cardToInsight(toInsightCard(item({ excerpt: null, date: null })));
    expect(insight).toMatchObject({ href: "/insights/a-title", title: "A title", date: undefined, excerpt: undefined });
  });

  it("cardToBlogPost carries the id and CMS href and a localized date label", () => {
    const en = cardToBlogPost(toInsightCard(item()), "en");
    expect(en).toMatchObject({ id: 1, href: "/insights/a-title", slug: "a-title", date: "2026-10-12", body: [] });
    expect(en.dateLabel).toBe("12 Oct 2026");
    const ar = cardToBlogPost(toInsightCard(item({ locale: "ar", uri: "/ar/insights/a-title/" })), "ar");
    expect(ar.href).toBe("/insights/a-title");
    expect(ar.dateLabel).not.toBe("");
    expect(ar.dateLabel).not.toBe(en.dateLabel);
  });

  it("cardToBlogPost survives a missing or invalid date", () => {
    expect(cardToBlogPost(toInsightCard(item({ date: null })), "en")).toMatchObject({ date: "", dateLabel: "" });
    expect(cardToBlogPost(toInsightCard(item({ date: "not a date" })), "en").dateLabel).toBe("");
  });
});
