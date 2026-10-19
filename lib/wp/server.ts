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
  getPost,
  getCompanyProfile,
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
 */
import type { QueryClient } from "@tanstack/react-query";

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
