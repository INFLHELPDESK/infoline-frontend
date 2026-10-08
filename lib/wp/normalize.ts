import type { ImageField } from "./types";

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

/** ACF image → nullable `{ src, alt }`. */
export function normalizeImage(
  image:
    | {
        node?: { sourceUrl?: string | null; altText?: string | null } | null;
      }
    | null
    | undefined,
): ImageField | null {
  const src = image?.node?.sourceUrl;
  if (!src) return null;
  return { src, alt: image?.node?.altText || "" };
}

/* ------------------------------------------------------------------ */
/* Service                                                             */
/* ------------------------------------------------------------------ */

import type {
  Service,
  ServiceApproachStep,
  ServiceResult,
  ServiceFaq,
  Term,
} from "./types";

type RawService = {
  title: string | null;
  uri: string | null;
  serviceCoreContent: {
    problemStatement: string | null;
    serviceImage: Parameters<typeof normalizeImage>[0];
    expertCtaLabel: string | null;
    expertCtaUrl: string | null;
    faqCtaLabel: string | null;
    faqCtaUrl: string | null;
    approachSteps:
      | { title: string | null; description: string | null }[]
      | null;
    capabilities: { capability: string | null }[] | null;
  } | null;
  serviceProof: {
    results:
      | { result: string | null; metricName: string | null; clientDescription: string | null }[]
      | null;
    relatedCaseStudy: { nodes: { title: string | null; uri: string | null }[] } | null;
    faqs: { question: string | null; answer: string | null }[] | null;
    ctaHeading: string | null;
    ctaDescription: string | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
  } | null;
  pillars: { nodes: { name: string | null; slug: string | null }[] } | null;
  sectors: { nodes: { name: string | null; slug: string | null }[] } | null;
};

/** Repeaters return `null` when empty (handover §3) — always coalesce to `[]`. */
export function normalizeService(raw: RawService | null): Service | null {
  if (!raw?.uri) return null;
  const core = raw.serviceCoreContent;
  const proof = raw.serviceProof;

  return {
    title: raw.title ?? "",
    uri: raw.uri,
    problemStatement: core?.problemStatement ?? null,
    image: normalizeImage(core?.serviceImage),
    expertCta: { label: core?.expertCtaLabel ?? null, url: core?.expertCtaUrl ?? null },
    faqCta: { label: core?.faqCtaLabel ?? null, url: core?.faqCtaUrl ?? null },
    approachSteps: (core?.approachSteps ?? []) as ServiceApproachStep[],
    capabilities: (core?.capabilities ?? []).flatMap((c) =>
      c.capability ? [c.capability] : [],
    ),
    proof: {
      results: (proof?.results ?? []) as ServiceResult[],
      relatedCaseStudies: (proof?.relatedCaseStudy?.nodes ?? []).flatMap((n) =>
        n.uri ? [{ title: n.title ?? "", uri: n.uri }] : [],
      ),
      faqs: (proof?.faqs ?? []) as ServiceFaq[],
      cta: {
        heading: proof?.ctaHeading ?? null,
        description: proof?.ctaDescription ?? null,
        label: proof?.ctaLabel ?? null,
        url: proof?.ctaUrl ?? null,
      },
    },
    pillars: (raw.pillars?.nodes ?? []) as Term[],
    sectors: (raw.sectors?.nodes ?? []) as Term[],
  };
}

/* ------------------------------------------------------------------ */
/* Case study                                                          */
/* ------------------------------------------------------------------ */

import type { CaseStudy } from "./types";

type RawCaseStudy = {
  title: string | null;
  uri: string | null;
  industrySectors: { nodes: { name: string | null; slug: string | null }[] } | null;
  caseStudyCoreContent: {
    featuredResult: string | null;
    resultMetric: string | null;
    clientName: string | null;
    engagementLength: string | null;
    scale: string | null;
    heroMetrics: { metric: string | null; measure: string | null }[] | null;
    heroImage: Parameters<typeof normalizeImage>[0];
    challenge: string | null;
    approach: string | null;
    results: { measure: string | null; before: string | null; after: string | null }[] | null;
    clientQuote: string | null;
    quoteName: string | null;
    quoteTitle: string | null;
    quoteOrganisation: string | null;
    ctaHeading: string | null;
    ctaDescription: string | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
    relatedServices: { nodes: { title: string | null; uri: string | null }[] } | null;
  } | null;
};

export function normalizeCaseStudy(raw: RawCaseStudy | null): CaseStudy | null {
  if (!raw?.uri) return null;
  const core = raw.caseStudyCoreContent;

  return {
    title: raw.title ?? "",
    uri: raw.uri,
    industrySectors: (raw.industrySectors?.nodes ?? []) as Term[],
    featuredResult: core?.featuredResult ?? null,
    resultMetric: core?.resultMetric ?? null,
    clientName: core?.clientName ?? null,
    engagementLength: core?.engagementLength ?? null,
    scale: core?.scale ?? null,
    heroMetrics: (core?.heroMetrics ?? []).flatMap((m) =>
      m.metric || m.measure ? [{ metric: m.metric ?? "", measure: m.measure ?? "" }] : [],
    ),
    image: normalizeImage(core?.heroImage),
    challenge: core?.challenge ?? null,
    approach: core?.approach ?? null,
    // NOTE: these are caseStudyCoreContent.results → { measure, before, after }.
    // Do not share a card component with serviceProof.results (different type).
    results: (core?.results ?? []).flatMap((r) =>
      r.measure || r.before || r.after
        ? [{ measure: r.measure ?? "", before: r.before ?? "", after: r.after ?? "" }]
        : [],
    ),
    quote: {
      text: core?.clientQuote ?? null,
      name: core?.quoteName ?? null,
      title: core?.quoteTitle ?? null,
      organisation: core?.quoteOrganisation ?? null,
    },
    cta: {
      heading: core?.ctaHeading ?? null,
      description: core?.ctaDescription ?? null,
      label: core?.ctaLabel ?? null,
      url: core?.ctaUrl ?? null,
    },
    relatedServices: (core?.relatedServices?.nodes ?? []).flatMap((n) =>
      n.uri ? [{ title: n.title ?? "", uri: n.uri }] : [],
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Solution / pillar                                                   */
/* ------------------------------------------------------------------ */

import type { Solution } from "./types";

type RawSolution = {
  title: string | null;
  uri: string | null;
  solutionContent: {
    icon: Parameters<typeof normalizeImage>[0];
    pillarLabel: string | null;
    problemStatement: string | null;
    services: { service: string | null }[] | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
  } | null;
};

export function normalizeSolution(raw: RawSolution | null): Solution | null {
  if (!raw?.uri) return null;
  const content = raw.solutionContent;

  return {
    title: raw.title ?? "",
    uri: raw.uri,
    icon: normalizeImage(content?.icon),
    pillarLabel: content?.pillarLabel ?? null,
    problemStatement: content?.problemStatement ?? null,
    // Handover §3: plain text repeater (not a relationship) — no page links.
    services: (content?.services ?? []).flatMap((s) =>
      s.service ? [s.service] : [],
    ),
    cta: { label: content?.ctaLabel ?? null, url: content?.ctaUrl ?? null },
  };
}

/* ------------------------------------------------------------------ */
/* Industry                                                            */
/* ------------------------------------------------------------------ */

import type { Industry } from "./types";

type RawIndustry = {
  title: string | null;
  uri: string | null;
  industryCoreContent: {
    industryIntro: string | null;
    heroImage: Parameters<typeof normalizeImage>[0];
    ctaLabel: string | null;
    ctaUrl: string | null;
    procurementItems: { itemTitle: string | null; itemDescription: string | null }[] | null;
    sectorServices:
      | { service: { nodes: { title: string | null; uri: string | null }[] } | null; serviceDescription: string | null }[]
      | null;
    securityFaqs: { question: string | null; answer: string | null }[] | null;
    ctaHeading: string | null;
    ctaDescription: string | null;
    proofMetric: string | null;
    proofPoint: string | null;
  } | null;
};

export function normalizeIndustry(raw: RawIndustry | null): Industry | null {
  if (!raw?.uri) return null;
  const core = raw.industryCoreContent;

  return {
    title: raw.title ?? "",
    uri: raw.uri,
    intro: core?.industryIntro ?? null,
    image: normalizeImage(core?.heroImage),
    cta: { label: core?.ctaLabel ?? null, url: core?.ctaUrl ?? null },
    procurementItems: (core?.procurementItems ?? []).flatMap((p) =>
      p.itemTitle || p.itemDescription
        ? [{ title: p.itemTitle ?? "", description: p.itemDescription ?? "" }]
        : [],
    ),
    sectorServices: (core?.sectorServices ?? []).map((s) => ({
      services: (s.service?.nodes ?? []).flatMap((n) =>
        n.uri ? [{ title: n.title ?? "", uri: n.uri }] : [],
      ),
      description: s.serviceDescription ?? null,
    })),
    faqs: (core?.securityFaqs ?? []) as ServiceFaq[],
    ctaBand: {
      heading: core?.ctaHeading ?? null,
      description: core?.ctaDescription ?? null,
    },
    proof: { metric: core?.proofMetric ?? null, point: core?.proofPoint ?? null },
  };
}

/* ------------------------------------------------------------------ */
/* Client                                                              */
/* ------------------------------------------------------------------ */

import type { Client } from "./types";

type RawClient = {
  id: string | null;
  databaseId: number | null;
  slug: string | null;
  title: string | null;
  clientContent: {
    clientName: string | null;
    clientLogo: Parameters<typeof normalizeImage>[0];
  } | null;
};

export function normalizeClient(raw: RawClient | null): Client | null {
  if (!raw) return null;
  return {
    id: raw.id ?? "",
    databaseId: raw.databaseId ?? 0,
    slug: raw.slug ?? "",
    name: raw.clientContent?.clientName ?? raw.title ?? "",
    logo: normalizeImage(raw.clientContent?.clientLogo),
  };
}

/* ------------------------------------------------------------------ */
/* Careers                                                             */
/* ------------------------------------------------------------------ */

import type { Career } from "./types";

type RawCareer = {
  databaseId: number | null;
  title: string | null;
  uri: string | null;
  slug: string | null;
  careersCoreContent: {
    location: string | null;
    discipline: string | null;
    jobType: string | null;
  } | null;
};

export function normalizeCareer(raw: RawCareer | null): Career | null {
  if (!raw?.uri) return null;
  const c = raw.careersCoreContent;
  return {
    databaseId: raw.databaseId ?? 0,
    title: raw.title ?? "",
    uri: raw.uri,
    slug: raw.slug ?? "",
    // CMS values can carry trailing whitespace/newlines (seen in the seed).
    location: c?.location?.trim() || null,
    discipline: c?.discipline?.trim() || null,
    jobType: c?.jobType?.trim() || null,
  };
}

/* ------------------------------------------------------------------ */
/* Blog / insights — posts                                             */
/* ------------------------------------------------------------------ */

import type { Post, PostListItem } from "./types";

type RawPost = {
  databaseId: number | null;
  title: string | null;
  slug: string | null;
  uri: string | null;
  date: string | null;
  excerpt: string | null;
  content?: string | null;
  featuredImage: Parameters<typeof normalizeImage>[0];
  categories: { nodes: { name: string | null; slug: string | null }[] } | null;
};

export function normalizePostListItem(raw: RawPost | null): PostListItem | null {
  if (!raw?.slug) return null;
  return {
    databaseId: raw.databaseId ?? 0,
    title: raw.title ?? "",
    slug: raw.slug,
    uri: raw.uri ?? `/blog/${raw.slug}`,
    date: raw.date ?? "",
    excerpt: raw.excerpt ?? null,
    image: normalizeImage(raw.featuredImage),
    categories: (raw.categories?.nodes ?? []).flatMap((t) =>
      t.name ? [{ name: t.name, slug: t.slug ?? "" }] : [],
    ) as Term[],
  };
}

export function normalizePost(raw: RawPost | null): Post | null {
  const base = normalizePostListItem(raw);
  if (!base) return null;
  return { ...base, content: raw?.content ?? null };
}

/* ------------------------------------------------------------------ */
/* Company profile (About downloads)                                   */
/* ------------------------------------------------------------------ */

import type { CompanyProfile, CompanyProfileFile } from "./types";

type RawProfileFile = {
  node?: {
    mediaItemUrl?: string | null;
    fileSize?: number | string | null;
    mimeType?: string | null;
  } | null;
} | null;

function normalizeProfileFile(file: RawProfileFile): CompanyProfileFile | null {
  const url = file?.node?.mediaItemUrl;
  if (!url) return null;
  const rawSize = file?.node?.fileSize;
  const fileSize =
    typeof rawSize === "number"
      ? rawSize
      : typeof rawSize === "string" && /^\d+$/.test(rawSize.trim())
        ? Number(rawSize.trim())
        : null;
  return { url, fileSize, mimeType: file?.node?.mimeType ?? null };
}

type RawCompanyProfile = {
  aboutSettings: {
    companyProfile: {
      sectionHeading: string | null;
      sectionIntro: string | null;
      profileEnLabel: string | null;
      profileEnFile: RawProfileFile;
      profileArLabel: string | null;
      profileArFile: RawProfileFile;
    } | null;
  } | null;
};

export function normalizeCompanyProfile(
  raw: RawCompanyProfile | null,
): CompanyProfile {
  const p = raw?.aboutSettings?.companyProfile;
  return {
    heading: p?.sectionHeading ?? null,
    intro: p?.sectionIntro ?? null,
    en: {
      label: p?.profileEnLabel ?? null,
      file: normalizeProfileFile(p?.profileEnFile ?? null),
    },
    ar: {
      label: p?.profileArLabel ?? null,
      file: normalizeProfileFile(p?.profileArFile ?? null),
    },
  };
}
