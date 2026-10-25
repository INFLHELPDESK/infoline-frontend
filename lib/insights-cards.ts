import { formatDate, stripHtml } from "@/lib/content-adapters";
import type { BlogPost } from "@/lib/blog";
import type { Insight } from "@/lib/insights";
import type { Insight as CmsInsight, InsightListItem } from "@/lib/wp/types";

/**
 * Pure mappers from the normalized CMS Insight onto what the Insights and Blog
 * sections render. No CMS client import: safe for client components and for the
 * server action that returns these shapes to the browser.
 */

/** Fallback card art for an Insight with no featured image. */
const DEFAULT_IMAGE = "/assets/insights/i1.svg";

/** Longest teaser excerpt carried to the browser; cards clamp it to two lines. */
const EXCERPT_MAX = 160;

const WORDS_PER_MINUTE = 200;

/** `insightType` slug the Blog lists (the backend-confirmed term). */
export const ARTICLE_TYPE_SLUG = "article";

/** Filter id in `Blog.page.filters` -> `insightType` slug. */
const FILTER_TYPE: Record<string, string> = {
  articles: "article",
  events: "event",
  news: "news",
};

/** Localized label per `insightType` slug (terms are English-only in the CMS). */
export type TypeLabels = Record<string, string>;

export function typeLabelsFromFilters(filters: { id: string; label: string }[]): TypeLabels {
  const labels: TypeLabels = {};
  for (const f of filters) {
    const slug = FILTER_TYPE[f.id];
    if (slug) labels[slug] = f.label;
  }
  return labels;
}

export type InsightCard = {
  id: number;
  slug: string;
  /** Authoritative CMS URI, exactly as the CMS returned it. */
  uri: string;
  /** Router path: `uri` without the `/ar` segment (the locale-aware Link re-adds it) or trailing slash. */
  href: string;
  /** First `insightType` slug, or null. */
  type: string | null;
  category: string;
  title: string;
  image: string;
  date: string | null;
  excerpt: string | null;
  /** Only set when the item carries its body (list items do not). */
  readMinutes?: number;
  isFeatured: boolean;
};

/** Whole minutes to read `html`; undefined when there is no readable text. */
export function readingMinutes(html: unknown): number | undefined {
  if (typeof html !== "string") return undefined;
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) : undefined;
}

/** CMS URI -> locale-stripped router path (`/ar/insights/x/` -> `/insights/x`). */
export function insightHref(uri: string, locale: "en" | "ar"): string {
  let path = uri.startsWith("/") ? uri : `/${uri}`;
  if (locale === "ar") path = path.replace(/^\/ar(?=\/|$)/, "") || "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function clampExcerpt(html: string | null): string | null {
  const text = stripHtml(html);
  if (!text) return null;
  return text.length > EXCERPT_MAX ? `${text.slice(0, EXCERPT_MAX).trimEnd()}…` : text;
}

export function toInsightCard(item: InsightListItem | CmsInsight, labels: TypeLabels = {}): InsightCard {
  const type = item.types[0] ?? null;
  return {
    id: item.databaseId,
    slug: item.slug,
    uri: item.uri,
    href: insightHref(item.uri, item.locale),
    type: type?.slug ?? null,
    category: (type && (labels[type.slug] ?? type.name)) || "",
    title: item.title,
    image: item.image?.src || DEFAULT_IMAGE,
    date: item.date,
    excerpt: clampExcerpt(item.excerpt),
    readMinutes: "content" in item ? readingMinutes(item.content) : undefined,
    isFeatured: item.isFeatured,
  };
}

/** The `isFeatured` card if the CMS flagged one, else the newest. Null for none. */
export function pickFeatured<T extends { isFeatured: boolean }>(cards: readonly T[]): T | null {
  return cards.find((c) => c.isFeatured) ?? cards[0] ?? null;
}

/** Appends `incoming` after `existing`, dropping cards already present. */
export function mergeById<T extends { id: number }>(existing: readonly T[], incoming: readonly T[]): T[] {
  const seen = new Set(existing.map((c) => c.id));
  return [...existing, ...incoming.filter((c) => !seen.has(c.id))];
}

export function cardToInsight(card: InsightCard): Insight {
  return {
    category: card.category,
    title: card.title,
    image: card.image,
    date: card.date ?? undefined,
    excerpt: card.excerpt ?? undefined,
    readMinutes: card.readMinutes,
    href: card.href,
  };
}

export function cardToBlogPost(card: InsightCard, locale: "en" | "ar"): BlogPost {
  return {
    slug: card.slug || String(card.id),
    id: card.id,
    href: card.href,
    category: card.category,
    date: card.date ? card.date.slice(0, 10) : "",
    dateLabel: card.date ? formatDate(card.date, locale) : "",
    title: card.title,
    excerpt: card.excerpt ?? "",
    body: [],
    image: card.image,
  };
}
