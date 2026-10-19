import { afterEach, describe, expect, it, vi } from "vitest";

type ClientModule = typeof import("@/lib/wp/client");

const STUB = "http://127.0.0.1:3199/graphql";
const PROD = "https://green-tarsier-764009.hostingersite.com/graphql";

/** Env is read on every call, but reset modules to keep tests independent. */
async function load(env: Record<string, string | undefined>): Promise<ClientModule> {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("@/lib/wp/client");
}

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() => impl());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getWpEndpoint", () => {
  it("fails closed when the endpoint is not configured (no production default)", async () => {
    const { getWpEndpoint, WpConfigError } = await load({
      NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: undefined,
    });
    expect(() => getWpEndpoint()).toThrow(WpConfigError);
  });

  it("rejects an invalid URL", async () => {
    const { getWpEndpoint } = await load({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "not a url" });
    expect(() => getWpEndpoint()).toThrow(/valid URL/);
  });

  it("returns the configured endpoint", async () => {
    const { getWpEndpoint } = await load({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: STUB });
    expect(getWpEndpoint()).toBe(STUB);
  });

  it("refuses the production host when CMS_ISOLATED=1", async () => {
    const { getWpEndpoint } = await load({
      NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: PROD,
      CMS_ISOLATED: "1",
    });
    expect(() => getWpEndpoint()).toThrow(/production CMS/);
  });

  it("allows the production host when not isolated (explicit configuration)", async () => {
    const { getWpEndpoint } = await load({
      NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: PROD,
      CMS_ISOLATED: undefined,
    });
    expect(getWpEndpoint()).toBe(PROD);
  });
});

describe("getWpEndpoint isolation (regressions)", () => {
  const PROD_HOST = "green-tarsier-764009.hostingersite.com";

  it.each([
    ["trailing dot", `https://${PROD_HOST}./graphql`],
    ["repeated trailing dots", `https://${PROD_HOST}../graphql`],
    ["upper case", `https://${PROD_HOST.toUpperCase()}/graphql`],
    ["explicit port", `https://${PROD_HOST}:443/graphql`],
    ["userinfo", `https://user@${PROD_HOST}/graphql`],
    ["a subdomain", `https://www.${PROD_HOST}/graphql`],
    ["percent-encoded host", "https://%67reen-tarsier-764009.hostingersite.com/graphql"],
  ])("refuses the production host as %s when isolated", async (_name, endpoint) => {
    const { getWpEndpoint } = await load({
      NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: endpoint,
      CMS_ISOLATED: "1",
    });
    expect(() => getWpEndpoint()).toThrow(/production CMS/);
  });

  it.each([
    "https://cms.example.com/graphql",
    "http://10.0.0.5:3199/graphql",
    "http://127.0.0.1.example.com:3199/graphql",
    "http://localhost./graphql",
  ])("refuses any non-loopback endpoint (%s) when isolated", async (endpoint) => {
    const { getWpEndpoint } = await load({
      NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: endpoint,
      CMS_ISOLATED: "1",
    });
    expect(() => getWpEndpoint()).toThrow(/loopback/);
  });

  it.each(["http://127.0.0.1:3199/graphql", "http://localhost:3199/graphql", "http://[::1]:3199/graphql"])(
    "accepts the loopback stub %s when isolated",
    async (endpoint) => {
      const { getWpEndpoint } = await load({
        NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: endpoint,
        CMS_ISOLATED: "1",
      });
      expect(getWpEndpoint()).toBe(endpoint);
    },
  );

  it("never fetches under a trailing-dot production endpoint when isolated", async () => {
    const fetchMock = stubFetch(async () => new Response("{}"));
    const { wpFetch } = await load({
      NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: `https://${PROD_HOST}./graphql`,
      CMS_ISOLATED: "1",
    });
    await expect(wpFetch("query { a }")).rejects.toThrow(/production CMS/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not change non-isolated behavior: any configured endpoint is returned", async () => {
    const { getWpEndpoint } = await load({
      NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "https://cms.example.com/graphql",
      CMS_ISOLATED: undefined,
    });
    expect(getWpEndpoint()).toBe("https://cms.example.com/graphql");
  });

  it("isProductionCmsHost matches only the production host family", async () => {
    const { isProductionCmsHost } = await load({});
    expect(isProductionCmsHost(PROD_HOST)).toBe(true);
    expect(isProductionCmsHost(`${PROD_HOST}.`)).toBe(true);
    expect(isProductionCmsHost(`x.${PROD_HOST}`)).toBe(true);
    expect(isProductionCmsHost(`not${PROD_HOST}`)).toBe(false);
    expect(isProductionCmsHost("127.0.0.1")).toBe(false);
    expect(isProductionCmsHost("")).toBe(false);
  });
});

describe("wpFetch", () => {
  it("never issues a request when the endpoint is unconfigured", async () => {
    const fetchMock = stubFetch(async () => new Response("{}"));
    const { wpFetch } = await load({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: undefined });
    await expect(wpFetch("query { a }")).rejects.toThrow(/not set/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never issues a request to production when isolated", async () => {
    const fetchMock = stubFetch(async () => new Response("{}"));
    const { wpFetch } = await load({
      NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: PROD,
      CMS_ISOLATED: "1",
    });
    await expect(wpFetch("query { a }")).rejects.toThrow(/production CMS/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs to the configured endpoint and returns data", async () => {
    const fetchMock = stubFetch(
      async () => new Response(JSON.stringify({ data: { ok: true } })),
    );
    const { wpFetch } = await load({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: STUB });
    await expect(wpFetch("query { ok }")).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe(STUB);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
  });

  it.each([
    ["HTTP failure", () => new Response("no", { status: 500 }), /HTTP 500/],
    [
      "GraphQL errors",
      () => new Response(JSON.stringify({ errors: [{ message: "boom" }] })),
      /boom/,
    ],
    ["missing data", () => new Response(JSON.stringify({})), /no data/],
  ])("throws on %s", async (_name, response, pattern) => {
    stubFetch(async () => response());
    const { wpFetch } = await load({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: STUB });
    await expect(wpFetch("query { x }")).rejects.toThrow(pattern);
  });
});
