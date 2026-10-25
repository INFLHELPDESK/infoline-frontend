import { describe, expect, it } from "vitest";
import * as api from "@/lib/wp/api";
import { WpConfigError, wpFetch } from "@/lib/wp/client";
import { uris } from "../../support/cms-stub/fixtures.mjs";
import { startCmsStub } from "../../support/cms-stub/harness";

/**
 * CMS contract tests: lib/wp against the local stub, over real HTTP.
 *
 * VERIFIED here (derived from this repo's source, no live CMS involved):
 *   - the request envelope (POST JSON { query, variables }, operation names,
 *     `language` / `uri` / `id` variables, EN/AR mapping);
 *   - normalized output shapes for full, empty, null-ACF and partial data;
 *   - error handling of wpFetch and the fetchers.
 * ASSUMED, not provable offline (see tests/README.md "CMS contract"):
 *   - that the live WPGraphQL schema still exposes these fields;
 *   - that WPML honours `where: { language }` and `/ar/...` URIs.
 */

const stub = startCmsStub();

const last = () => stub.graphqlRequests().at(-1)!;

describe("request envelope (verified)", () => {
  it("POSTs JSON { query, variables } to the configured endpoint", async () => {
    let init: RequestInit | undefined;
    const original = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo | URL, i?: RequestInit) => {
      init = i;
      return original(input, i);
    }) as typeof fetch;

    await api.getClients("en");

    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    const body = JSON.parse(init?.body as string);
    expect(Object.keys(body).sort()).toEqual(["query", "variables"]);
    expect(last().operation).toBe("Clients");
  });

  it.each([
    ["getServices", (l: api.WpLocale) => api.getServices(l), "Services"],
    ["getCaseStudies", (l: api.WpLocale) => api.getCaseStudies(l), "CaseStudies"],
    ["getSolutions", (l: api.WpLocale) => api.getSolutions(l), "Solutions"],
    ["getIndustries", (l: api.WpLocale) => api.getIndustries(l), "Industries"],
    ["getClients", (l: api.WpLocale) => api.getClients(l), "Clients"],
    ["getCareers", (l: api.WpLocale) => api.getCareers(l), "Careers"],
    ["getPosts", (l: api.WpLocale) => api.getPosts(l), "Posts"],
  ])("%s maps locale to the `language` variable (EN/AR)", async (_name, call, operation) => {
    await call("en");
    expect(last()).toMatchObject({ operation, variables: { language: "EN" } });
    await call("ar");
    expect(last()).toMatchObject({ operation, variables: { language: "AR" } });
  });

  it.each([
    ["getService", (u: string, l: api.WpLocale) => api.getService(u, l), "ServiceByUri", "service"],
    ["getCaseStudy", (u: string, l: api.WpLocale) => api.getCaseStudy(u, l), "CaseStudyByUri", "caseStudy"],
    ["getSolution", (u: string, l: api.WpLocale) => api.getSolution(u, l), "SolutionByUri", "solution"],
    ["getIndustry", (u: string, l: api.WpLocale) => api.getIndustry(u, l), "IndustryByUri", "industry"],
  ] as const)("%s sends the locale-stripped URI for EN and /ar-prefixed for AR", async (_n, call, operation, key) => {
    const stripped = uris("en")[key];
    await call(stripped, "en");
    expect(last()).toMatchObject({ operation, variables: { uri: stripped } });
    await call(stripped, "ar");
    expect(last()).toMatchObject({ operation, variables: { uri: `/ar${stripped}` } });
    // a URI without a leading slash is normalized
    await call(stripped.slice(1), "ar");
    expect(last().variables!.uri).toBe(`/ar${stripped}`);
  });

  it("paginates with first/after and forwards them", async () => {
    await api.getServices("en", 5, "cursor-1");
    expect(last().variables).toEqual({ first: 5, after: "cursor-1", language: "EN" });
  });

  it("post-by-slug uses the slug as `id` and ignores locale (current behaviour)", async () => {
    await api.getPost("seasonal-peak");
    expect(last()).toMatchObject({ operation: "PostBySlug", variables: { id: "seasonal-peak" } });
  });

  it("hubs and company profile take no variables and no language (current behaviour)", async () => {
    await api.getHubs();
    expect(last()).toMatchObject({ operation: "Hubs", variables: {} });
    await api.getCompanyProfile();
    expect(last()).toMatchObject({ operation: "CompanyProfile", variables: {} });
  });
});

describe("content, EN and AR (verified against fixtures)", () => {
  it("normalizes a full service in both locales", async () => {
    const en = await api.getService(uris("en").service, "en");
    const ar = await api.getService(uris("en").service, "ar");
    expect(en).toMatchObject({
      title: "Contact Centre Outsourcing",
      uri: "/services/contact-centre-outsourcing/",
      problemStatement: "Peaks overwhelm your in-house team.",
      expertCta: { label: "Talk to an expert", url: "/contact" },
      capabilities: ["Voice", "Chat"], // the null capability is dropped
      pillars: [{ name: "Customer Experience", slug: "customer-experience" }],
    });
    expect(en?.image).toEqual({
      src: "http://127.0.0.1:3199/stub-media/service.jpg",
      alt: "Contact Centre Outsourcing",
    });
    expect(ar?.uri).toBe("/ar/services/contact-centre-outsourcing/");
    expect(ar?.title).toMatch(/[؀-ۿ]/);
    expect(ar?.proof.cta.label).toMatch(/[؀-ۿ]/);
  });

  it("keeps Arabic text intact end to end (no mojibake)", async () => {
    const ar = await api.getServices("ar");
    expect(ar.items[0].title).toBe("الاستعانة بمصادر خارجية لمراكز الاتصال");
    expect(ar.items[0].problemStatement).toBe("فترات الذروة تُرهق فريقك الداخلي.");
  });

  it("trims whitespace-padded career fields (documented CMS quirk)", async () => {
    const [career] = await api.getCareers("en");
    expect(career).toMatchObject({ location: "Muscat", discipline: "Operations", jobType: "Full-time" });
  });

  it("returns list items, locale-specific, for every list fetcher", async () => {
    for (const locale of ["en", "ar"] as const) {
      expect((await api.getServices(locale)).items).toHaveLength(1);
      expect((await api.getCaseStudies(locale)).items).toHaveLength(1);
      expect((await api.getSolutions(locale)).items).toHaveLength(1);
      expect((await api.getIndustries(locale)).items).toHaveLength(1);
      expect(await api.getClients(locale)).toHaveLength(1);
      expect(await api.getCareers(locale)).toHaveLength(1);
      expect(await api.getPosts(locale)).toHaveLength(1);
    }
    expect((await api.getClients("ar"))[0].databaseId).not.toBe((await api.getClients("en"))[0].databaseId);
  });

  it("filters case studies by sector client-side (current behaviour)", async () => {
    expect((await api.getCaseStudies("en", "government")).items).toHaveLength(1);
    expect((await api.getCaseStudies("en", "retail")).items).toEqual([]);
    // the query itself carries no sector argument
    expect(last().query).not.toMatch(/industrySectors\s*:/);
    expect(last().variables).toEqual({ first: 50, language: "EN" });
  });

  it("returns hubs and the company profile, with both file size encodings", async () => {
    const hubs = await api.getHubs();
    expect(hubs.caseStudies.heading).toBe("Case studies"); // from the CMS field `hubHeading`
    expect(hubs.solutions.intro).toBe("Four pillars.");
    const profile = await api.getCompanyProfile();
    expect(profile.en.file?.fileSize).toBe(1048576);
    expect(profile.ar.file?.fileSize).toBe(2097152); // numeric string -> number
    expect(profile.ar.label).toBe("العربية");
  });

  it("single Solution has no `image` (SOLUTION_BY_URI does not request featuredImage)", async () => {
    const single = await api.getSolution(uris("en").solution, "en");
    const [listed] = (await api.getSolutions("en")).items;
    expect(single?.image).toBeNull();
    expect(listed.image).not.toBeNull();
  });
});

describe("missing content (verified)", () => {
  it.each([
    ["getService", () => api.getService(uris("en").service, "en")],
    ["getCaseStudy", () => api.getCaseStudy(uris("en").caseStudy, "en")],
    ["getSolution", () => api.getSolution(uris("en").solution, "en")],
    ["getIndustry", () => api.getIndustry(uris("en").industry, "en")],
    ["getPost", () => api.getPost("seasonal-peak")],
  ])("%s resolves null when the CMS has no such entry (empty)", async (_n, call) => {
    stub.setScenario("empty");
    await expect(call()).resolves.toBeNull();
  });

  it("an unknown uri / slug resolves null even when the CMS has content", async () => {
    await expect(api.getService("/services/nope/", "en")).resolves.toBeNull();
    await expect(api.getPost("nope")).resolves.toBeNull();
  });

  it("an /ar-prefixed uri addresses the Arabic entry whatever locale is passed (current behaviour)", async () => {
    const service = await api.getService("/ar/services/contact-centre-outsourcing/", "en");
    expect(service?.uri).toBe("/ar/services/contact-centre-outsourcing/");
    expect(last().variables!.uri).toBe("/ar/services/contact-centre-outsourcing/");
  });

  it("empty lists resolve to empty arrays/items, never throw", async () => {
    stub.setScenario("empty");
    expect(await api.getServices("en")).toEqual({ items: [], nextPage: null });
    expect(await api.getCaseStudies("en")).toEqual({ items: [], nextPage: null });
    expect(await api.getSolutions("en")).toEqual({ items: [], nextPage: null });
    expect(await api.getIndustries("en")).toEqual({ items: [], nextPage: null });
    expect(await api.getClients("en")).toEqual([]);
    expect(await api.getCareers("en")).toEqual([]);
    expect(await api.getPosts("en")).toEqual([]);
  });

  it("empty options pages resolve to empty strings / nulls", async () => {
    stub.setScenario("empty");
    expect(await api.getHubs()).toEqual({
      caseStudies: { heading: "", intro: "", ctaHeading: null, description: null, label: null, url: null },
      industries: { heading: "", intro: "", ctaHeading: null, description: null, label: null, url: null },
      solutions: { heading: "", intro: "" },
    });
    const profile = await api.getCompanyProfile();
    expect(profile).toEqual({
      heading: null,
      intro: null,
      en: { label: null, file: null },
      ar: { label: null, file: null },
    });
  });
});

describe("null and partial ACF (verified)", () => {
  it.each(["null-acf", "partial"])("service with %s groups normalizes to safe empties", async (scenario) => {
    stub.setScenario(scenario);
    const service = await api.getService(uris("en").service, "en");
    expect(service).toMatchObject({
      title: "Contact Centre Outsourcing",
      problemStatement: null,
      image: null,
      expertCta: { label: null, url: null },
      faqCta: { label: null, url: null },
      approachSteps: [],
      capabilities: [],
      proof: {
        results: [],
        relatedCaseStudies: [],
        faqs: [],
        cta: { heading: null, description: null, label: null, url: null },
      },
      pillars: [],
      sectors: [],
    });
  });

  it.each(["null-acf", "partial"])("case study with %s groups normalizes to safe empties", async (scenario) => {
    stub.setScenario(scenario);
    expect(await api.getCaseStudy(uris("en").caseStudy, "en")).toMatchObject({
      featuredResult: null,
      clientName: null,
      heroMetrics: [],
      image: null,
      results: [],
      quote: { text: null, name: null, title: null, organisation: null },
      cta: { heading: null, description: null, label: null, url: null },
      relatedServices: [],
    });
  });

  it.each(["null-acf", "partial"])("solution and industry with %s groups normalize", async (scenario) => {
    stub.setScenario(scenario);
    expect(await api.getSolution(uris("en").solution, "en")).toMatchObject({
      icon: null,
      pillarLabel: null,
      problemStatement: null,
      services: [],
      cta: { label: null, url: null },
    });
    expect(await api.getIndustry(uris("en").industry, "en")).toMatchObject({
      intro: null,
      image: null,
      procurementItems: [],
      sectorServices: [],
      faqs: [],
      ctaBand: { heading: null, description: null },
      proof: { metric: null, point: null },
    });
  });

  it.each(["null-acf", "partial"])("lists tolerate %s content", async (scenario) => {
    stub.setScenario(scenario);
    expect((await api.getServices("en")).items[0]).toMatchObject({ pillars: [], problemStatement: null });
    expect((await api.getCaseStudies("en")).items[0]).toMatchObject({
      featuredResult: null,
      heroMetrics: [],
      image: null,
    });
    expect((await api.getIndustries("en")).items[0]).toMatchObject({ intro: null, image: null });
    expect((await api.getCareers("en"))[0]).toMatchObject({ location: null, discipline: null, jobType: null });
    expect((await api.getClients("en"))[0].logo).toBeNull();
    const [post] = await api.getPosts("en");
    expect(post).toMatchObject({ excerpt: null, image: null, categories: [] });
  });

  it.each(["null-acf", "partial"])("options pages tolerate %s content", async (scenario) => {
    stub.setScenario(scenario);
    expect((await api.getHubs()).caseStudies.heading).toBe("");
    expect((await api.getCompanyProfile()).en.file).toBeNull();
  });

  it("a single post with null body keeps `content: null`", async () => {
    stub.setScenario("partial");
    expect(await api.getPost("seasonal-peak")).toMatchObject({ content: null, excerpt: null });
  });
});

describe("error handling (verified; current behaviour pinned)", () => {
  it("GraphQL errors reject with every message joined", async () => {
    stub.setScenario("graphql-error");
    await expect(api.getServices("en")).rejects.toThrow("WPGraphQL error: stub: simulated GraphQL error");
  });

  it("partial data with errors rejects: errors win and the data is discarded", async () => {
    stub.setScenario("partial-errors");
    await expect(api.getServices("en")).rejects.toThrow(/stub: partial failure/);
  });

  it("HTTP errors reject with the status", async () => {
    stub.setScenario("http-error");
    await expect(api.getClients("en")).rejects.toThrow("WPGraphQL request failed: HTTP 500");
  });

  it("`data: null` rejects", async () => {
    stub.setScenario("no-data");
    await expect(api.getClients("en")).rejects.toThrow("WPGraphQL returned no data");
  });

  it("a truncated JSON body rejects as malformed", async () => {
    stub.setScenario("malformed-json");
    await expect(api.getServices("en")).rejects.toMatchObject({ kind: "malformed" });
  });

  it("a dropped connection rejects as a network failure", async () => {
    stub.setScenario("network-error");
    await expect(api.getServices("en")).rejects.toMatchObject({ kind: "network" });
  });

  it("a valid envelope without the root field rejects (all fetchers: see client-reliability)", async () => {
    stub.setScenario("malformed-shape");
    await expect(api.getServices("en")).rejects.toMatchObject({ kind: "missing-root" });
    await expect(api.getService(uris("en").service, "en")).rejects.toMatchObject({
      kind: "missing-root",
    });
  });

  it("wpFetch sends a live timeout signal on every request", async () => {
    let init: RequestInit | undefined;
    const original = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo | URL, i?: RequestInit) => {
      init = i;
      return original(input, i);
    }) as typeof fetch;
    await wpFetch("query Clients { clients { nodes { id } } }");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.signal?.aborted).toBe(false);
  });

  it("a misconfigured endpoint never reaches the stub", async () => {
    const { vi } = await import("vitest");
    vi.stubEnv("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT", "");
    await expect(api.getClients("en")).rejects.toThrow(WpConfigError);
    expect(stub.requests).toHaveLength(0);
  });
});

describe("server-side fetch options (verified)", () => {
  it("passes Next's data-cache options only when there is no window", async () => {
    let init: (RequestInit & { next?: unknown }) | undefined;
    const original = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo | URL, i?: RequestInit) => {
      init = i;
      return original(input, i);
    }) as typeof fetch;
    await api.getClients("en"); // node env: typeof window === "undefined"
    expect(init).toMatchObject({ cache: "force-cache", next: { revalidate: 300 } });
  });
});
