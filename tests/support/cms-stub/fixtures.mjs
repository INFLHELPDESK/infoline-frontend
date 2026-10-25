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
//
// Plus one cross-cutting scenario, `NO_ARABIC_INSIGHTS`: everything is `full`
// except that no Arabic Insight exists (the live CMS today). Arabic listings are
// empty and an `/ar/…` lookup is answered with the English record, exactly as
// Polylang does.

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
  insight: `${prefix(locale)}/insights/lead-article/`,
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

/* ------------------------------ Insights (CPT) ----------------------------- */

/** Scenario name: Arabic Insights are not published (see header). */
export const NO_ARABIC_INSIGHTS = "arabic-insights-unpublished";

/**
 * Terms are language-neutral in the live CMS (no per-language term records), so
 * both locales carry the same English term names — deliberately not "translated".
 */
const INSIGHT_TYPES = { article: "Article", event: "Event", news: "News" };
const INSIGHT_TOPICS = {
  "ai-digital-acceleration": "AI & Digital Acceleration",
  "clarity-speed": "Clarity & Speed",
  "culture-excellence": "Culture Excellence",
  "value-growth": "Value Growth",
};

/** Scenario name: enough English and Arabic articles to need a second page (Load more). */
export const MANY_ARTICLES = "many-article-insights";

/** Extra articles for `MANY_ARTICLES`, older than every base row (still newest first). */
const EXTRA_ARTICLES = Array.from({ length: 14 }, (_, i) => ({
  slug: `bulk-article-${i + 1}`,
  type: "article",
  topic: null,
  date: `2026-08-${String(28 - i).padStart(2, "0")}T09:00:00`,
  featured: false,
  image: false,
  translated: false,
  title: { en: `Bulk article ${i + 1}`, ar: `مقال إضافي ${i + 1}` },
}));

/**
 * Scenario name: 80 newer English-only articles sit in front of the real ones, so
 * an Arabic term-side scan meets more than five consecutive pages (12 records
 * each) without a single Arabic record before it finds one.
 */
export const BURIED_ARABIC = "arabic-articles-buried";

/** English-only articles, newer than every base row. */
const ENGLISH_ONLY_ARTICLES = Array.from({ length: 80 }, (_, i) => ({
  slug: `english-only-${i + 1}`,
  type: "article",
  topic: null,
  englishOnly: true,
  date: `2026-12-${String(28 - (i % 28)).padStart(2, "0")}T${String(23 - Math.floor(i / 28)).padStart(2, "0")}:00:00`,
  featured: false,
  image: false,
  translated: false,
  title: { en: `English only ${i + 1}`, ar: "" },
}));

/** Newest first, as the CMS orders them (DATE DESC). EN and AR share the rows. */
const INSIGHT_ROWS = [
  {
    slug: "lead-article",
    type: "article",
    topic: "clarity-speed",
    date: "2026-10-12T09:00:00",
    featured: true,
    image: true,
    translated: true,
    title: { en: "A score that had not moved in quarters", ar: "نتيجة لم تتحرك منذ أرباع" },
  },
  {
    slug: "event-conference",
    type: "event",
    topic: "clarity-speed",
    date: "2026-10-10T09:00:00",
    featured: false,
    image: true,
    translated: false,
    event: {
      eventStart: "2026-11-17T00:00:00+00:00",
      eventEnd: "2026-11-18T00:00:00+00:00",
      eventLocation: "Example Convention Centre, Muscat",
      eventUrl: "https://example.test/register",
    },
    title: { en: "Example CX Forum 2026", ar: "منتدى تجربة العملاء ٢٠٢٦" },
  },
  {
    slug: "news-update",
    type: "news",
    topic: "value-growth",
    date: "2026-10-05T09:00:00",
    featured: false,
    image: false,
    translated: false,
    title: { en: "Infoline renews its quality certification", ar: "إنفولاين تجدد شهادة الجودة" },
  },
  {
    slug: "event-open-ended",
    type: "event",
    topic: "ai-digital-acceleration",
    date: "2026-09-28T09:00:00",
    featured: false,
    image: false,
    translated: false,
    event: {
      eventStart: "2026-12-03T00:00:00+00:00",
      eventEnd: null,
      eventLocation: "Online",
      eventUrl: null,
    },
    title: { en: "Webinar with no end date", ar: "ندوة بلا موعد انتهاء" },
  },
  {
    slug: "minimal-article",
    type: "article",
    topic: null,
    date: "2026-09-01T09:00:00",
    featured: false,
    image: false,
    translated: false,
    minimal: true,
    title: { en: "A minimal article", ar: "مقال مختصر" },
  },
];

/** Every row any scenario can serve; ids are stable across scenarios. */
const ALL_INSIGHT_ROWS = [...INSIGHT_ROWS, ...EXTRA_ARTICLES, ...ENGLISH_ONLY_ARTICLES];
const rowsFor = (variant) =>
  variant === MANY_ARTICLES
    ? [...INSIGHT_ROWS, ...EXTRA_ARTICLES]
    : variant === BURIED_ARABIC
      ? [...ENGLISH_ONLY_ARTICLES, ...INSIGHT_ROWS]
      : INSIGHT_ROWS;
/** A row exists in `locale` unless it is an English-only article. */
const rowInLocale = (row, locale) => !(row.englishOnly && locale === "ar");

const OTHER = { en: "ar", ar: "en" };
const insightUri = (locale, slug) => `${prefix(locale)}/insights/${slug}/`;
const insightId = (locale, index) => (locale === "ar" ? 9100 : 9000) + index;

/** One Insight as the list selection returns it (`detail` adds body and SEO). */
function insightNode(row, locale, variant, detail) {
  const index = ALL_INSIGHT_ROWS.indexOf(row);
  const title = row.title[locale];
  const node = {
    databaseId: insightId(locale, index),
    title,
    slug: row.slug,
    uri: insightUri(locale, row.slug),
    date: row.date,
    excerpt: row.minimal ? null : `<p>${title}</p>\n`,
    language: { code: locale.toUpperCase() },
    translations: row.translated
      ? [{ uri: insightUri(OTHER[locale], row.slug), language: { code: OTHER[locale].toUpperCase() } }]
      : [],
    featuredImage: row.image ? img(`insight-${row.slug}`, title) : null,
    insightTypes: terms([INSIGHT_TYPES[row.type], row.type]),
    insightTopics: row.topic ? terms([INSIGHT_TOPICS[row.topic], row.topic]) : { nodes: [] },
    insightContent: { isFeatured: row.featured },
    eventDetails: row.event ?? null,
  };
  if (detail) {
    node.content = row.minimal ? null : `<p>${title}</p>\n<p>Body.</p>\n`;
    node.seo = row.minimal
      ? { title: null, metaDesc: "", opengraphTitle: null, opengraphDescription: null }
      : {
          title: `${title} - Infoline`,
          metaDesc: "",
          opengraphTitle: `${title} - Infoline`,
          opengraphDescription: title,
        };
  }
  if (variant === "null-acf") {
    return {
      ...node,
      excerpt: null,
      translations: null,
      featuredImage: null,
      insightTypes: null,
      insightTopics: null,
      insightContent: null,
      eventDetails: null,
      ...(detail ? { content: null, seo: null } : {}),
    };
  }
  if (variant === "partial") {
    return {
      ...node,
      excerpt: null,
      translations: [],
      featuredImage: { node: null },
      insightTypes: { nodes: [] },
      insightTopics: { nodes: [] },
      insightContent: { isFeatured: null },
      eventDetails: { eventStart: null, eventEnd: null, eventLocation: null, eventUrl: null },
      ...(detail
        ? {
            content: null,
            seo: { title: null, metaDesc: null, opengraphTitle: null, opengraphDescription: null },
          }
        : {}),
    };
  }
  return node;
}

/** Languages whose Insights exist for this variant. */
const insightLocales = (variant) => (variant === NO_ARABIC_INSIGHTS ? ["en"] : ["en", "ar"]);
/** The scenarios that change Insights data only (every other operation sees `full`). */
const isInsightScenario = (variant) => variant === NO_ARABIC_INSIGHTS || variant === MANY_ARTICLES || variant === BURIED_ARABIC;
/** The shape variant the node builders use (the scenario is not a shape). */
const shapeOf = (variant) => (isInsightScenario(variant) ? "full" : variant);

const encodeCursor = (index) => Buffer.from(`arrayconnection:${index}`).toString("base64");
const decodeCursor = (cursor) => {
  const match = /^arrayconnection:(\d+)$/.exec(Buffer.from(String(cursor), "base64").toString());
  return match ? Number(match[1]) : -1;
};

/** Cursor-paginated connection over already-ordered nodes (`first` defaults to 12). */
function connection(nodes, { first = 12, after } = {}) {
  const start = after ? decodeCursor(after) + 1 : 0;
  const page = nodes.slice(start, start + first);
  const end = start + page.length;
  return {
    pageInfo: {
      hasNextPage: end < nodes.length,
      endCursor: page.length ? encodeCursor(end - 1) : null,
    },
    nodes: page,
  };
}

/** Every language's Insights, newest first (EN before AR on equal dates), filtered by `keep`. */
function mixedInsightNodes(variant, keep) {
  return rowsFor(variant).filter(keep).flatMap((row) =>
    insightLocales(variant)
      .filter((locale) => rowInLocale(row, locale))
      .map((locale) => insightNode(row, locale, shapeOf(variant), false)),
  );
}

function insightsList(v, variant) {
  const locale = localeOfLanguage(v);
  const nodes =
    variant === "empty" || !insightLocales(variant).includes(locale)
      ? []
      : rowsFor(variant)
          .filter((row) => rowInLocale(row, locale))
          .map((row) => insightNode(row, locale, shapeOf(variant), false));
  return { insights: connection(nodes, v) };
}

/**
 * By-URI lookup. When the Arabic record is not published, Polylang answers an
 * `/ar/<slug>/` lookup with the ENGLISH record (observed on the live CMS); the
 * client's language check is what keeps it off an Arabic page.
 */
function insightByUri(v, variant) {
  if (variant === "empty") return { insight: null };
  const uri = String(v?.uri ?? "");
  const requested = localeOfUri(uri);
  const path = requested === "ar" ? uri.slice(3) : uri;
  const row = rowsFor(variant).find((r) => insightUri("en", r.slug) === path);
  if (!row) return { insight: null };
  const served = insightLocales(variant).includes(requested) ? requested : "en";
  return { insight: insightNode(row, served, shapeOf(variant), true) };
}

/** The CMS `count` spans every language. */
const termCount = (rows, variant) =>
  variant === "partial" ? null : rows.length * insightLocales(variant).length;

const rowsOfType = (slug, variant) => rowsFor(variant).filter((r) => r.type === slug);
const rowsOfTopic = (slug, variant) => rowsFor(variant).filter((r) => r.topic === slug);

const termNodes = (names, rowsOf, variant) =>
  variant === "empty"
    ? []
    : Object.entries(names).map(([slug, name]) => ({
        name,
        slug,
        count: termCount(rowsOf(slug, variant), variant),
      }));

/** Term-side listing: the connection cannot filter by language, so it mixes them. */
function termListing(root, names, rowsOf, v, variant) {
  const name = names[v?.slug];
  if (variant === "empty" || !name) return { [root]: null };
  const rows = rowsOf(v.slug, variant);
  return {
    [root]: {
      name,
      slug: v.slug,
      count: termCount(rows, variant),
      insights: connection(
        mixedInsightNodes(variant, (row) => rows.includes(row)),
        v,
      ),
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
  Insights: insightsList,
  InsightByUri: insightByUri,
  InsightTypes: (_v, variant) => ({
    insightTypes: { nodes: termNodes(INSIGHT_TYPES, rowsOfType, variant) },
  }),
  InsightTopics: (_v, variant) => ({
    insightTopics: { nodes: termNodes(INSIGHT_TOPICS, rowsOfTopic, variant) },
  }),
  InsightTypeInsights: (v, variant) =>
    termListing("insightType", INSIGHT_TYPES, rowsOfType, v, variant),
  InsightTopicInsights: (v, variant) =>
    termListing("insightTopic", INSIGHT_TOPICS, rowsOfTopic, v, variant),
};

/** Operations whose data depends on the Insights-only scenarios. */
const INSIGHT_OPERATIONS = new Set([
  "Insights",
  "InsightByUri",
  "InsightTypes",
  "InsightTopics",
  "InsightTypeInsights",
  "InsightTopicInsights",
]);

export const KNOWN_OPERATIONS = Object.keys(OPERATIONS);

export function resolve(operation, variables, variant = "full") {
  const build = OPERATIONS[operation];
  if (!build) return undefined;
  // Every other operation sees the scenario as plain `full` data.
  const effective = isInsightScenario(variant) && !INSIGHT_OPERATIONS.has(operation) ? "full" : variant;
  return build(variables ?? {}, effective);
}
