import { describe, expect, it, vi } from "vitest";
import {
  buildInsightAlternates,
  buildInsightSitemapEntries,
  insightRoutePath,
  verifyInsightTranslations,
} from "@/lib/insights-seo";
import { loadPublishedInsights } from "@/lib/insights-sitemap";
import type { InsightListItem } from "@/lib/wp/types";

vi.mock("@/providers/query-client/get-query-client", () => ({ getQueryClient: () => ({}) }));

const SITE = "https://site.test";

const item = (locale: "en" | "ar", slug: string, tr: ("en" | "ar")[] = []): InsightListItem =>
  ({
    databaseId: 1,
    title: slug,
    slug,
    uri: `${locale === "ar" ? "/ar" : ""}/insights/${slug}/`,
    locale,
    translations: tr.map((l) => ({ locale: l, uri: `${l === "ar" ? "/ar" : ""}/insights/${slug}/` })),
  }) as unknown as InsightListItem;

describe("insightRoutePath", () => {
  it("strips the /ar segment and trailing slash, and keeps EN paths", () => {
    expect(insightRoutePath("/ar/insights/x/", "ar")).toBe("/insights/x");
    expect(insightRoutePath("/insights/x/", "en")).toBe("/insights/x");
  });
  it("rejects hosts, other sections and empty slugs", () => {
    expect(insightRoutePath("https://wp.dev.example/insights/x/", "en")).toBeNull();
    expect(insightRoutePath("//wp.dev.example/insights/x/", "en")).toBeNull();
    expect(insightRoutePath("/blog/x/", "en")).toBeNull();
    expect(insightRoutePath("/insights/", "en")).toBeNull();
  });
});

describe("buildInsightAlternates", () => {
  it("AR without a translation: self-canonical, own hreflang only, no x-default", () => {
    expect(buildInsightAlternates(SITE, "ar", "/insights/x", [])).toEqual({
      canonical: `${SITE}/ar/insights/x`,
      languages: { ar: `${SITE}/ar/insights/x` },
    });
  });
  it("EN alone is x-default", () => {
    const a = buildInsightAlternates(SITE, "en", "/insights/x", []);
    expect(a.languages).toEqual({ en: `${SITE}/en/insights/x`, "x-default": `${SITE}/en/insights/x` });
  });
  it("uses the translated URI, not the original slug, and encodes non-Latin slugs once", () => {
    const a = buildInsightAlternates(SITE, "en", "/insights/hello", [{ locale: "ar", href: "/insights/مرحبا" }]);
    expect(a.languages.ar).toBe(`${SITE}/ar/insights/${encodeURIComponent("مرحبا")}`);
    expect(a.languages["x-default"]).toBe(`${SITE}/en/insights/hello`);
    const pre = buildInsightAlternates(SITE, "en", "/insights/hello", [
      { locale: "ar", href: `/insights/${encodeURIComponent("مرحبا")}` },
    ]);
    expect(pre.languages.ar).toBe(a.languages.ar);
  });
  it("AR page with a verified EN counterpart gets x-default pointing at EN", () => {
    const a = buildInsightAlternates(SITE, "ar", "/insights/m", [{ locale: "en", href: "/insights/e" }]);
    expect(a.languages["x-default"]).toBe(`${SITE}/en/insights/e`);
    expect(a.canonical).toBe(`${SITE}/ar/insights/m`);
  });
  it("never emits a double locale prefix", () => {
    const a = buildInsightAlternates(SITE, "ar", "/insights/m", [{ locale: "en", href: "/insights/e" }]);
    for (const u of Object.values(a.languages)) expect(u).not.toMatch(/\/(en|ar)\/(en|ar)\//);
  });
});

describe("verifyInsightTranslations", () => {
  const detail = (translations: { locale: "en" | "ar"; uri: string }[]) =>
    ({ post: { href: "/insights/e" }, translations }) as never;

  it("keeps a translation only when the counterpart exists and links back", async () => {
    const fetchCounterpart = vi.fn().mockResolvedValue({
      translations: [{ locale: "en", uri: "/insights/e/" }],
    });
    const out = await verifyInsightTranslations(
      detail([{ locale: "ar", uri: "/ar/insights/m/" }]),
      "en",
      fetchCounterpart,
    );
    expect(out).toEqual([{ locale: "ar", href: "/insights/m" }]);
    expect(fetchCounterpart).toHaveBeenCalledWith("/ar/insights/m/", "ar");
  });
  it("drops a missing, one-way, failing or host-bearing counterpart", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const t = (uri: string) => detail([{ locale: "ar", uri }]);
    expect(await verifyInsightTranslations(t("/ar/insights/m/"), "en", async () => null)).toEqual([]);
    expect(
      await verifyInsightTranslations(t("/ar/insights/m/"), "en", async () => ({ translations: [] })),
    ).toEqual([]);
    expect(
      await verifyInsightTranslations(t("/ar/insights/m/"), "en", async () => {
        throw new Error("boom");
      }),
    ).toEqual([]);
    const spy = vi.fn();
    expect(await verifyInsightTranslations(t("https://wp.dev.example/ar/insights/m/"), "en", spy)).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
    warn.mockRestore();
  });
  it("makes no request when there are no translations", async () => {
    const spy = vi.fn();
    expect(await verifyInsightTranslations(detail([]), "en", spy)).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("buildInsightSitemapEntries", () => {
  it("lists each locale's own records and alternates only for mutual pairs", () => {
    const entries = buildInsightSitemapEntries(SITE, {
      en: [item("en", "both", ["ar"]), item("en", "en-only")],
      ar: [item("ar", "both", ["en"])],
    });
    const by = Object.fromEntries(entries.map((e) => [e.url, e.alternates.languages]));
    expect(Object.keys(by).sort()).toEqual([
      `${SITE}/ar/insights/both`,
      `${SITE}/en/insights/both`,
      `${SITE}/en/insights/en-only`,
    ]);
    expect(by[`${SITE}/en/insights/both`]).toEqual({
      en: `${SITE}/en/insights/both`,
      ar: `${SITE}/ar/insights/both`,
      "x-default": `${SITE}/en/insights/both`,
    });
    expect(by[`${SITE}/en/insights/en-only`]).not.toHaveProperty("ar");
  });
  it("omits hreflang for a translation that is unpublished or one-way", () => {
    const missing = buildInsightSitemapEntries(SITE, { en: [item("en", "x", ["ar"])], ar: [] });
    expect(missing).toHaveLength(1);
    expect(missing[0].alternates.languages).not.toHaveProperty("ar");
    const oneWay = buildInsightSitemapEntries(SITE, { en: [item("en", "x", ["ar"])], ar: [item("ar", "x")] });
    expect(oneWay.find((e) => e.url.includes("/en/"))?.alternates.languages).not.toHaveProperty("ar");
  });
  it("skips duplicates and non-detail or absolute URIs", () => {
    const bad = { ...item("en", "h"), uri: "https://wp.dev.example/insights/h/" } as InsightListItem;
    const blog = { ...item("en", "b"), uri: "/blog/b/" } as InsightListItem;
    const entries = buildInsightSitemapEntries(SITE, { en: [bad, blog, item("en", "a"), item("en", "a")] });
    expect(entries.map((e) => e.url)).toEqual([`${SITE}/en/insights/a`]);
  });
});

describe("loadPublishedInsights", () => {
  it("follows cursors and stops at the last page", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [item("en", "a")], hasNextPage: true, endCursor: "c1" })
      .mockResolvedValueOnce({ items: [item("en", "b")], hasNextPage: false, endCursor: null });
    const out = await loadPublishedInsights("en", fetchPage);
    expect(out.map((i) => i.slug)).toEqual(["a", "b"]);
    expect(fetchPage).toHaveBeenNthCalledWith(2, "en", 100, "c1");
  });
  it("does not loop on a repeated cursor", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [], hasNextPage: true, endCursor: "same" });
    await loadPublishedInsights("en", fetchPage);
    expect(fetchPage.mock.calls.length).toBeLessThanOrEqual(2);
  });
  it("returns [] when the CMS fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await loadPublishedInsights("ar", async () => Promise.reject(new Error("down")))).toEqual([]);
    warn.mockRestore();
  });
});
