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
 * NOTE: `hubHeadin` (no `g`) is the real field name in the live schema —
 * verified against the endpoint. It is a typo in the CMS, not here.
 */
export const HUBS = /* GraphQL */ `
  query Hubs {
    caseStudiesSettings {
      caseStudiesHub {
        hubHeadin
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
