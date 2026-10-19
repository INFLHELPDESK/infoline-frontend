import type { QueryClient } from "@tanstack/react-query";
import { INSIGHTS_LIMIT, toInsights } from "@/lib/content-adapters";
import type { InsightsSource } from "@/lib/insights";
import { WpConfigError, isWpRequestError, type WpFailureKind } from "@/lib/wp/client";
import { prefetchLatestPosts } from "@/lib/wp/server";
import type { WpLocale } from "@/lib/wp/api";

export type InsightsFeed = {
  source: InsightsSource;
  /** Why the static fallback is in use (`fallback-error` only). */
  failure?: { kind: WpFailureKind | "config"; status?: number };
};

/**
 * Server-side CMS prefetch for the Insights route. Fills `queryClient` (which
 * the page dehydrates) and says which content the page should render.
 *
 * Only CMS infrastructure failures (`WpRequestError`, `WpConfigError`) select
 * the static fallback, and they are logged, never reported as empty content.
 * Anything else (a cancellation, a bug in an adapter) is not a CMS outcome and
 * is rethrown to the route's error boundary.
 */
export async function loadInsightsFeed(
  queryClient: QueryClient,
  locale: WpLocale,
  prefetch: typeof prefetchLatestPosts = prefetchLatestPosts,
): Promise<InsightsFeed> {
  try {
    const posts = await prefetch(queryClient, locale, INSIGHTS_LIMIT);
    return { source: toInsights(posts).length > 0 ? "cms" : "fallback-empty" };
  } catch (error) {
    const failure = isWpRequestError(error)
      ? { kind: error.kind, ...(error.status === undefined ? {} : { status: error.status }) }
      : error instanceof WpConfigError
        ? { kind: "config" as const }
        : null;
    if (!failure) throw error;
    console.error(
      `[insights] CMS unavailable (${failure.kind}${"status" in failure ? ` ${failure.status}` : ""}); rendering static fallback`,
    );
    return { source: "fallback-error", failure };
  }
}
