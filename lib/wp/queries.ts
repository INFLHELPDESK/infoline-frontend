/**
 * GraphQL documents, verbatim from the handover §5 (plus listing/hub variants
 * verified against the live endpoint). Field/type names are frozen per §8 —
 * if the backend announces a change, it changes here first.
 */

/* --------------------------------- Service -------------------------------- */

export const SERVICE_BY_URI = /* GraphQL */ `
  query ServiceByUri($uri: ID!) {
    service(id: $uri, idType: URI) {
      title
      uri
      serviceCoreContent {
        problemStatement
        serviceImage {
          node {
            sourceUrl
            altText
          }
        }
        expertCtaLabel
        expertCtaUrl
        faqCtaLabel
        faqCtaUrl
        approachSteps {
          title
          description
        }
        capabilities {
          capability
        }
      }
      serviceProof {
        results {
          result
          metricName
          clientDescription
        }
        relatedCaseStudy {
          nodes {
            ... on CaseStudy {
              title
              uri
            }
          }
        }
        faqs {
          question
          answer
        }
        ctaHeading
        ctaDescription
        ctaLabel
        ctaUrl
      }
      pillars {
        nodes {
          name
          slug
        }
      }
      sectors {
        nodes {
          name
          slug
        }
      }
    }
  }
`;

export const SERVICES_LIST = /* GraphQL */ `
  query Services($first: Int = 12, $after: String, $language: LanguageCodeFilterEnum) {
    services(first: $first, after: $after, where: { language: $language }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        title
        uri
        pillars {
          nodes {
            name
            slug
          }
        }
        serviceCoreContent {
          problemStatement
        }
      }
    }
  }
`;

/* ------------------------------- Case study ------------------------------- */

export const CASE_STUDY_BY_URI = /* GraphQL */ `
  query CaseStudyByUri($uri: ID!) {
    caseStudy(id: $uri, idType: URI) {
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
        engagementLength
        scale
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
        challenge
        approach
        results {
          measure
          before
          after
        }
        clientQuote
        quoteName
        quoteTitle
        quoteOrganisation
        ctaHeading
        ctaDescription
        ctaLabel
        ctaUrl
        relatedServices {
          nodes {
            ... on Service {
              title
              uri
            }
          }
        }
      }
    }
  }
`;

/* ---------------------------- Solution / pillar --------------------------- */

export const SOLUTION_BY_URI = /* GraphQL */ `
  query SolutionByUri($uri: ID!) {
    solution(id: $uri, idType: URI) {
      title
      uri
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
`;

/* -------------------------------- Industry -------------------------------- */

export const INDUSTRY_BY_URI = /* GraphQL */ `
  query IndustryByUri($uri: ID!) {
    industry(id: $uri, idType: URI) {
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
        ctaLabel
        ctaUrl
        procurementItems {
          itemTitle
          itemDescription
        }
        sectorServices {
          service {
            nodes {
              ... on Service {
                title
                uri
              }
            }
          }
          serviceDescription
        }
        securityFaqs {
          question
          answer
        }
        ctaHeading
        ctaDescription
        proofMetric
        proofPoint
      }
    }
  }
`;

/* --------------------------------- Clients -------------------------------- */

export const CLIENTS = /* GraphQL */ `
  query Clients($language: LanguageCodeFilterEnum) {
    clients(first: 100, where: { language: $language }) {
      nodes {
        id
        databaseId
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

/* ---------------------------- Hubs / options ------------------------------ */

/**
 * `hubHeading` is the corrected field name (CMS Revision 1, 23 Oct 2026); the
 * earlier misspelling no longer exists in the schema.
 */
export const HUBS = /* GraphQL */ `
  query Hubs {
    caseStudiesSettings {
      caseStudiesHub {
        hubHeading
        hubIntro
        ctaHeading
        ctaDescription
        ctaLabel
        ctaUrl
      }
    }
    industriesHubSettings {
      industriesHub {
        hubHeading
        hubIntro
        ctaHeading
        ctaDescription
        ctaLabel
        ctaUrl
      }
    }
    solutionsSettings {
      solutionsHubSettings {
        solutionsHeading
        solutionsIntro
      }
    }
  }
`;

/* --------------------------------- Careers -------------------------------- */

/**
 * Careers CPT. ACF group is `careersCoreContent` (verified live) with only
 * `location`, `discipline` and `jobType` — which maps 1:1 to the designed
 * vacancies `Role` ({ title, discipline, location }).
 */
export const CAREERS = /* GraphQL */ `
  query Careers($first: Int = 100, $language: LanguageCodeFilterEnum) {
    careers(first: $first, where: { language: $language }) {
      nodes {
        databaseId
        title
        uri
        slug
        careersCoreContent {
          location
          discipline
          jobType
        }
      }
    }
  }
`;

/* ----------------------------- Blog / insights ---------------------------- */

export const POSTS = /* GraphQL */ `
  query Posts($first: Int = 100, $language: LanguageCodeFilterEnum) {
    posts(first: $first, where: { language: $language }) {
      nodes {
        databaseId
        title
        slug
        uri
        date
        excerpt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

export const POST_BY_SLUG = /* GraphQL */ `
  query PostBySlug($id: ID!) {
    post(id: $id, idType: SLUG) {
      databaseId
      title
      slug
      uri
      date
      excerpt
      content
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      categories {
        nodes {
          name
          slug
        }
      }
    }
  }
`;

/* ------------------------- Insights (`insight` CPT) ------------------------ */

/**
 * Selections verified against the Development schema (read-only introspection,
 * Revision 1 of the CMS update). Notes that shape these documents:
 *  - `where.language` exists on `insights` (Polylang) but NOT on the term-side
 *    `insights` connection, so every node asks for `language { code }` and the
 *    normalizer enforces the requested locale.
 *  - `language { code }` on `insightType` / `insightTopic` currently fails
 *    server-side, so terms never select it.
 *  - `taxQuery` does not exist: taxonomy filtering goes through the term.
 */
const INSIGHT_LIST_FIELDS = /* GraphQL */ `
  databaseId
  title
  slug
  uri
  date
  excerpt
  language {
    code
  }
  translations {
    uri
    language {
      code
    }
  }
  featuredImage {
    node {
      sourceUrl
      altText
    }
  }
  insightTypes {
    nodes {
      name
      slug
    }
  }
  insightTopics {
    nodes {
      name
      slug
    }
  }
  insightContent {
    isFeatured
  }
  eventDetails {
    eventStart
    eventEnd
    eventLocation
    eventUrl
  }
`;

export const INSIGHTS_LIST = /* GraphQL */ `
  query Insights($first: Int = 12, $after: String, $language: LanguageCodeFilterEnum) {
    insights(
      first: $first
      after: $after
      where: { language: $language, orderby: { field: DATE, order: DESC } }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ${INSIGHT_LIST_FIELDS}
      }
    }
  }
`;

export const INSIGHT_BY_URI = /* GraphQL */ `
  query InsightByUri($uri: ID!) {
    insight(id: $uri, idType: URI) {
      ${INSIGHT_LIST_FIELDS}
      content
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
      }
    }
  }
`;

export const INSIGHT_TYPES = /* GraphQL */ `
  query InsightTypes {
    insightTypes(first: 100) {
      nodes {
        name
        slug
        count
      }
    }
  }
`;

export const INSIGHT_TOPICS = /* GraphQL */ `
  query InsightTopics {
    insightTopics(first: 100) {
      nodes {
        name
        slug
        count
      }
    }
  }
`;

export const INSIGHT_TYPE_INSIGHTS = /* GraphQL */ `
  query InsightTypeInsights($slug: ID!, $first: Int = 12, $after: String) {
    insightType(id: $slug, idType: SLUG) {
      name
      slug
      count
      insights(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ${INSIGHT_LIST_FIELDS}
        }
      }
    }
  }
`;

export const INSIGHT_TOPIC_INSIGHTS = /* GraphQL */ `
  query InsightTopicInsights($slug: ID!, $first: Int = 12, $after: String) {
    insightTopic(id: $slug, idType: SLUG) {
      name
      slug
      count
      insights(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ${INSIGHT_LIST_FIELDS}
        }
      }
    }
  }
`;

/* --------------------- Company profile (About downloads) ------------------ */

/**
 * `aboutSettings.companyProfile` (options page). Both EN and AR profile files
 * come back as media nodes with `mediaItemUrl` + `fileSize` + `mimeType`; the
 * section heading/intro and per-file labels can be null (fall back to locale).
 */
export const COMPANY_PROFILE = /* GraphQL */ `
  query CompanyProfile {
    aboutSettings {
      companyProfile {
        sectionHeading
        sectionIntro
        profileEnLabel
        profileEnFile {
          node {
            mediaItemUrl
            fileSize
            mimeType
          }
        }
        profileArLabel
        profileArFile {
          node {
            mediaItemUrl
            fileSize
            mimeType
          }
        }
      }
    }
  }
`;
