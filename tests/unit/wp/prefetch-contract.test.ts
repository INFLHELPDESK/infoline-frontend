import { QueryClient, dehydrate } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { wpKeys } from "@/lib/wp/keys";
import * as server from "@/lib/wp/server";
import { uris } from "../../support/cms-stub/fixtures.mjs";
import { startCmsStub } from "../../support/cms-stub/harness";

/**
 * Prefetch error contract (documented in lib/wp/server.ts): valid content,
 * including "not found" and empty, resolves; any failure rejects with a typed
 * WpRequestError; nothing is swallowed and a failed query is never dehydrated.
 */

const stub = startCmsStub();

type Locale = "en" | "ar";
const PREFETCHERS: [string, (qc: QueryClient, l: Locale) => Promise<unknown>][] = [
  ["prefetchService", (qc, l) => server.prefetchService(qc, uris("en").service, l)],
  ["prefetchServices", (qc, l) => server.prefetchServices(qc, l)],
  ["prefetchCaseStudy", (qc, l) => server.prefetchCaseStudy(qc, uris("en").caseStudy, l)],
  ["prefetchCaseStudies", (qc, l) => server.prefetchCaseStudies(qc, l)],
  ["prefetchSolution", (qc, l) => server.prefetchSolution(qc, uris("en").solution, l)],
  ["prefetchSolutions", (qc, l) => server.prefetchSolutions(qc, l)],
  ["prefetchIndustry", (qc, l) => server.prefetchIndustry(qc, uris("en").industry, l)],
  ["prefetchIndustries", (qc, l) => server.prefetchIndustries(qc, l)],
  ["prefetchClients", (qc, l) => server.prefetchClients(qc, l)],
  ["prefetchHubs", (qc, l) => server.prefetchHubs(qc, l)],
  ["prefetchCareers", (qc, l) => server.prefetchCareers(qc, l)],
  ["prefetchPosts", (qc, l) => server.prefetchPosts(qc, l)],
  ["prefetchPost", (qc, l) => server.prefetchPost(qc, "seasonal-peak", l)],
  ["prefetchCompanyProfile", (qc, l) => server.prefetchCompanyProfile(qc, l)],
];

describe.each(["en", "ar"] as const)("prefetch contract (%s)", (locale) => {
  it.each(PREFETCHERS)("%s rejects with the typed error for each failure kind", async (name, run) => {
    for (const [scenario, kind] of [
      ["http-error", "http"],
      ["graphql-error", "graphql"],
      ["malformed-json", "malformed"],
      ["malformed-shape", "missing-root"],
      ["network-error", "network"],
    ] as const) {
      stub.setScenario(scenario);
      const qc = new QueryClient();
      await expect(run(qc, locale), `${name} under ${scenario}`).rejects.toMatchObject({
        name: "WpRequestError",
        kind,
      });
      expect(dehydrate(qc).queries, `${name} dehydrated a failed query`).toEqual([]);
    }
  });

  it.each(PREFETCHERS)("%s resolves for valid empty content", async (name, run) => {
    stub.setScenario("empty");
    await expect(run(new QueryClient(), locale), name).resolves.not.toThrow();
  });

  it("a not-found lookup resolves null and is cached under its key", async () => {
    stub.setScenario("empty");
    const qc = new QueryClient();
    await expect(server.prefetchPost(qc, "nope", locale)).resolves.toBeNull();
    expect(qc.getQueryData(wpKeys.post("nope", locale))).toBeNull();
  });

  it("a successful prefetch is dehydrated under the documented key", async () => {
    const qc = new QueryClient();
    await server.prefetchServices(qc, locale);
    expect(dehydrate(qc).queries.map((q) => q.queryKey)).toEqual([wpKeys.services(locale)]);
  });
});

describe("prefetch failure semantics", () => {
  it("does not retry, so a failure costs exactly one request", async () => {
    stub.setScenario("http-error");
    await expect(server.prefetchServices(new QueryClient(), "en")).rejects.toThrow();
    expect(stub.graphqlRequests()).toHaveLength(1);
  });

  it("a failure is not cached as data: the same client succeeds once the CMS recovers", async () => {
    const qc = new QueryClient();
    stub.setScenario("graphql-error");
    await expect(server.prefetchClients(qc, "en")).rejects.toThrow();
    expect(qc.getQueryData(wpKeys.clients("en"))).toBeUndefined();
    stub.setScenario("ok");
    await expect(server.prefetchClients(qc, "en")).resolves.toHaveLength(1);
  });

  it("the caller can tell a rejection from empty content", async () => {
    const outcome = async (scenario: string) => {
      stub.setScenario(scenario);
      try {
        return { ok: true as const, value: await server.prefetchCareers(new QueryClient(), "en") };
      } catch (error) {
        return { ok: false as const, error };
      }
    };
    expect(await outcome("empty")).toEqual({ ok: true, value: [] });
    expect(await outcome("http-error")).toMatchObject({ ok: false });
  });
});
