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

/**
 * Server-side helpers for RSC pages: prefetch into the React Query cache so
 * `useQuery` hooks hydrate instantly on the client (and the markup renders
 * with data). Call `queryClient.getQueryData(key)` for the typed result.
 *
 * ```ts
 * // app/[locale]/services/[slug]/page.tsx
 * const qc = getQueryClient();
 * const service = await prefetchService(qc, uri, locale);
 * ```
 *
 * Error contract (every `prefetch*` helper):
 * - Resolves with the normalized value. A single lookup the CMS does not have
 *   resolves `null`; an empty list resolves empty. Both are valid content.
 * - Rejects with a `WpRequestError` (check `error.kind`) for any failure:
 *   http, graphql, network, timeout, malformed, missing-root. Config problems
 *   reject with `WpConfigError`. Nothing is swallowed or turned into empty
 *   content, and a failed query is never dehydrated.
 * - The caller decides the fallback: let it throw (error boundary) or catch it
 *   and render its own. Consumers must not treat a rejection as "no content".
 * - No retries: `fetchQuery` does not retry, so the timeout is the worst case.
 */
import type { QueryClient } from "@tanstack/react-query";
import type { InsightTaxonomy } from "./types";

export async function prefetchService(
  qc: QueryClient,
  uri: string,
  locale: WpLocale = "en",
) {
  return qc.fetchQuery({
    queryKey: wpKeys.service(uri, locale),
    queryFn: () => getService(uri, locale),
  });
}

export async function prefetchServices(qc: QueryClient, locale: WpLocale = "en") {
  return qc.fetchQuery({
    queryKey: wpKeys.services(locale),
    queryFn: () => getServices(locale),
  });
}

export async function prefetchCaseStudy(
  qc: QueryClient,
  uri: string,
  locale: WpLocale = "en",
) {
  return qc.fetchQuery({
    queryKey: wpKeys.caseStudy(uri, locale),
    queryFn: () => getCaseStudy(uri, locale),
  });
}

export async function prefetchCaseStudies(
  qc: QueryClient,
  locale: WpLocale = "en",
  sectorSlug?: string,
) {
  return qc.fetchQuery({
    queryKey: wpKeys.caseStudies(locale, sectorSlug),
    queryFn: () => getCaseStudies(locale, sectorSlug),
  });
}

export async function prefetchSolution(
  qc: QueryClient,
  uri: string,
  locale: WpLocale = "en",
) {
  return qc.fetchQuery({
    queryKey: wpKeys.solution(uri, locale),
    queryFn: () => getSolution(uri, locale),
  });
}

export async function prefetchSolutions(qc: QueryClient, locale: WpLocale = "en") {
  return qc.fetchQuery({
    queryKey: wpKeys.solutions(locale),
    queryFn: () => getSolutions(locale),
  });
}

export async function prefetchIndustry(
  qc: QueryClient,
  uri: string,
  locale: WpLocale = "en",
) {
  return qc.fetchQuery({
    queryKey: wpKeys.industry(uri, locale),
    queryFn: () => getIndustry(uri, locale),
  });
}

export async function prefetchIndustries(qc: QueryClient, locale: WpLocale = "en") {
  return qc.fetchQuery({
    queryKey: wpKeys.industries(locale),
    queryFn: () => getIndustries(locale),
  });
}

export async function prefetchClients(qc: QueryClient, locale: WpLocale = "en") {
  return qc.fetchQuery({
    queryKey: wpKeys.clients(locale),
    queryFn: () => getClients(locale),
  });
}

export async function prefetchHubs(qc: QueryClient, locale: WpLocale = "en") {
  return qc.fetchQuery({
    queryKey: wpKeys.hubs(locale),
    queryFn: () => getHubs(),
  });
}

export async function prefetchCareers(qc: QueryClient, locale: WpLocale = "en") {
  return qc.fetchQuery({
    queryKey: wpKeys.careers(locale),
    queryFn: () => getCareers(locale),
  });
}

export async function prefetchPosts(qc: QueryClient, locale: WpLocale = "en") {
  return qc.fetchQuery({
    queryKey: wpKeys.posts(locale),
    queryFn: () => getPosts(locale),
  });
}

export async function prefetchLatestPosts(
  qc: QueryClient,
  locale: WpLocale = "en",
  first = 3,
) {
  return qc.fetchQuery({
    queryKey: wpKeys.latestPosts(locale, first),
    queryFn: () => getLatestPostCards(locale, first),
  });
}

export async function prefetchPost(
  qc: QueryClient,
  slug: string,
  locale: WpLocale = "en",
) {
  return qc.fetchQuery({
    queryKey: wpKeys.post(slug, locale),
    queryFn: () => getPost(slug),
  });
}

export async function prefetchCompanyProfile(
  qc: QueryClient,
  locale: WpLocale = "en",
) {
  return qc.fetchQuery({
    queryKey: wpKeys.companyProfile(locale),
    queryFn: () => getCompanyProfile(),
  });
}

export async function prefetchInsights(
  qc: QueryClient,
  locale: WpLocale = "en",
  first = INSIGHTS_PAGE_SIZE,
  after?: string,
) {
  return qc.fetchQuery({
    queryKey: wpKeys.insights(locale, first, after),
    queryFn: () => getInsights(locale, first, after),
  });
}

export async function prefetchInsight(
  qc: QueryClient,
  uri: string,
  locale: WpLocale = "en",
) {
  return qc.fetchQuery({
    queryKey: wpKeys.insight(uri, locale),
    queryFn: () => getInsight(uri, locale),
  });
}

export async function prefetchInsightTypes(qc: QueryClient, locale: WpLocale = "en") {
  return qc.fetchQuery({
    queryKey: wpKeys.insightTerms("type", locale),
    queryFn: () => getInsightTypes(),
  });
}

export async function prefetchInsightTopics(qc: QueryClient, locale: WpLocale = "en") {
  return qc.fetchQuery({
    queryKey: wpKeys.insightTerms("topic", locale),
    queryFn: () => getInsightTopics(),
  });
}

export async function prefetchInsightsByTerm(
  qc: QueryClient,
  taxonomy: InsightTaxonomy,
  slug: string,
  locale: WpLocale = "en",
  first = INSIGHTS_PAGE_SIZE,
  after?: string,
) {
  return qc.fetchQuery({
    queryKey: wpKeys.insightsByTerm(taxonomy, slug, locale, first, after),
    queryFn: () => getInsightsByTerm(taxonomy, slug, locale, first, after),
  });
}
