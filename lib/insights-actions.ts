"use server";

import { getTranslations } from "next-intl/server";
import type { BlogPost } from "@/lib/blog";
import { cardToBlogPost, toInsightCard, typeLabelsFromFilters } from "@/lib/insights-cards";
import { BLOG_PAGE_SIZE, loadArticleListing } from "@/lib/insights-listing";
import { getQueryClient } from "@/providers/query-client/get-query-client";

export type LoadMoreArticlesResult =
  | { ok: true; posts: BlogPost[]; hasNextPage: boolean; endCursor: string | null }
  | { ok: false };

/** Relay cursors are base64; anything else (or anything long) is not one we issued. */
const CURSOR_PATTERN = /^[A-Za-z0-9+/=_-]{1,200}$/;

/**
 * "Load more" for the Blog grid. The browser never talks to the CMS (browser
 * CMS access is still an open decision): it calls this action on its own
 * origin and the CMS is queried from the server. Same loader, language
 * isolation and ordering as the first page; a failure answers `{ ok: false }`
 * and never an empty page.
 */
export async function loadMoreArticles(
  locale: string,
  after: string,
): Promise<LoadMoreArticlesResult> {
  if ((locale !== "en" && locale !== "ar") || !CURSOR_PATTERN.test(after)) return { ok: false };

  const listing = await loadArticleListing(getQueryClient(), locale, BLOG_PAGE_SIZE, after);
  if (listing.status !== "cms") return { ok: false };

  const t = await getTranslations({ locale, namespace: "Blog.page" });
  const labels = typeLabelsFromFilters(t.raw("filters") as { id: string; label: string }[]);
  return {
    ok: true,
    posts: listing.items.map((item) => cardToBlogPost(toInsightCard(item, labels), locale)),
    hasNextPage: listing.hasNextPage,
    endCursor: listing.endCursor,
  };
}
