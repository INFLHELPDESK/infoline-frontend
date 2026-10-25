"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import {
  getService,
  getServices,
  getCaseStudy,
  getCaseStudies,
  getSolution,
  getSolutions,
  getIndustry,
  getIndustries,
  getClients,
  getHubs,
  getCareers,
  getPosts,
  getLatestPostCards,
  getPost,
  getCompanyProfile,
  getInsights,
  getInsight,
  getInsightTypes,
  getInsightTopics,
  getInsightsByTerm,
  INSIGHTS_PAGE_SIZE,
  type WpLocale,
} from "./api";
import { wpKeys } from "./keys";
import type {
  CaseStudy,
  Client,
  Hubs,
  Industry,
  Service,
  Solution,
  Career,
  Post,
  PostListItem,
  PostCard,
  CompanyProfile,
  CursorPage,
  Insight,
  InsightListItem,
  InsightTaxonomy,
  InsightTermListing,
  InsightTermSummary,
} from "./types";

/**
 * Client-side hooks. Every hook derives the locale from next-intl automatically
 * (handover §7: locale-aware even while English-only). For SSR/RSC prefetching
 * call the `get*` fetchers directly — see lib/wp/server.ts.
 *
 * Cache shape equals fetcher shape: list hooks return the `Paginated<T>`
 * envelope (`data.items` in components) so RSC-prefetched data and client-side
 * refetches always match. Single fetchers may resolve `null` (uri not found).
 */

/** The list shape used by `getCaseStudies` (a pick of CaseStudy). */
export type CaseStudyListItem = Pick<
  CaseStudy,
  | "title"
  | "uri"
  | "industrySectors"
  | "featuredResult"
  | "resultMetric"
  | "clientName"
  | "heroMetrics"
  | "image"
>;

type WpQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

function useWpLocale(): WpLocale {
  const locale = useLocale();
  return locale === "ar" ? "ar" : "en";
}

export function useService(uri: string, options?: WpQueryOptions<Service | null>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.service(uri, locale),
    queryFn: () => getService(uri, locale),
    enabled: options?.enabled ?? Boolean(uri),
  });
}

export function useServices(
  options?: WpQueryOptions<Awaited<ReturnType<typeof getServices>>>,
) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.services(locale),
    queryFn: () => getServices(locale),
  });
}

export function useCaseStudy(
  uri: string,
  options?: WpQueryOptions<CaseStudy | null>,
) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.caseStudy(uri, locale),
    queryFn: () => getCaseStudy(uri, locale),
    enabled: options?.enabled ?? Boolean(uri),
  });
}

export function useCaseStudies(
  sectorSlug?: string,
  options?: WpQueryOptions<Awaited<ReturnType<typeof getCaseStudies>>>,
) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.caseStudies(locale, sectorSlug),
    queryFn: () => getCaseStudies(locale, sectorSlug),
  });
}

export function useSolution(uri: string, options?: WpQueryOptions<Solution | null>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.solution(uri, locale),
    queryFn: () => getSolution(uri, locale),
    enabled: options?.enabled ?? Boolean(uri),
  });
}

export function useSolutions(
  options?: WpQueryOptions<Awaited<ReturnType<typeof getSolutions>>>,
) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.solutions(locale),
    queryFn: () => getSolutions(locale),
  });
}

export function useIndustry(uri: string, options?: WpQueryOptions<Industry | null>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.industry(uri, locale),
    queryFn: () => getIndustry(uri, locale),
    enabled: options?.enabled ?? Boolean(uri),
  });
}

export function useIndustries(
  options?: WpQueryOptions<Awaited<ReturnType<typeof getIndustries>>>,
) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.industries(locale),
    queryFn: () => getIndustries(locale),
  });
}

export function useClients(options?: WpQueryOptions<Client[]>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.clients(locale),
    queryFn: () => getClients(locale),
  });
}

export function useHubs(options?: WpQueryOptions<Hubs>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.hubs(locale),
    queryFn: () => getHubs(),
  });
}

export function useCareers(options?: WpQueryOptions<Career[]>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.careers(locale),
    queryFn: () => getCareers(locale),
  });
}

export function usePosts(options?: WpQueryOptions<PostListItem[]>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.posts(locale),
    queryFn: () => getPosts(locale),
  });
}

export function useLatestPosts(first: number, options?: WpQueryOptions<PostCard[]>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.latestPosts(locale, first),
    queryFn: () => getLatestPostCards(locale, first),
  });
}

export function usePost(slug: string, options?: WpQueryOptions<Post | null>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.post(slug, locale),
    queryFn: () => getPost(slug),
    enabled: options?.enabled ?? Boolean(slug),
  });
}

export function useCompanyProfile(options?: WpQueryOptions<CompanyProfile>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.companyProfile(locale),
    queryFn: () => getCompanyProfile(),
  });
}

/** One page of Insights; pass the previous page's `endCursor` as `after` for the next. */
export function useInsights(
  page: { first?: number; after?: string } = {},
  options?: WpQueryOptions<CursorPage<InsightListItem>>,
) {
  const locale = useWpLocale();
  const first = page.first ?? INSIGHTS_PAGE_SIZE;
  return useQuery({
    ...options,
    queryKey: wpKeys.insights(locale, first, page.after),
    queryFn: () => getInsights(locale, first, page.after),
  });
}

export function useInsight(uri: string, options?: WpQueryOptions<Insight | null>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.insight(uri, locale),
    queryFn: () => getInsight(uri, locale),
    enabled: options?.enabled ?? Boolean(uri),
  });
}

export function useInsightTypes(options?: WpQueryOptions<InsightTermSummary[]>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.insightTerms("type", locale),
    queryFn: () => getInsightTypes(),
  });
}

export function useInsightTopics(options?: WpQueryOptions<InsightTermSummary[]>) {
  const locale = useWpLocale();
  return useQuery({
    ...options,
    queryKey: wpKeys.insightTerms("topic", locale),
    queryFn: () => getInsightTopics(),
  });
}

export function useInsightsByTerm(
  taxonomy: InsightTaxonomy,
  slug: string,
  page: { first?: number; after?: string } = {},
  options?: WpQueryOptions<InsightTermListing | null>,
) {
  const locale = useWpLocale();
  const first = page.first ?? INSIGHTS_PAGE_SIZE;
  return useQuery({
    ...options,
    queryKey: wpKeys.insightsByTerm(taxonomy, slug, locale, first, page.after),
    queryFn: () => getInsightsByTerm(taxonomy, slug, locale, first, page.after),
    enabled: options?.enabled ?? Boolean(slug),
  });
}
