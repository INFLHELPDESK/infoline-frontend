"use client";

import { useMemo } from "react";
import { INSIGHTS_LIMIT, toInsights } from "@/lib/content-adapters";
import type { Insight, InsightsSource } from "@/lib/insights";
import { useLatestPosts } from "@/lib/wp/hooks";
import Formats from "./formats";

/**
 * CMS-backed "Formats" section. The server prefetched the posts and the page
 * hydrates them, so the query is already fresh on first render: no browser
 * request is made (infinite `staleTime`, no focus/reconnect refetch). Browser
 * CMS access (CORS) is still an open decision, so this must not start any.
 *
 * `source` is the server's verdict. Anything but `cms` keeps the query off and
 * renders the static items. If the cached list ever yields no cards, the static
 * items are shown rather than an empty grid.
 */
export default function FormatsLive({
  fallback,
  source,
  linkableSlugs,
}: {
  fallback: Insight[];
  source: InsightsSource;
  /** Slugs the blog detail route can render; other CMS posts are not linked. */
  linkableSlugs: string[];
}) {
  const linkable = useMemo(() => new Set(linkableSlugs), [linkableSlugs]);
  const { data } = useLatestPosts(INSIGHTS_LIMIT, {
    enabled: source === "cms",
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const cms = source === "cms" && data ? toInsights(data, undefined, linkable) : [];
  if (cms.length > 0) return <Formats insights={cms} contentSource="cms" />;
  return (
    <Formats
      insights={fallback}
      contentSource={source === "cms" ? "fallback-empty" : source}
    />
  );
}
