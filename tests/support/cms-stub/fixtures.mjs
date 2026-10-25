// Deterministic WPGraphQL fixtures for the local CMS stub.
//
// Every shape here mirrors the selection sets in lib/wp/queries.ts and the
// inline queries in lib/wp/api.ts; nothing is copied from the live CMS and no
// field exists that those queries do not request (tests/unit/wp/stub-fixtures
// enforces this against the query text actually sent). Content is invented
// and clearly synthetic. English and Arabic variants share structure.
//
// Data variants (see `resolve`):
//   full      every field populated
//   empty     CMS has no content: lists are empty, by-URI/slug lookups miss,
//             options pages carry no groups
//   null-acf  entities exist but every ACF group is null
//   partial   ACF groups exist but every leaf is null and repeaters are null

const MEDIA = "http://127.0.0.1:3199/stub-media";

/** The CMS text is data; the stub only needs two languages. */
const T = {
  en: {
    service: "Contact Centre Outsourcing",
    serviceProblem: "Peaks overwhelm your in-house team.",
    caseStudy: "Stabilising a 200-seat operation",
    solution: "Customer Experience",
    industry: "Government",
    client: "Example Ministry",
    career: "Quality Analyst",
    post: "How to staff a seasonal peak",
    cta: "Talk to an expert",
    hub: "Case studies",
  },
  ar: {
    service: "الاستعانة بمصادر خارجية لمراكز الاتصال",
    serviceProblem: "فترات الذروة تُرهق فريقك الداخلي.",
    caseStudy: "تثبيت تشغيل مركز من ٢٠٠ مقعد",
    solution: "تجربة العملاء",
    industry: "القطاع الحكومي",
    client: "وزارة نموذجية",
    career: "محلل جودة",
    post: "كيف تُجهّز فريقك لموسم الذروة",
    cta: "تحدث إلى خبير",
    hub: "دراسات الحالة",
  },
};

const prefix = (locale) => (locale === "ar" ? "/ar" : "");
const img = (name, alt) => ({ node: { sourceUrl: `${MEDIA}/${name}.jpg`, altText: alt } });
const terms = (...pairs) => ({ nodes: pairs.map(([name, slug]) => ({ name, slug })) });

/** Stable URIs per locale. By-URI lookups accept exactly these. */
export const uris = (locale) => ({
  service: `${prefix(locale)}/services/contact-centre-outsourcing/`,
  caseStudy: `${prefix(locale)}/case-studies/stabilising-a-200-seat-operation/`,
  solution: `${prefix(locale)}/solutions/customer-experience/`,
  industry: `${prefix(locale)}/industries/government/`,
  career: `${prefix(locale)}/careers/quality-analyst/`,
  postSlug: locale === "ar" ? "seasonal-peak-ar" : "seasonal-peak",
});

/* --------------------------------- Service -------------------------------- */

function service(locale, variant) {
  const t = T[locale];
  const u = uris(locale);
  const base = { title: t.service, uri: u.service };
  if (variant === "null-acf") {
    return { ...base, serviceCoreContent: null, serviceProof: null, pillars: null, sectors: null };
  }
  if (variant === "partial") {
    return {
      ...base,
      serviceCoreContent: {
        problemStatement: null,
        serviceImage: null,
        expertCtaLabel: null,
        expertCtaUrl: null,
        faqCtaLabel: null,
        faqCtaUrl: null,
        approachSteps: null,
        capabilities: null,
      },
      serviceProof: {
        results: null,
        relatedCaseStudy: null,
        faqs: null,
        ctaHeading: null,
        ctaDescription: null,
        ctaLabel: null,
        ctaUrl: null,
      },
      pillars: { nodes: [] },
      sectors: { nodes: [] },
    };
  }
  return {
    ...base,
    serviceCoreContent: {
      problemStatement: t.serviceProblem,
      serviceImage: img("service", t.service),
      expertCtaLabel: t.cta,
      expertCtaUrl: "/contact",
      faqCtaLabel: "FAQ",
      faqCtaUrl: "/contact#faq",
      approachSteps: [
        { title: "Assess", description: "Baseline the operation." },
        { title: "Stabilise", description: "Fix the biggest leaks first." },
      ],
      capabilities: [{ capability: "Voice" }, { capability: "Chat" }, { capability: null }],
    },
    serviceProof: {
      results: [{ result: "-32%", metricName: "Handle time", clientDescription: "Regional telecom" }],
      relatedCaseStudy: { nodes: [{ title: t.caseStudy, uri: u.caseStudy }] },
      faqs: [{ question: "How fast can we start?", answer: "Within four weeks." }],
      ctaHeading: t.cta,
      ctaDescription: "Tell us about your operation.",
      ctaLabel: t.cta,
      ctaUrl: "/contact",
    },
    pillars: terms([t.solution, "customer-experience"]),
    sectors: terms([t.industry, "government"]),
  };
}

const serviceListItem = (locale, variant) => {
  const s = service(locale, variant);
  return {
    title: s.title,
    uri: s.uri,
    pillars: variant === "null-acf" ? null : variant === "partial" ? { nodes: [] } : s.pillars,
    serviceCoreContent:
      variant === "null-acf"
        ? null
        : { problemStatement: s.serviceCoreContent.problemStatement },
  };
};

/* ------------------------------- Case study ------------------------------- */

function caseStudy(locale, variant) {
  const t = T[locale];
  const u = uris(locale);
  const base = { title: t.caseStudy, uri: u.caseStudy };
  if (variant === "null-acf") {
    return { ...base, industrySectors: null, caseStudyCoreContent: null };
  }
  if (variant === "partial") {
    return {
      ...base,
      industrySectors: { nodes: [] },
      caseStudyCoreContent: {
        featuredResult: null,
        resultMetric: null,
        clientName: null,
        engagementLength: null,
        scale: null,
        heroMetrics: null,
        heroImage: null,
        challenge: null,
        approach: null,
        results: null,
        clientQuote: null,
        quoteName: null,
        quoteTitle: null,
        quoteOrganisation: null,
        ctaHeading: null,
        ctaDescription: null,
        ctaLabel: null,
        ctaUrl: null,
        relatedServices: null,
      },
    };
  }
  return {
    ...base,
    industrySectors: terms([t.industry, "government"]),
    caseStudyCoreContent: {
      featuredResult: "-32% handle time",
      resultMetric: "AHT",
      clientName: t.client,
      engagementLength: "18 months",
      scale: "200 seats",
      heroMetrics: [{ metric: "-32%", measure: "Handle time" }],
      heroImage: img("case-study", t.caseStudy),
      challenge: "Peaks overwhelmed the team.",
      approach: "Re-baselined staffing and routing.",
      results: [{ measure: "AHT", before: "9m", after: "6m" }],
      clientQuote: "They gave us our evenings back.",
      quoteName: "A. Example",
      quoteTitle: "Director",
      quoteOrganisation: t.client,
      ctaHeading: t.cta,
      ctaDescription: "See how we can help.",
      ctaLabel: t.cta,
      ctaUrl: "/contact",
      relatedServices: { nodes: [{ title: t.service, uri: u.service }] },
    },
  };
}

const caseStudyListItem = (locale, variant) => {
  const c = caseStudy(locale, variant);
  const core = c.caseStudyCoreContent;
  return {
    title: c.title,
    uri: c.uri,
    industrySectors: c.industrySectors,
    caseStudyCoreContent: core && {
      featuredResult: core.featuredResult,
      resultMetric: core.resultMetric,
      clientName: core.clientName,
      heroMetrics: core.heroMetrics,
      heroImage: core.heroImage,
    },
  };
};

/* ---------------------------- Solution / pillar --------------------------- */

function solutionContent(locale, variant) {
  const t = T[locale];
  if (variant === "null-acf") return null;
  if (variant === "partial") {
    return {
      icon: null,
      pillarLabel: null,
      problemStatement: null,
      services: null,
      ctaLabel: null,
      ctaUrl: null,
    };
  }
  return {
    icon: img("solution-icon", t.solution),
    pillarLabel: "Pillar 1",
    problemStatement: t.serviceProblem,
    services: [{ service: t.service }, { service: null }],
    ctaLabel: t.cta,
    ctaUrl: "/contact",
  };
}

const solutionByUri = (locale, variant) => ({
  title: T[locale].solution,
  uri: uris(locale).solution,
  solutionContent: solutionContent(locale, variant),
});

// The Solutions list query also asks for `featuredImage`; SOLUTION_BY_URI does not.
const solutionListItem = (locale, variant) => ({
  title: T[locale].solution,
  uri: uris(locale).solution,
  featuredImage: variant === "full" ? img("solution", T[locale].solution) : null,
  solutionContent: solutionContent(locale, variant),
});

/* -------------------------------- Industry -------------------------------- */

function industry(locale, variant) {
  const t = T[locale];
  const u = uris(locale);
  const base = { title: t.industry, uri: u.industry };
  if (variant === "null-acf") return { ...base, industryCoreContent: null };
  if (variant === "partial") {
    return {
      ...base,
      industryCoreContent: {
        industryIntro: null,
        heroImage: null,
        ctaLabel: null,
        ctaUrl: null,
        procurementItems: null,
        sectorServices: null,
        securityFaqs: null,
        ctaHeading: null,
        ctaDescription: null,
        proofMetric: null,
        proofPoint: null,
      },
    };
  }
  return {
    ...base,
    industryCoreContent: {
      industryIntro: "Citizen services that scale.",
      heroImage: img("industry", t.industry),
      ctaLabel: t.cta,
      ctaUrl: "/contact",
      procurementItems: [{ itemTitle: "Tendering", itemDescription: "Framework-friendly." }],
      sectorServices: [
        {
          service: { nodes: [{ title: t.service, uri: u.service }] },
          serviceDescription: "Voice and chat for citizens.",
        },
      ],
      securityFaqs: [{ question: "Where is data hosted?", answer: "In-country." }],
      ctaHeading: t.cta,
      ctaDescription: "Plan a pilot.",
      proofMetric: "98%",
      proofPoint: "Citizen satisfaction",
    },
  };
}

const industryListItem = (locale, variant) => {
  const i = industry(locale, variant);
  const core = i.industryCoreContent;
  return {
    title: i.title,
    uri: i.uri,
    industryCoreContent: core && { industryIntro: core.industryIntro, heroImage: core.heroImage },
  };
};

/* --------------------------------- Clients -------------------------------- */

const client = (locale, variant) => ({
  id: locale === "ar" ? "Y2xpZW50OjIw" : "Y2xpZW50OjEw",
  databaseId: locale === "ar" ? 20 : 10,
  slug: locale === "ar" ? "example-ministry-ar" : "example-ministry",
  title: T[locale].client,
  featuredImage: variant === "full" ? img("client", T[locale].client) : null,
});

/* --------------------------------- Careers -------------------------------- */

const career = (locale, variant) => ({
  databaseId: locale === "ar" ? 40 : 30,
  title: T[locale].career,
  uri: uris(locale).career,
  slug: locale === "ar" ? "quality-analyst-ar" : "quality-analyst",
  careersCoreContent:
    variant === "null-acf"
      ? null
      : variant === "partial"
        ? { location: null, discipline: null, jobType: null }
        : // Trailing whitespace is a documented CMS quirk (normalizeCareer trims it).
          { location: "Muscat \n", discipline: " Operations", jobType: "Full-time " },
});

/* ------------------------------ Blog / insights --------------------------- */

const post = (locale, variant, withContent) => {
  const t = T[locale];
  const slug = uris(locale).postSlug;
  const row = {
    databaseId: locale === "ar" ? 60 : 50,
    title: t.post,
    slug,
    uri: `/blog/${slug}/`,
    date: "2026-03-05T09:30:00",
    excerpt: `<p>${t.post}</p>\n`,
    ...(withContent ? { content: `<p>${t.post}</p>\n\n<p>Second paragraph.</p>` } : {}),
    featuredImage: variant === "full" ? img("post", t.post) : null,
    categories: terms([locale === "ar" ? "مقالات" : "Articles", "articles"]),
  };
  if (variant === "partial") {
    return {
      ...row,
      excerpt: null,
      ...(withContent ? { content: null } : {}),
      categories: { nodes: [] },
    };
  }
  if (variant === "null-acf") {
    return { ...row, excerpt: null, ...(withContent ? { content: null } : {}), categories: null };
  }
  return row;
};

/* ----------------------------- Options / hubs ----------------------------- */

function hubs(locale, variant) {
  const t = T[locale];
  if (variant === "empty" || variant === "null-acf") {
    return { caseStudiesSettings: null, industriesHubSettings: null, solutionsSettings: null };
  }
  if (variant === "partial") {
    return {
      caseStudiesSettings: {
        caseStudiesHub: {
          hubHeading: null,
          hubIntro: null,
          ctaHeading: null,
          ctaDescription: null,
          ctaLabel: null,
          ctaUrl: null,
        },
      },
      industriesHubSettings: {
        industriesHub: {
          hubHeading: null,
          hubIntro: null,
          ctaHeading: null,
          ctaDescription: null,
          ctaLabel: null,
          ctaUrl: null,
        },
      },
      solutionsSettings: { solutionsHubSettings: { solutionsHeading: null, solutionsIntro: null } },
    };
  }
  return {
    caseStudiesSettings: {
      caseStudiesHub: {
        hubHeading: t.hub,
        hubIntro: "Proof, not promises.",
        ctaHeading: t.cta,
        ctaDescription: "Start a conversation.",
        ctaLabel: t.cta,
        ctaUrl: "/contact",
      },
    },
    industriesHubSettings: {
      industriesHub: {
        hubHeading: t.industry,
        hubIntro: "Sector-specific delivery.",
        ctaHeading: t.cta,
        ctaDescription: "Plan a pilot.",
        ctaLabel: t.cta,
        ctaUrl: "/contact",
      },
    },
    solutionsSettings: {
      solutionsHubSettings: { solutionsHeading: t.solution, solutionsIntro: "Four pillars." },
    },
  };
}

function companyProfile(variant) {
  const file = (name, size) => ({
    node: {
      mediaItemUrl: `${MEDIA}/${name}.pdf`,
      fileSize: size,
      mimeType: "application/pdf",
    },
  });
  if (variant === "empty" || variant === "null-acf") return { aboutSettings: null };
  if (variant === "partial") {
    return {
      aboutSettings: {
        companyProfile: {
          sectionHeading: null,
          sectionIntro: null,
          profileEnLabel: null,
          profileEnFile: null,
          profileArLabel: null,
          profileArFile: null,
        },
      },
    };
  }
  return {
    aboutSettings: {
      companyProfile: {
        sectionHeading: "Company profile",
        sectionIntro: "Download our profile.",
        profileEnLabel: "English",
        // WP returns the size as a number or a formatted string; cover both.
        profileEnFile: file("profile-en", 1048576),
        profileArLabel: "العربية",
        profileArFile: file("profile-ar", "2097152"),
      },
    },
  };
}

/* ------------------------------- Resolution -------------------------------- */

export const VARIANTS = ["full", "empty", "null-acf", "partial"];

const localeOfLanguage = (variables) => (variables?.language === "AR" ? "ar" : "en");
const localeOfUri = (uri) => (typeof uri === "string" && uri.startsWith("/ar/") ? "ar" : "en");

/** Entity row for a by-URI query, or null when the CMS has no such entry. */
function byUri(build, key, variables, variant) {
  if (variant === "empty") return null;
  const locale = localeOfUri(variables?.uri);
  return variables?.uri === uris(locale)[key] ? build(locale, variant) : null;
}

const list = (rows) => ({ nodes: rows });

/**
 * Operation name -> `data` for a variant, or `undefined` when the stub has no
 * fixture for the operation (the server reports that as a GraphQL error and
 * records it as unhandled).
 */
const OPERATIONS = {
  ServiceByUri: (v, variant) => ({ service: byUri(service, "service", v, variant) }),
  Services: (v, variant) => ({
    services: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: variant === "empty" ? [] : [serviceListItem(localeOfLanguage(v), variant)],
    },
  }),
  CaseStudyByUri: (v, variant) => ({ caseStudy: byUri(caseStudy, "caseStudy", v, variant) }),
  CaseStudies: (v, variant) => ({
    caseStudies: list(variant === "empty" ? [] : [caseStudyListItem(localeOfLanguage(v), variant)]),
  }),
  SolutionByUri: (v, variant) => ({ solution: byUri(solutionByUri, "solution", v, variant) }),
  Solutions: (v, variant) => ({
    solutions: list(variant === "empty" ? [] : [solutionListItem(localeOfLanguage(v), variant)]),
  }),
  IndustryByUri: (v, variant) => ({ industry: byUri(industry, "industry", v, variant) }),
  Industries: (v, variant) => ({
    industries: list(variant === "empty" ? [] : [industryListItem(localeOfLanguage(v), variant)]),
  }),
  Clients: (v, variant) => ({
    clients: list(variant === "empty" ? [] : [client(localeOfLanguage(v), variant)]),
  }),
  Hubs: (_v, variant) => hubs("en", variant),
  Careers: (v, variant) => ({
    careers: list(variant === "empty" ? [] : [career(localeOfLanguage(v), variant)]),
  }),
  Posts: (v, variant) => ({
    posts: list(variant === "empty" ? [] : [post(localeOfLanguage(v), variant, false)]),
  }),
  PostBySlug: (v, variant) => {
    if (variant === "empty") return { post: null };
    const locale = ["en", "ar"].find((l) => uris(l).postSlug === v?.id);
    return { post: locale ? post(locale, variant, true) : null };
  },
  CompanyProfile: (_v, variant) => companyProfile(variant),
};

export const KNOWN_OPERATIONS = Object.keys(OPERATIONS);

export function resolve(operation, variables, variant = "full") {
  const build = OPERATIONS[operation];
  return build ? build(variables ?? {}, variant) : undefined;
}
