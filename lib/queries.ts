export const SERVICES_QUERY = `
  query Services($first: Int = 12, $after: String) {
    services(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        title
        uri
        pillars { nodes { name slug } }
        serviceCoreContent { problemStatement }
      }
    }
  }
`;

export const SOLUTIONS_QUERY = `
  query Solutions($first: Int = 100) {
    solutions(first: $first) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId
        title
        slug
        uri
        featuredImage { node { sourceUrl altText } }
        solutionContent {
          icon { node { sourceUrl altText } }
          pillarLabel
          problemStatement
          services { service }
          ctaLabel
          ctaUrl
        }
        seo {
          title
          metaDesc
          canonical
          metaRobotsNoindex
        }
      }
    }
  }
`;

export const INDUSTRIES_QUERY = `
  query Industries($first: Int = 100) {
    industries(first: $first) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId
        title
        slug
        uri
        content
        featuredImage { node { sourceUrl altText } }
        industryCoreContent {
          industryIntro
          heroImage { node { sourceUrl altText } }
          ctaLabel
          ctaUrl
          procurementItems { itemTitle itemDescription }
          sectorServices {
            service { nodes { ... on Service { title uri } } }
            serviceDescription
          }
          securityFaqs { question answer }
          ctaHeading
          ctaDescription
          proofMetric
          proofPoint
        }
        seo {
          title
          metaDesc
          canonical
          metaRobotsNoindex
        }
      }
    }
  }
`;

export const CLIENTS_QUERY = `
  query Clients {
    clients(first: 100) {
      nodes {
        id
        databaseId
        slug
        title
        featuredImage { node { sourceUrl altText } }
      }
    }
  }
`;

export const COMPANY_PROFILE_QUERY = `
  query CompanyProfile {
    aboutSettings {
      companyProfile {
        sectionHeading
        sectionIntro
        profileEnLabel
        profileEnFile { node { mediaItemUrl fileSize mimeType } }
        profileArLabel
        profileArFile { node { mediaItemUrl fileSize mimeType } }
      }
    }
  }
`;

export const HUBS_QUERY = `
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

export const SUBMIT_INQUIRY = `
  mutation SubmitInquiry($input: SubmitInquiryInput!) {
    submitInquiry(input: $input) {
      success
      message
      entryId
      emailSent
      validationErrors { field message }
    }
  }
`;
