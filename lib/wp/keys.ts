/**
 * Centralized query keys. Locale is part of every key so EN/AR content never
 * collides in the cache once the WPML layer lands.
 */
import type { WpLocale } from "./api";
import type { InsightTaxonomy } from "./types";

export const wpKeys = {
  all: ["wp"] as const,

  service: (uri: string, locale: WpLocale) =>
    [...wpKeys.all, "service", locale, uri] as const,
  services: (locale: WpLocale) => [...wpKeys.all, "services", locale] as const,

  caseStudy: (uri: string, locale: WpLocale) =>
    [...wpKeys.all, "caseStudy", locale, uri] as const,
  caseStudies: (locale: WpLocale, sectorSlug?: string) =>
    [...wpKeys.all, "caseStudies", locale, sectorSlug ?? "all"] as const,

  solution: (uri: string, locale: WpLocale) =>
    [...wpKeys.all, "solution", locale, uri] as const,
  solutions: (locale: WpLocale) => [...wpKeys.all, "solutions", locale] as const,

  industry: (uri: string, locale: WpLocale) =>
    [...wpKeys.all, "industry", locale, uri] as const,
  industries: (locale: WpLocale) => [...wpKeys.all, "industries", locale] as const,

  clients: (locale: WpLocale) => [...wpKeys.all, "clients", locale] as const,

  hubs: (locale: WpLocale) => [...wpKeys.all, "hubs", locale] as const,

  careers: (locale: WpLocale) => [...wpKeys.all, "careers", locale] as const,

  posts: (locale: WpLocale) => [...wpKeys.all, "posts", locale] as const,
  /** Bounded teaser list (`PostCard[]`); a different shape from `posts`. */
  latestPosts: (locale: WpLocale, first: number) =>
    [...wpKeys.all, "posts", locale, "latest", first] as const,
  post: (slug: string, locale: WpLocale) =>
    [...wpKeys.all, "post", locale, slug] as const,

  /**
   * Insights. Every list/term-listing key shares the `["wp","insights",locale]`
   * prefix, so one locale's entries can be invalidated without touching the
   * other; the cursor is part of the key (one entry per page).
   */
  insights: (locale: WpLocale, first: number, after?: string | null) =>
    [...wpKeys.all, "insights", locale, "list", first, after ?? null] as const,
  insightsByTerm: (
    taxonomy: InsightTaxonomy,
    slug: string,
    locale: WpLocale,
    first: number,
    after?: string | null,
  ) => [...wpKeys.all, "insights", locale, taxonomy, slug, first, after ?? null] as const,
  insight: (uri: string, locale: WpLocale) =>
    [...wpKeys.all, "insight", locale, uri] as const,
  insightTerms: (taxonomy: InsightTaxonomy, locale: WpLocale) =>
    [...wpKeys.all, "insightTerms", locale, taxonomy] as const,

  companyProfile: (locale: WpLocale) =>
    [...wpKeys.all, "companyProfile", locale] as const,
};
