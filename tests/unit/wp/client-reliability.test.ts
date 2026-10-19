import { describe, expect, it, vi } from "vitest";
import * as api from "@/lib/wp/api";
import {
  WP_TIMEOUT_MS,
  WpRequestError,
  isWpRequestError,
  wpFetch,
  wpNodes,
  type WpFailureKind,
} from "@/lib/wp/client";
import { uris } from "../../support/cms-stub/fixtures.mjs";
import { startCmsStub } from "../../support/cms-stub/harness";

/**
 * Client reliability: every failure mode is a distinct, typed rejection and is
 * never mistaken for valid empty CMS content. Real HTTP against the local stub
 * (inline-fetch cases below use a stubbed fetch for hand-built envelopes).
 */

const stub = startCmsStub();

const kindOf = async (call: () => Promise<unknown>): Promise<WpFailureKind | "resolved"> => {
  try {
    await call();
    return "resolved";
  } catch (error) {
    if (!isWpRequestError(error)) throw error;
    return error.kind;
  }
};

const FETCHERS = [
  ["getService", () => api.getService(uris("en").service, "en")],
  ["getServices", () => api.getServices("en")],
  ["getCaseStudy", () => api.getCaseStudy(uris("en").caseStudy, "en")],
  ["getCaseStudies", () => api.getCaseStudies("en")],
  ["getSolution", () => api.getSolution(uris("en").solution, "en")],
  ["getSolutions", () => api.getSolutions("en")],
  ["getIndustry", () => api.getIndustry(uris("en").industry, "en")],
  ["getIndustries", () => api.getIndustries("en")],
  ["getClients", () => api.getClients("en")],
  ["getHubs", () => api.getHubs()],
  ["getCareers", () => api.getCareers("en")],
  ["getPosts", () => api.getPosts("en")],
  ["getPost", () => api.getPost("seasonal-peak")],
  ["getCompanyProfile", () => api.getCompanyProfile()],
] as const;

describe("failure kinds, for every fetcher", () => {
  it.each([
    ["http-error", "http"],
    ["graphql-error", "graphql"],
    ["partial-errors", "graphql"],
    ["no-data", "malformed"],
    ["malformed-json", "malformed"],
    ["malformed-shape", "missing-root"],
    ["network-error", "network"],
  ] as const)("scenario %s rejects as %s", async (scenario, kind) => {
    for (const [name, call] of FETCHERS) {
      stub.setScenario(scenario);
      expect(await kindOf(call), `${name} under ${scenario}`).toBe(kind);
    }
  });

  it("carries the HTTP status and the underlying cause", async () => {
    stub.setScenario("http-error");
    await expect(api.getClients("en")).rejects.toMatchObject({ status: 500 });
    stub.setScenario("malformed-json");
    await expect(api.getClients("en")).rejects.toHaveProperty("cause", expect.any(SyntaxError));
  });
});

describe("valid empty content is not an error", () => {
  it("the empty scenario resolves for every fetcher", async () => {
    stub.setScenario("empty");
    for (const [name, call] of FETCHERS) {
      expect(await kindOf(call), name).toBe("resolved");
    }
  });

  it.each(["empty", "null-acf", "partial"])(
    "%s: an unknown single lookup resolves null, never rejects",
    async (scenario) => {
      stub.setScenario(scenario);
      await expect(api.getPost("nope")).resolves.toBeNull();
      await expect(api.getService("/services/nope/", "en")).resolves.toBeNull();
    },
  );
});

describe("required response structure", () => {
  const respondWith = (data: unknown) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data }))));

  it("a null single-lookup root is 'not found' (valid); an absent one is not", async () => {
    respondWith({ service: null });
    await expect(api.getService("/x/", "en")).resolves.toBeNull();
    respondWith({});
    await expect(api.getService("/x/", "en")).rejects.toMatchObject({ kind: "missing-root" });
  });

  it("a list root that is null or has no nodes array is malformed, not empty", async () => {
    respondWith({ services: null });
    await expect(api.getServices("en")).rejects.toMatchObject({ kind: "malformed" });
    respondWith({ services: {} });
    await expect(api.getServices("en")).rejects.toMatchObject({ kind: "malformed" });
    respondWith({ clients: { nodes: null } });
    await expect(api.getClients("en")).rejects.toMatchObject({ kind: "malformed" });
    respondWith({ clients: { nodes: [] } });
    await expect(api.getClients("en")).resolves.toEqual([]);
  });

  it("getServices tolerates a missing pageInfo (no next page)", async () => {
    respondWith({ services: { nodes: [] } });
    await expect(api.getServices("en")).resolves.toEqual({ items: [], nextPage: null });
  });

  it("options pages: null roots are unset settings (valid); any absent root is not", async () => {
    respondWith({ caseStudiesSettings: null, industriesHubSettings: null, solutionsSettings: null });
    await expect(api.getHubs()).resolves.toMatchObject({ caseStudies: { heading: "" } });
    respondWith({ caseStudiesSettings: null, industriesHubSettings: null });
    await expect(api.getHubs()).rejects.toMatchObject({ kind: "missing-root" });
    respondWith({ aboutSettings: null });
    await expect(api.getCompanyProfile()).resolves.toMatchObject({ heading: null });
    respondWith({ somethingElse: {} });
    await expect(api.getCompanyProfile()).rejects.toMatchObject({ kind: "missing-root" });
  });

  it.each([
    ["an array", "[]"],
    ["a string", '"ok"'],
    ["null", "null"],
  ])("a response body that is %s is malformed", async (_name, body) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body)));
    await expect(wpFetch("query { a }")).rejects.toMatchObject({ kind: "malformed" });
  });

  it("non-object data is malformed", async () => {
    respondWith("nope");
    await expect(wpFetch("query { a }")).rejects.toMatchObject({ kind: "malformed" });
  });

  it("an `errors` entry without a message still rejects as graphql", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ errors: [null, {}] }))),
    );
    await expect(wpFetch("query { a }")).rejects.toMatchObject({ kind: "graphql" });
  });

  it("wpNodes returns the array or throws malformed naming the root", () => {
    expect(wpNodes({ nodes: [1] }, "r")).toEqual([1]);
    expect(() => wpNodes(undefined, "r")).toThrow(/"r"/);
    expect(() => wpNodes(undefined, "r")).toThrow(WpRequestError);
  });
});

describe("timeout and cancellation", () => {
  it("has a bounded default timeout", () => {
    expect(WP_TIMEOUT_MS).toBeGreaterThan(0);
    expect(WP_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });

  it("applies WP_TIMEOUT_MS by default and an explicit timeoutMs when given", async () => {
    const spy = vi.spyOn(AbortSignal, "timeout");
    await api.getClients("en");
    expect(spy).toHaveBeenLastCalledWith(WP_TIMEOUT_MS);
    await wpFetch("query Clients { clients { nodes { id } } }", {}, undefined, { timeoutMs: 1234 });
    expect(spy).toHaveBeenLastCalledWith(1234);
  });

  it("a CMS that never answers rejects as a timeout, without retrying", async () => {
    stub.setScenario("hang");
    const started = Date.now();
    await expect(
      wpFetch("query Services { a }", {}, undefined, { timeoutMs: 100 }),
    ).rejects.toMatchObject({ kind: "timeout", message: expect.stringContaining("100ms") });
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(stub.graphqlRequests()).toHaveLength(1);
  });

  it("headers followed by a stalled body also time out", async () => {
    stub.setScenario("stalled-body");
    await expect(
      wpFetch("query Services { a }", {}, undefined, { timeoutMs: 100 }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });

  it("a fast response is unaffected by the timeout", async () => {
    await expect(api.getClients("en")).resolves.toHaveLength(1);
  });

  it("caller cancellation rejects with the caller's reason, not a WpRequestError", async () => {
    stub.setScenario("hang");
    const controller = new AbortController();
    const settled = wpFetch("query Services { a }", {}, undefined, {
      signal: controller.signal,
    }).then(
      () => "resolved",
      (error: unknown) => error,
    );
    await vi.waitFor(() => expect(stub.graphqlRequests()).toHaveLength(1));
    const reason = new Error("navigated away");
    controller.abort(reason);
    const error = await settled;
    expect(error).toBe(reason);
    expect(isWpRequestError(error)).toBe(false);
  });

  it("an already-aborted signal rejects as a cancellation, not a CMS failure", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await wpFetch("query Clients { a }", {}, undefined, {
      signal: controller.signal,
    }).catch((e: unknown) => e);
    expect(isWpRequestError(error)).toBe(false);
    expect((error as Error).name).toBe("AbortError");
  });

  it("the timeout still applies when a caller signal is supplied but never fires", async () => {
    stub.setScenario("hang");
    const controller = new AbortController();
    await expect(
      wpFetch("query Services { a }", {}, undefined, { timeoutMs: 50, signal: controller.signal }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });
});

describe("EN/AR", () => {
  it.each(["en", "ar"] as const)("%s: failures are typed and empties resolve", async (locale) => {
    stub.setScenario("http-error");
    await expect(api.getServices(locale)).rejects.toMatchObject({ kind: "http", status: 500 });
    stub.setScenario("malformed-shape");
    await expect(api.getCareers(locale)).rejects.toMatchObject({ kind: "missing-root" });
    stub.setScenario("empty");
    await expect(api.getCareers(locale)).resolves.toEqual([]);
    expect(stub.graphqlRequests().at(-1)?.variables).toMatchObject({
      language: locale === "ar" ? "AR" : "EN",
    });
  });
});
