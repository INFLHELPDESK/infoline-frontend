import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadMoreArticles } from "@/lib/insights-actions";
import { loadArticleListing } from "@/lib/insights-listing";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import { startCmsStub } from "../../support/cms-stub/harness";

// The i18n runtime needs the Next request context; the action only reads one
// namespace of the locale copy, so serve exactly that.
vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale }: { locale: "en" | "ar" }) => ({
    raw: (key: string) => (locale === "ar" ? ar : en).Blog.page[key as "filters"],
  }),
}));

/**
 * "Load more" runs on the server: the browser only calls the action on its own
 * origin. These tests prove what the action answers and what it asks the CMS.
 */

const stub = startCmsStub();

afterEach(() => vi.restoreAllMocks());

const cursorAfterFirstArticle = async (locale: "en" | "ar") => {
  const first = await loadArticleListing(new QueryClient(), locale, 1);
  stub.reset();
  if (first.status !== "cms" || !first.endCursor) throw new Error("no cursor");
  return first.endCursor;
};

describe("loadMoreArticles", () => {
  it("returns the next page of articles as Blog posts that link to the CMS URI", async () => {
    const after = await cursorAfterFirstArticle("en");
    const result = await loadMoreArticles("en", after);
    expect(result).toMatchObject({ ok: true, hasNextPage: false });
    if (!result.ok) return;
    expect(result.posts.map((p) => [p.slug, p.href, p.category])).toEqual([
      ["minimal-article", "/insights/minimal-article", "Articles"],
    ]);
    expect(stub.graphqlRequests().map((r) => r.operation)).toEqual(["InsightTypeInsights"]);
    expect(stub.graphqlRequests()[0].variables).toMatchObject({ slug: "article", after });
  });

  it("serves Arabic records with the Arabic type label and no /ar in the router href", async () => {
    const after = await cursorAfterFirstArticle("ar");
    const result = await loadMoreArticles("ar", after);
    if (!result.ok) throw new Error("expected ok");
    expect(result.posts.map((p) => [p.title, p.href, p.category])).toEqual([
      ["مقال مختصر", "/insights/minimal-article", "مقالات"],
    ]);
  });

  it.each([
    ["an unsupported locale", "fr", "abc"],
    ["an empty cursor", "en", ""],
    ["a cursor with illegal characters", "en", 'x"} injected'],
    ["an oversized cursor", "en", "A".repeat(201)],
  ])("rejects %s without touching the CMS", async (_name, locale, after) => {
    expect(await loadMoreArticles(locale, after)).toEqual({ ok: false });
    expect(stub.requests).toHaveLength(0);
  });

  it("answers { ok: false } for a CMS failure (never an empty page), and logs it once", async () => {
    const after = await cursorAfterFirstArticle("en");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    stub.setScenario("http-error");
    expect(await loadMoreArticles("en", after)).toEqual({ ok: false });
    expect(log).toHaveBeenCalledTimes(1);
  });
});
