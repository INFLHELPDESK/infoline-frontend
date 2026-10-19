export type Insight = {
  category: string;
  title: string;
  image: string;
  /** Empty when the card has no page to link to. */
  href: string;
};

/**
 * Where the Insights "Formats" cards came from (rendered as
 * `data-content-source` so tests and operators can tell them apart):
 * - `cms`             WordPress posts
 * - `fallback-empty`  the CMS answered with no usable posts; static locale items
 * - `fallback-error`  the CMS request failed; static locale items
 */
export type InsightsSource = "cms" | "fallback-empty" | "fallback-error";
