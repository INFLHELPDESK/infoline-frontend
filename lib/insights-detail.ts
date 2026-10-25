import type { BlogPost } from "@/lib/blog";
import { sanitizeCmsHtml } from "@/lib/cms-html";
import { formatDate, stripHtml } from "@/lib/content-adapters";
import { insightHref, readingMinutes, toInsightCard, type TypeLabels } from "@/lib/insights-cards";
import { WpConfigError, isWpRequestError, type WpFailureKind } from "@/lib/wp/client";
import { prefetchInsight } from "@/lib/wp/server";
import type { WpLocale } from "@/lib/wp/api";
import type { Insight, InsightEventDetails } from "@/lib/wp/types";
import { getQueryClient } from "@/providers/query-client/get-query-client";

/**
 * What `/[locale]/insights/[slug]` has for a slug:
 * - `cms`         an Insight of this locale with a title and something to read
 * - `not-found`   the CMS answered and has no such published Insight in this
 *                 locale (a record of the other language counts as none)
 * - `incomplete`  the record exists but has no title or no body and excerpt
 * - `error`       the CMS request failed; says nothing about whether it exists
 */
export type InsightDetailResult =
  | { kind: "cms"; detail: InsightDetail }
  | { kind: "not-found" }
  | { kind: "incomplete" }
  | { kind: "error"; error: unknown; failure: { kind: WpFailureKind | "config"; status?: number } };

export type InsightDetail = {
  /** The existing article design's shape: hero + article render from this. */
  post: BlogPost;
  /** `insightType` slug of the first type, or null. */
  type: string | null;
  topic: string | null;
  /** Sanitized body HTML (see lib/cms-html). Empty when only an excerpt exists. */
  bodyHtml: string;
  readMinutes?: number;
  event: InsightEventDetails | null;
  /** Router path to go back to: the Blog for articles, Insights otherwise. */
  backHref: "/blog" | "/insights";
  seo: { title: string | null; description: string | null };
  /** CMS translation counterparts as router paths, kept for language switching. */
  translations: { locale: "en" | "ar"; uri: string; href: string }[];
};

/** Same bounds as the blog detail route: junk slugs never become CMS requests. */
const MAX_SLUG_LENGTH = 100;
const SLUG_PATTERN = /^[\p{L}\p{N}_-]+$/u;

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function toInsightDetail(insight: Insight, locale: WpLocale, labels: TypeLabels = {}): InsightDetail | null {
  const card = toInsightCard(insight, labels);
  const excerpt = stripHtml(insight.excerpt);
  const bodyHtml = sanitizeCmsHtml(insight.content, locale);
  if (!insight.title.trim() || (!stripHtml(bodyHtml) && !excerpt)) return null;

  return {
    post: {
      slug: insight.slug,
      id: insight.databaseId,
      href: card.href,
      category: card.category,
      date: insight.date ? insight.date.slice(0, 10) : "",
      dateLabel: insight.date ? formatDate(insight.date, locale) : "",
      title: insight.title,
      excerpt,
      // Without a body the excerpt is the article, like the Posts adapter does.
      body: stripHtml(bodyHtml) ? [] : [excerpt],
      image: card.image,
    },
    type: card.type,
    topic: insight.topics[0]?.name ?? null,
    bodyHtml,
    readMinutes: readingMinutes(bodyHtml),
    event: insight.eventDetails,
    backHref: card.type === "article" ? "/blog" : "/insights",
    seo: { title: insight.seo.title, description: insight.seo.description },
    translations: insight.translations.map((t) => ({ ...t, href: insightHref(t.uri, t.locale) })),
  };
}

/**
 * Looks the Insight up by its authoritative CMS URI (`/insights/<slug>/`,
 * `idType: URI`); `getInsight` adds the `/ar` segment and rejects a record that
 * is not in `locale`, so an Arabic page never falls back to the English record.
 */
export async function loadInsightDetail(
  rawSlug: string,
  locale: WpLocale,
  labels: TypeLabels = {},
  prefetch: typeof prefetchInsight = prefetchInsight,
): Promise<InsightDetailResult> {
  const slug = decodeSlug(rawSlug);
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) return { kind: "not-found" };

  try {
    const insight = await prefetch(getQueryClient(), `/insights/${slug}/`, locale);
    if (!insight) return { kind: "not-found" };
    const detail = toInsightDetail(insight, locale, labels);
    return detail ? { kind: "cms", detail } : { kind: "incomplete" };
  } catch (error) {
    const failure = isWpRequestError(error)
      ? { kind: error.kind, ...(error.status === undefined ? {} : { status: error.status }) }
      : error instanceof WpConfigError
        ? { kind: "config" as const }
        : null;
    if (!failure) throw error;
    console.error(
      `[insights] CMS unavailable for detail (${failure.kind}${"status" in failure ? ` ${failure.status}` : ""})`,
    );
    return { kind: "error", error, failure };
  }
}
