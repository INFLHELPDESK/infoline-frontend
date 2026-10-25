import { describe, expect, it } from "vitest";
import * as api from "@/lib/wp/api";
import { KNOWN_OPERATIONS, VARIANTS, uris } from "../../support/cms-stub/fixtures.mjs";
import { startCmsStub } from "../../support/cms-stub/harness";
import { parseSelection, shapeProblems } from "../../support/selection";

const stub = startCmsStub();

/** Every fetcher in lib/wp/api, called the way a page would call it. */
const FETCHERS: Record<string, (locale: api.WpLocale) => Promise<unknown>> = {
  getService: (l) => api.getService(uris("en").service, l),
  getServices: (l) => api.getServices(l),
  getCaseStudy: (l) => api.getCaseStudy(uris("en").caseStudy, l),
  getCaseStudies: (l) => api.getCaseStudies(l),
  getSolution: (l) => api.getSolution(uris("en").solution, l),
  getSolutions: (l) => api.getSolutions(l),
  getIndustry: (l) => api.getIndustry(uris("en").industry, l),
  getIndustries: (l) => api.getIndustries(l),
  getClients: (l) => api.getClients(l),
  getHubs: () => api.getHubs(),
  getCareers: (l) => api.getCareers(l),
  getPosts: (l) => api.getPosts(l),
  getPost: (l) => api.getPost(uris(l).postSlug),
  getCompanyProfile: () => api.getCompanyProfile(),
  getInsights: (l) => api.getInsights(l),
  getInsight: (l) => api.getInsight(uris("en").insight, l),
  getInsightTypes: () => api.getInsightTypes(),
  getInsightTopics: () => api.getInsightTopics(),
  getInsightsByType: (l) => api.getInsightsByTerm("type", "article", l),
  getInsightsByTopic: (l) => api.getInsightsByTerm("topic", "clarity-speed", l),
};

describe("selection parser", () => {
  it("handles arguments, nested selections and inline fragments", () => {
    const tree = parseSelection(`
      query Q($uri: ID!, $first: Int = 3) {
        thing(id: $uri, idType: URI, where: { language: $first }) {
          title
          group { a b }
          related { nodes { ... on Thing { title uri } } }
        }
      }`);
    expect(tree).toEqual({
      thing: {
        title: null,
        group: { a: null, b: null },
        related: { nodes: { title: null, uri: null } },
      },
    });
  });

  it("reports missing and extra keys", () => {
    const tree = parseSelection("query Q { a { b c } }");
    expect(shapeProblems(tree, { a: { b: 1, d: 2 } })).toEqual(["a: missing c", "a: unselected d"]);
    expect(shapeProblems(tree, { a: null })).toEqual([]);
  });
});

describe("fixtures conform to the queries the app actually sends", () => {
  it("covers every fetcher with a fixture operation", async () => {
    for (const fetcher of Object.values(FETCHERS)) await fetcher("en");
    const operations = new Set(stub.graphqlRequests().map((r) => r.operation));
    expect([...operations].sort()).toEqual([...KNOWN_OPERATIONS].sort());
  });

  describe.each(VARIANTS.map((variant) => [variant === "full" ? "ok" : variant]))(
    "scenario %s",
    (scenario) => {
      it.each(Object.keys(FETCHERS))("%s: response has exactly the selected fields", async (name) => {
        stub.setScenario(scenario);
        for (const locale of ["en", "ar"] as const) {
          stub.requests.length = 0;
          await FETCHERS[name](locale);
          const [request] = stub.graphqlRequests();
          expect(request.data, `${name} ${locale} served data`).toBeDefined();
          expect(shapeProblems(parseSelection(request.query!), request.data)).toEqual([]);
        }
      });
    },
  );
});
