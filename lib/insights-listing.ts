import type { QueryClient } from "@tanstack/react-query";
import { WpConfigError, isWpRequestError, type WpFailureKind } from "@/lib/wp/client";
import { prefetchInsights, prefetchInsightsByTerm } from "@/lib/wp/server";
import type { WpLocale } from "@/lib/wp/api";
import type { InsightListItem } from "@/lib/wp/types";
import { ARTICLE_TYPE_SLUG } from "@/lib/insights-cards";

/**
 * Server-side listing loaders for /insights (every Insight type) and /blog
 * (`article` only). Both go through the shared `prefetch*` helpers, so they use
 * the locale-keyed query cache and the same CMS client as the rest of the site.
 *
 * Three outcomes, never mixed:
 * - `cms`    the CMS answered with Insights of the requested language
 * - `empty`  the CMS answered and has none (a valid, successful answer)
 * - `error`  the CMS could not answer (request or config failure); says nothing
 *            about whether content exists, so callers must not treat it as empty
 */

export type ListingFailure = { kind: WpFailureKind | "config"; status?: number };

export type ListingResult =
  | { status: "cms"; items: InsightListItem[]; hasNextPage: boolean; endCursor: string | null }
  | { status: "empty" }
  | { status: "error"; failure: ListingFailure };

/** Cards on the Insights page (the approved design shows three). */
export const INSIGHTS_PAGE_CARDS = 3;

/** Blog grid page size; `Load more` asks for the same amount. */
export const BLOG_PAGE_SIZE = 12;

/**
 * The term-side connection cannot filter by language, so a page of another
 * language's records arrives empty with `hasNextPage` still true. Skip at most
 * this many such pages to find the first record of the requested language.
 */
const MAX_EMPTY_PAGE_HOPS = 5;

function failureOf(error: unknown): ListingFailure | null {
  if (isWpRequestError(error)) {
    return { kind: error.kind, ...(error.status === undefined ? {} : { status: error.status }) };
  }
  return error instanceof WpConfigError ? { kind: "config" } : null;
}

/**
 * Only CMS infrastructure failures become `error` (logged, without query text,
 * variables or endpoint). Anything else (a cancellation, a bug) is rethrown.
 */
async function settle(
  label: string,
  load: () => Promise<{ items: InsightListItem[]; hasNextPage: boolean; endCursor: string | null } | null>,
  { emptyWhenDone }: { emptyWhenDone: boolean },
): Promise<ListingResult> {
  try {
    const page = await load();
    if (!page || (page.items.length === 0 && !page.hasNextPage && emptyWhenDone)) return { status: "empty" };
    return { status: "cms", ...page };
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    console.error(
      `[${label}] CMS unavailable (${failure.kind}${failure.status === undefined ? "" : ` ${failure.status}`})`,
    );
    return { status: "error", failure };
  }
}

/** Newest-first Insights of every type, in one language. */
export function loadInsightsListing(
  queryClient: QueryClient,
  locale: WpLocale,
  first = INSIGHTS_PAGE_CARDS,
  after?: string,
): Promise<ListingResult> {
  return settle("insights", () => prefetchInsights(queryClient, locale, first, after), {
    emptyWhenDone: after === undefined,
  });
}

/**
 * Newest-first `article` Insights of one language, from the term side. An
 * unknown `article` term is an empty listing, not an error.
 */
export function loadArticleListing(
  queryClient: QueryClient,
  locale: WpLocale,
  first = BLOG_PAGE_SIZE,
  after?: string,
): Promise<ListingResult> {
  return settle(
    "blog",
    async () => {
      const items: InsightListItem[] = [];
      let cursor = after;
      for (let hop = 0; hop <= MAX_EMPTY_PAGE_HOPS; hop += 1) {
        const listing = await prefetchInsightsByTerm(
          queryClient,
          "type",
          ARTICLE_TYPE_SLUG,
          locale,
          first,
          cursor,
        );
        if (!listing) return null;
        items.push(...listing.page.items);
        const { hasNextPage, endCursor } = listing.page;
        if (items.length > 0 || !hasNextPage) return { items, hasNextPage, endCursor };
        if (hop === MAX_EMPTY_PAGE_HOPS) return { items, hasNextPage, endCursor };
        cursor = endCursor ?? undefined;
      }
      return null;
    },
    { emptyWhenDone: after === undefined },
  );
}
