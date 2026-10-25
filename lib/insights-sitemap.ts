import { getInsights } from "@/lib/wp/api";
import type { CursorPage, InsightListItem } from "@/lib/wp/types";

/** Page size and ceiling: bounded so a misbehaving cursor cannot loop forever. */
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

type Locale = "en" | "ar";
type FetchPage = (locale: Locale, first: number, after?: string) => Promise<CursorPage<InsightListItem>>;

/**
 * Every published Insight of one language, for the sitemap. Any CMS failure
 * (missing/refused endpoint included) yields an empty list and a log line: the
 * sitemap keeps its static routes instead of failing the build or the request.
 */
export async function loadPublishedInsights(
  locale: Locale,
  fetchPage: FetchPage = getInsights,
): Promise<InsightListItem[]> {
  const items: InsightListItem[] = [];
  try {
    let after: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await fetchPage(locale, PAGE_SIZE, after);
      items.push(...result.items);
      if (!result.hasNextPage || !result.endCursor || result.endCursor === after) break;
      after = result.endCursor;
    }
  } catch {
    console.warn(`[sitemap] CMS unavailable for ${locale} insights; leaving them out`);
    return [];
  }
  return items;
}
