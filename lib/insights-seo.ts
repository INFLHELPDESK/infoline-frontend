import { insightHref } from "@/lib/insights-cards";
import { routing } from "@/i18n/routing";
import type { InsightDetail } from "@/lib/insights-detail";
import { prefetchInsight } from "@/lib/wp/server";
import { getQueryClient } from "@/providers/query-client/get-query-client";
import type { InsightListItem, InsightTranslation } from "@/lib/wp/types";

/**
 * Canonical, hreflang and sitemap alternates for CMS Insights. Everything is
 * derived from the authoritative CMS URI (a path), never from the slug and never
 * from the CMS host: the public origin is always the frontend's own.
 */

type Locale = "en" | "ar";

const DETAIL_PREFIX = "/insights/";

/**
 * CMS URI -> locale-stripped router path of an Insight detail page, or null when
 * the URI cannot be trusted as one: absolute / protocol-relative URIs (they carry
 * a host, e.g. the development WordPress), another section, or an empty slug.
 */
export function insightRoutePath(uri: string, locale: Locale): string | null {
  if (!uri.startsWith("/") || uri.startsWith("//")) return null;
  const path = insightHref(uri, locale);
  return path.startsWith(DETAIL_PREFIX) && path.length > DETAIL_PREFIX.length ? path : null;
}

/** Percent-encodes each segment once (CMS URIs may arrive encoded or raw). */
export function encodeRoutePath(path: string): string {
  return path
    .split("/")
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
}

export type VerifiedTranslation = { locale: Locale; href: string };

/**
 * The translations that are real: the counterpart record is published in its own
 * language AND points back at this page (Polylang translation sets are mutual,
 * so a one-way link is a data error, not an alternate). A failing or malformed
 * lookup drops that locale, it never invents one.
 */
export async function verifyInsightTranslations(
  detail: Pick<InsightDetail, "translations" | "post">,
  locale: Locale,
  fetchCounterpart: (uri: string, locale: Locale) => Promise<{ translations: InsightTranslation[] } | null> = (
    uri,
    l,
  ) => prefetchInsight(getQueryClient(), uri, l),
): Promise<VerifiedTranslation[]> {
  const self = detail.post.href;
  const seen = new Set<Locale>();
  const checks = detail.translations
    .filter((t) => t.locale !== locale)
    .map(async (t): Promise<VerifiedTranslation | null> => {
      const href = insightRoutePath(t.uri, t.locale);
      if (!href || seen.has(t.locale)) return null;
      seen.add(t.locale);
      try {
        const counterpart = await fetchCounterpart(t.uri, t.locale);
        const mutual = counterpart?.translations.some(
          (back) => back.locale === locale && insightRoutePath(back.uri, back.locale) === self,
        );
        return mutual ? { locale: t.locale, href } : null;
      } catch {
        console.warn("[insights] could not verify a translation; leaving it out");
        return null;
      }
    });
  return (await Promise.all(checks)).filter((t): t is VerifiedTranslation => t !== null);
}

/**
 * Canonical + hreflang for an Insight page. Self-canonical on the frontend
 * origin; an hreflang entry for this locale and for each verified translation
 * only; `x-default` only when an English URL exists (this page or a translation).
 */
export function buildInsightAlternates(
  siteUrl: string,
  locale: Locale,
  selfHref: string,
  translations: readonly VerifiedTranslation[],
) {
  const url = (l: Locale, href: string) => `${siteUrl}/${l}${encodeRoutePath(href)}`;
  const languages: Record<string, string> = { [locale]: url(locale, selfHref) };
  for (const t of translations) languages[t.locale] = url(t.locale, t.href);
  if (languages[routing.defaultLocale]) languages["x-default"] = languages[routing.defaultLocale];
  return { canonical: languages[locale], languages };
}

/* ---------------------------------- sitemap --------------------------------- */

export type SitemapInsightEntry = {
  url: string;
  alternates: { languages: Record<string, string> };
};

/**
 * One sitemap entry per published record, in the locale it exists in. A record's
 * alternates list another locale only when that locale's published record exists
 * in `byLocale` and links back (the same mutual rule as the page's hreflang).
 * Duplicate URLs and URIs that are not Insight detail paths are skipped.
 */
export function buildInsightSitemapEntries(
  siteUrl: string,
  byLocale: Partial<Record<Locale, readonly InsightListItem[]>>,
): SitemapInsightEntry[] {
  const index = new Map<string, InsightListItem>();
  for (const l of routing.locales) {
    for (const item of byLocale[l] ?? []) {
      const path = insightRoutePath(item.uri, l);
      if (path) index.set(`${l}:${path}`, item);
    }
  }

  const entries: SitemapInsightEntry[] = [];
  const seen = new Set<string>();
  for (const [key, item] of index) {
    const locale = key.slice(0, 2) as Locale;
    const self = key.slice(3);
    const verified: VerifiedTranslation[] = [];
    for (const t of item.translations) {
      const href = insightRoutePath(t.uri, t.locale);
      const counterpart = href ? index.get(`${t.locale}:${href}`) : undefined;
      const mutual = counterpart?.translations.some(
        (back) => back.locale === locale && insightRoutePath(back.uri, back.locale) === self,
      );
      if (t.locale !== locale && href && mutual) verified.push({ locale: t.locale, href });
    }
    const { canonical, languages } = buildInsightAlternates(siteUrl, locale, self, verified);
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    entries.push({ url: canonical, alternates: { languages } });
  }
  return entries;
}
