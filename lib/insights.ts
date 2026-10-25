export type Insight = {
  category: string;
  title: string;
  image: string;
  /** ISO publication date, shown when the source has one. */
  date?: string;
  /** Ready-made localized date (static posts); wins over `date`. */
  dateLabel?: string;
  /** Plain-text teaser, clamped by the card. */
  excerpt?: string;
  /** Whole minutes to read; only set when it can be computed from article text. */
  readMinutes?: number;
  /** Empty when the card has no page to link to. */
  href: string;
};

/**
 * Where the Insights "Formats" cards came from (rendered as
 * `data-content-source` so tests and operators can tell them apart):
 * - `cms`             WordPress Insights
 * - `empty`           the CMS answered with no Insights in this language; empty state, no static items
 * - `fallback-empty`  legacy Posts feed only (lib/insights-feed): no usable posts; static locale items
 * - `fallback-error`  the CMS request failed; static locale items
 */
export type InsightsSource = "cms" | "empty" | "fallback-empty" | "fallback-error";
