import { stripHtml } from "@/lib/content-adapters";
import { wpFetch, wpNodes } from "./client";
import {
  SERVICE_BY_URI,
  SERVICES_LIST,
  CASE_STUDY_BY_URI,
  SOLUTION_BY_URI,
  INDUSTRY_BY_URI,
  CLIENTS,
  HUBS,
  CAREERS,
  POSTS,
  POST_BY_SLUG,
  COMPANY_PROFILE,
} from "./queries";
import {
  normalizeService,
  normalizeCaseStudy,
  normalizeSolution,
  normalizeIndustry,
  normalizeClient,
  normalizeCareer,
  normalizePostListItem,
  normalizePost,
  normalizeCompanyProfile,
} from "./normalize";
import type {
  Service,
  ServiceListItem,
  CaseStudy,
  Solution,
  Industry,
  Client,
  Hubs,
  Career,
  Post,
  PostListItem,
  PostCard,
  CompanyProfile,
} from "./types";

/**
 * Locale handling (handover §7: "build routing so it can take a locale").
 *
 * The WPML layer is not configured yet, but the seed already carries /ar/…
 * translations and WPGraphQL accepts `where: { language: EN }` (verified live).
 * Every fetcher takes a `locale` and:
 *  - listings/hubs filter server-side by language;
 *  - single-by-URI fetchers accept the locale-stripped URI (e.g.
 *    "/services/contact-centre-outsourcing/") so routes stay identical across
 *    locales once WPML lands; when `locale === "ar"` today the Arabic seed
 *    entries are addressable by their /ar/… URIs.
 */

export type WpLocale = "en" | "ar";

function languageFilter(locale: WpLocale) {
  return locale === "ar" ? "AR" : "EN";
}

/** Prepend /ar for Arabic lookups while routes stay locale-stripped. */
function uriForLocale(uri: string, locale: WpLocale) {
  const clean = uri.startsWith("/") ? uri : `/${uri}`;
  return locale === "ar" ? `/ar${clean}` : clean;
}

/* --------------------------------- Service -------------------------------- */

export async function getService(
  uri: string,
  locale: WpLocale = "en",
): Promise<Service | null> {
  const data = await wpFetch<{ service: Parameters<typeof normalizeService>[0] }>(
    SERVICE_BY_URI,
    { uri: uriForLocale(uri, locale) },
    undefined,
    { roots: ["service"] },
  );
  return normalizeService(data.service);
}

export type Paginated<T> = {
  items: T[];
  nextPage?: number | null;
};

export async function getServices(
  locale: WpLocale = "en",
  first = 12,
  after?: string,
): Promise<Paginated<ServiceListItem>> {
  const data = await wpFetch<{
    services: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: {
        title: string | null;
        uri: string | null;
        pillars: { nodes: { name: string | null; slug: string | null }[] } | null;
        serviceCoreContent: { problemStatement: string | null } | null;
      }[];
    };
  }>(SERVICES_LIST, { first, after, language: languageFilter(locale) }, undefined, {
    roots: ["services"],
  });

  return {
    items: wpNodes(data.services, "services").flatMap((n) =>
      n.uri
        ? [
            {
              title: n.title ?? "",
              uri: n.uri,
              pillars: (n.pillars?.nodes ?? []).map((t) => ({
                name: t.name ?? "",
                slug: t.slug ?? "",
              })),
              problemStatement: n.serviceCoreContent?.problemStatement ?? null,
            },
          ]
        : [],
    ),
    nextPage: data.services.pageInfo?.hasNextPage ? 1 : null,
    // endCursor carried through for infinite cursors if needed:
    ...(data.services.pageInfo?.hasNextPage
      ? { endCursor: data.services.pageInfo.endCursor }
      : {}),
  } as Paginated<ServiceListItem> & { endCursor?: string | null };
}

/* ------------------------------- Case study ------------------------------- */

export async function getCaseStudy(
  uri: string,
  locale: WpLocale = "en",
): Promise<CaseStudy | null> {
  const data = await wpFetch<{
    caseStudy: Parameters<typeof normalizeCaseStudy>[0];
  }>(CASE_STUDY_BY_URI, { uri: uriForLocale(uri, locale) }, undefined, {
    roots: ["caseStudy"],
  });
  return normalizeCaseStudy(data.caseStudy);
}

/**
 * Case studies listing, optionally filtered by industrySectors slug
 * (handover §6 test pass).
 *
 * NOTE (backend gap, report per handover §9): the live schema does NOT expose
 * a where-arg for filtering case studies by the industrySectors taxonomy
 * (verified — `taxQuery` and taxonomy-named args are both absent from
 * RootQueryToCaseStudyConnectionWhereArgs). Filtering therefore happens
 * client-side on the returned nodes; when the backend adds the where-arg,
 * move it into the query and drop the local filter.
 */
export async function getCaseStudies(
  locale: WpLocale = "en",
  sectorSlug?: string,
  first = 50,
): Promise<
  Paginated<
    Pick<
      CaseStudy,
      | "title"
      | "uri"
      | "industrySectors"
      | "featuredResult"
      | "resultMetric"
      | "clientName"
      | "heroMetrics"
      | "image"
    >
  >
> {
  const data = await wpFetch<{
    caseStudies: {
      nodes: {
        title: string | null;
        uri: string | null;
        industrySectors: { nodes: { name: string | null; slug: string | null }[] } | null;
        caseStudyCoreContent: {
          featuredResult: string | null;
          resultMetric: string | null;
          clientName: string | null;
          heroMetrics: { metric: string | null; measure: string | null }[] | null;
          heroImage:
            | { node?: { sourceUrl?: string | null; altText?: string | null } | null }
            | null;
        } | null;
      }[];
    };
  }>(
    /* GraphQL */ `
      query CaseStudies($first: Int, $language: LanguageCodeFilterEnum) {
        caseStudies(first: $first, where: { language: $language }) {
          nodes {
            title
            uri
            industrySectors {
              nodes {
                name
                slug
              }
            }
            caseStudyCoreContent {
              featuredResult
              resultMetric
              clientName
              heroMetrics {
                metric
                measure
              }
              heroImage {
                node {
                  sourceUrl
                  altText
                }
              }
            }
          }
        }
      }
    `,
    { first, language: languageFilter(locale) },
    undefined,
    { roots: ["caseStudies"] },
  );

  const items = wpNodes(data.caseStudies, "caseStudies").flatMap((n) => {
    if (!n.uri) return [];
    const core = n.caseStudyCoreContent;
    return [
      {
        title: n.title ?? "",
        uri: n.uri,
        industrySectors: (n.industrySectors?.nodes ?? []).map((t) => ({
          name: t.name ?? "",
          slug: t.slug ?? "",
        })),
        featuredResult: core?.featuredResult ?? null,
        resultMetric: core?.resultMetric ?? null,
        clientName: core?.clientName ?? null,
        heroMetrics: (core?.heroMetrics ?? []).map((m) => ({
          metric: m.metric ?? "",
          measure: m.measure ?? "",
        })),
        image: core?.heroImage?.node?.sourceUrl
          ? { src: core.heroImage.node.sourceUrl, alt: core.heroImage.node.altText ?? "" }
          : null,
      },
    ];
  });

  // Client-side sector filter until the backend exposes the where-arg.
  const filtered = sectorSlug
    ? items.filter((item) => item.industrySectors.some((t) => t.slug === sectorSlug))
    : items;

  return { items: filtered, nextPage: null };
}

/* ---------------------------- Solution / pillar --------------------------- */

export async function getSolution(
  uri: string,
  locale: WpLocale = "en",
): Promise<Solution | null> {
  const data = await wpFetch<{
    solution: Parameters<typeof normalizeSolution>[0];
  }>(SOLUTION_BY_URI, { uri: uriForLocale(uri, locale) }, undefined, {
    roots: ["solution"],
  });
  return normalizeSolution(data.solution);
}

export async function getSolutions(
  locale: WpLocale = "en",
  first = 12,
): Promise<Paginated<Solution>> {
  const data = await wpFetch<{
    solutions: {
      nodes: Parameters<typeof normalizeSolution>[0][];
    };
  }>(
    /* GraphQL */ `
      query Solutions($first: Int, $language: LanguageCodeFilterEnum) {
        solutions(first: $first, where: { language: $language }) {
          nodes {
            title
            uri
            featuredImage {
              node {
                sourceUrl
                altText
              }
            }
            solutionContent {
              icon {
                node {
                  sourceUrl
                  altText
                }
              }
              pillarLabel
              problemStatement
              services {
                service
              }
              ctaLabel
              ctaUrl
            }
          }
        }
      }
    `,
    { first, language: languageFilter(locale) },
    undefined,
    { roots: ["solutions"] },
  );
  return { items: wpNodes(data.solutions, "solutions").flatMap((n) => normalizeSolution(n) ?? []), nextPage: null };
}

/* -------------------------------- Industry -------------------------------- */

export async function getIndustry(
  uri: string,
  locale: WpLocale = "en",
): Promise<Industry | null> {
  const data = await wpFetch<{
    industry: Parameters<typeof normalizeIndustry>[0];
  }>(INDUSTRY_BY_URI, { uri: uriForLocale(uri, locale) }, undefined, {
    roots: ["industry"],
  });
  return normalizeIndustry(data.industry);
}

export async function getIndustries(
  locale: WpLocale = "en",
  first = 12,
): Promise<Paginated<Pick<Industry, "title" | "uri" | "intro" | "image">>> {
  const data = await wpFetch<{
    industries: {
      nodes: {
        title: string | null;
        uri: string | null;
        industryCoreContent: {
          industryIntro: string | null;
          heroImage:
            | { node?: { sourceUrl?: string | null; altText?: string | null } | null }
            | null;
        } | null;
      }[];
    };
  }>(
    /* GraphQL */ `
      query Industries($first: Int, $language: LanguageCodeFilterEnum) {
        industries(first: $first, where: { language: $language }) {
          nodes {
            title
            uri
            industryCoreContent {
              industryIntro
              heroImage {
                node {
                  sourceUrl
                  altText
                }
              }
            }
          }
        }
      }
    `,
    { first, language: languageFilter(locale) },
    undefined,
    { roots: ["industries"] },
  );
  return {
    items: wpNodes(data.industries, "industries").flatMap((n) =>
      n.uri
        ? [
            {
              title: n.title ?? "",
              uri: n.uri,
              intro: n.industryCoreContent?.industryIntro ?? null,
              image: n.industryCoreContent?.heroImage?.node?.sourceUrl
                ? {
                    src: n.industryCoreContent.heroImage.node.sourceUrl,
                    alt: n.industryCoreContent.heroImage.node.altText ?? "",
                  }
                : null,
            },
          ]
        : [],
    ),
    nextPage: null,
  };
}

/* --------------------------------- Clients -------------------------------- */

export async function getClients(locale: WpLocale = "en"): Promise<Client[]> {
  const data = await wpFetch<{ clients: { nodes: Parameters<typeof normalizeClient>[0][] } }>(
    CLIENTS,
    { language: languageFilter(locale) },
    undefined,
    { roots: ["clients"] },
  );
  return wpNodes(data.clients, "clients").flatMap((n) => normalizeClient(n) ?? []);
}

/* ---------------------------- Hubs / options ------------------------------ */

/**
 * Hub/options content. NOTE: the Hubs query takes no language filter today —
 * options pages are language-neutral in the current CMS model. When WPML
 * lands, options pages usually get per-language copies; thread `locale` in
 * here first if the backend exposes it.
 */
export async function getHubs(): Promise<Hubs> {
  const data = await wpFetch<{
    caseStudiesSettings: {
      caseStudiesHub: {
        hubHeading: string | null;
        hubIntro: string | null;
        ctaHeading: string | null;
        ctaDescription: string | null;
        ctaLabel: string | null;
        ctaUrl: string | null;
      } | null;
    } | null;
    industriesHubSettings: {
      industriesHub: {
        hubHeading: string | null;
        hubIntro: string | null;
        ctaHeading: string | null;
        ctaDescription: string | null;
        ctaLabel: string | null;
        ctaUrl: string | null;
      } | null;
    } | null;
    solutionsSettings: {
      solutionsHubSettings: {
        solutionsHeading: string | null;
        solutionsIntro: string | null;
      } | null;
    } | null;
  }>(HUBS, {}, undefined, {
    roots: ["caseStudiesSettings", "industriesHubSettings", "solutionsSettings"],
  });

  const cs = data.caseStudiesSettings?.caseStudiesHub;
  const ind = data.industriesHubSettings?.industriesHub;
  const sol = data.solutionsSettings?.solutionsHubSettings;

  return {
    caseStudies: {
      heading: cs?.hubHeading ?? "",
      intro: cs?.hubIntro ?? "",
      ctaHeading: cs?.ctaHeading ?? null,
      description: cs?.ctaDescription ?? null,
      label: cs?.ctaLabel ?? null,
      url: cs?.ctaUrl ?? null,
    },
    industries: {
      heading: ind?.hubHeading ?? "",
      intro: ind?.hubIntro ?? "",
      ctaHeading: ind?.ctaHeading ?? null,
      description: ind?.ctaDescription ?? null,
      label: ind?.ctaLabel ?? null,
      url: ind?.ctaUrl ?? null,
    },
    solutions: {
      heading: sol?.solutionsHeading ?? "",
      intro: sol?.solutionsIntro ?? "",
    },
  };
}

/* --------------------------------- Careers -------------------------------- */

export async function getCareers(locale: WpLocale = "en"): Promise<Career[]> {
  const data = await wpFetch<{
    careers: { nodes: Parameters<typeof normalizeCareer>[0][] };
  }>(CAREERS, { language: languageFilter(locale) }, undefined, { roots: ["careers"] });
  return wpNodes(data.careers, "careers").flatMap((n) => normalizeCareer(n) ?? []);
}

/* ----------------------------- Blog / insights ---------------------------- */

export async function getPosts(
  locale: WpLocale = "en",
  first = 100,
): Promise<PostListItem[]> {
  const data = await wpFetch<{
    posts: { nodes: Parameters<typeof normalizePostListItem>[0][] };
  }>(POSTS, { first, language: languageFilter(locale) }, undefined, { roots: ["posts"] });
  return wpNodes(data.posts, "posts").flatMap((n) => normalizePostListItem(n) ?? []);
}

/**
 * The newest `first` posts reduced to teaser cards: the CMS is asked for only
 * that many, and only the card fields (first category) are kept, so the result
 * is small enough to dehydrate into a page.
 */
/** Longest teaser excerpt carried to the browser; the card clamps it to two lines. */
const CARD_EXCERPT_MAX = 160;

function cardExcerpt(html: string | null): string | null {
  const text = stripHtml(html);
  if (!text) return null;
  return text.length > CARD_EXCERPT_MAX ? `${text.slice(0, CARD_EXCERPT_MAX).trimEnd()}…` : text;
}

export async function getLatestPostCards(
  locale: WpLocale = "en",
  first = 3,
): Promise<PostCard[]> {
  const posts = await getPosts(locale, first);
  return posts.slice(0, first).map(({ title, slug, image, categories, date, excerpt }) => ({
    title,
    slug,
    image,
    categories: categories.slice(0, 1),
    date,
    excerpt: cardExcerpt(excerpt),
  }));
}

export async function getPost(slug: string): Promise<Post | null> {
  const data = await wpFetch<{ post: Parameters<typeof normalizePost>[0] }>(
    POST_BY_SLUG,
    { id: slug },
    undefined,
    { roots: ["post"] },
  );
  return normalizePost(data.post);
}

/* --------------------- Company profile (About downloads) ------------------ */

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const data = await wpFetch<Parameters<typeof normalizeCompanyProfile>[0]>(
    COMPANY_PROFILE,
    {},
    undefined,
    { roots: ["aboutSettings"] },
  );
  return normalizeCompanyProfile(data);
}
