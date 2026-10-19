import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SCENARIOS,
  SCENARIO_HEADER,
  createCmsStub,
  isLoopbackAddress,
  parseOperation,
} from "../../support/cms-stub/server.mjs";
import { loopbackOnlyFetch, startCmsStub } from "../../support/cms-stub/harness";

const stub = startCmsStub();

async function gql(
  query: string,
  variables: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) {
  const res = await fetch(stub.url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
  });
  return { res, json: await res.json().catch(() => undefined) };
}

const SERVICES = "query Services($language: LanguageCodeFilterEnum) { services { nodes { title } } }";

describe("cms-stub: isolation", () => {
  it("refuses to listen on a non-loopback host", async () => {
    await expect(createCmsStub({ host: "0.0.0.0" })).rejects.toThrow(/non-loopback/);
    await expect(createCmsStub({ host: "green-tarsier-764009.hostingersite.com" })).rejects.toThrow(
      /non-loopback/,
    );
  });

  it("binds a loopback address only", () => {
    expect(new URL(stub.url).hostname).toBe("127.0.0.1");
  });

  it.each([
    ["127.0.0.1", true],
    ["::1", true],
    ["::ffff:127.0.0.1", true],
    ["192.168.1.5", false],
    ["10.0.0.2", false],
    ["", false],
  ])("isLoopbackAddress(%s) = %s", (address, expected) => {
    expect(isLoopbackAddress(address)).toBe(expected);
  });

  it("test fetch refuses any origin other than the stub", async () => {
    const guarded = loopbackOnlyFetch(stub.origin);
    await expect(guarded("https://green-tarsier-764009.hostingersite.com/graphql")).rejects.toThrow(
      /only reach the CMS stub/,
    );
    await expect(guarded("http://127.0.0.1:1/graphql")).rejects.toThrow(/only reach the CMS stub/);
  });
});

describe("cms-stub: protocol", () => {
  it("parses the operation name and type", () => {
    expect(parseOperation("query Foo($a: Int) { x }")).toEqual({ type: "query", name: "Foo" });
    expect(parseOperation("  mutation M { x }")).toEqual({ type: "mutation", name: "M" });
    expect(parseOperation("{ x }")).toEqual({ type: null, name: null });
  });

  it("serves fixtures by operation and language", async () => {
    const en = await gql(SERVICES, { language: "EN" });
    const ar = await gql(SERVICES, { language: "AR" });
    expect(en.json.data.services.nodes[0].title).toBe("Contact Centre Outsourcing");
    expect(ar.json.data.services.nodes[0].title).toMatch(/[؀-ۿ]/);
  });

  it("answers CORS preflight for browser callers", async () => {
    const res = await fetch(stub.url, { method: "OPTIONS" });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("reports an operation without a fixture as a GraphQL error and records it", async () => {
    const { json } = await gql("query Mystery { nope }");
    expect(json.errors[0].message).toMatch(/no fixture for operation "Mystery"/);
    expect(stub.requests.at(-1)?.kind).toBe("unhandled-operation");
  });

  it("never lets a mutation succeed (forms stay mocked)", async () => {
    const { json } = await gql(
      "mutation SubmitInquiry($input: SubmitInquiryInput!) { submitInquiry(input: $input) { success } }",
      { input: { action: "service_inquiry" } },
    );
    expect(json.data).toBeUndefined();
    expect(json.errors[0].message).toMatch(/mutation "SubmitInquiry" is not supported/);
    expect(stub.requests.at(-1)?.kind).toBe("mutation-rejected");
  });

  it("rejects a non-JSON body and unknown paths, and records both", async () => {
    const bad = await fetch(stub.url, { method: "POST", body: "not json" });
    expect(bad.status).toBe(400);
    const other = await fetch(`${stub.origin}/wp-json/infoline/v1/apply`, { method: "POST" });
    expect(other.status).toBe(404);
    expect(stub.requests.map((r: { kind: string }) => r.kind)).toEqual(["bad-request", "unexpected"]);
  });

  it("serves a media pixel for fixture image URLs", async () => {
    const res = await fetch(`${stub.origin}/stub-media/service.jpg`);
    expect(res.headers.get("content-type")).toBe("image/gif");
  });
});

describe("cms-stub: scenarios", () => {
  it("lists every scenario once", () => {
    expect(new Set(SCENARIOS).size).toBe(SCENARIOS.length);
  });

  it("graphql-error answers HTTP 200 with errors and null data", async () => {
    stub.setScenario("graphql-error");
    const { res, json } = await gql(SERVICES, { language: "EN" });
    expect(res.status).toBe(200);
    expect(json).toEqual({ errors: [{ message: "stub: simulated GraphQL error" }], data: null });
  });

  it("no-data answers { data: null }", async () => {
    stub.setScenario("no-data");
    expect((await gql(SERVICES)).json).toEqual({ data: null });
  });

  it("malformed-shape is a valid envelope without the requested root fields", async () => {
    stub.setScenario("malformed-shape");
    expect((await gql(SERVICES)).json).toEqual({ data: {} });
  });

  it("partial-errors returns data together with errors", async () => {
    stub.setScenario("partial-errors");
    const { json } = await gql(SERVICES, { language: "EN" });
    expect(json.errors).toHaveLength(1);
    expect(json.data.services.nodes).toHaveLength(1);
  });

  it("http-error answers 500", async () => {
    stub.setScenario("http-error");
    expect((await gql(SERVICES)).res.status).toBe(500);
  });

  it("malformed-json returns a truncated body that does not parse", async () => {
    stub.setScenario("malformed-json");
    const res = await fetch(stub.url, { method: "POST", body: JSON.stringify({ query: SERVICES }) });
    expect(res.status).toBe(200);
    await expect(res.json()).rejects.toThrow();
  });

  it("network-error drops the connection", async () => {
    stub.setScenario("network-error");
    await expect(gql(SERVICES)).rejects.toThrow();
    expect(stub.graphqlRequests()).toHaveLength(1);
  });

  it("empty returns no nodes", async () => {
    stub.setScenario("empty");
    expect((await gql(SERVICES, { language: "EN" })).json.data.services.nodes).toEqual([]);
  });

  it("a per-request header overrides the global scenario", async () => {
    stub.setScenario("empty");
    const { json } = await gql(SERVICES, { language: "EN" }, { [SCENARIO_HEADER]: "ok" });
    expect(json.data.services.nodes).toHaveLength(1);
    expect(stub.graphqlRequests().at(-1)?.scenario).toBe("ok");
  });

  it("ignores an unknown scenario header and rejects an unknown scenario", async () => {
    const { json } = await gql(SERVICES, { language: "EN" }, { [SCENARIO_HEADER]: "bogus" });
    expect(json.data.services.nodes).toHaveLength(1);
    expect(() => stub.setScenario("bogus")).toThrow(/unknown scenario/);
  });

  it("control endpoints expose, switch and reset state over HTTP", async () => {
    await gql(SERVICES, { language: "EN" });
    const log = await (await fetch(`${stub.origin}/__requests`)).json();
    expect(log).toHaveLength(1);

    const set = await fetch(`${stub.origin}/__scenario`, {
      method: "POST",
      body: JSON.stringify({ scenario: "empty" }),
    });
    expect((await set.json()).scenario).toBe("empty");
    const invalid = await fetch(`${stub.origin}/__scenario`, {
      method: "POST",
      body: JSON.stringify({ scenario: "nope" }),
    });
    expect(invalid.status).toBe(400);

    await fetch(`${stub.origin}/__reset`, { method: "POST" });
    expect(stub.requests).toHaveLength(0);
    expect(stub.scenario).toBe("ok");
  });

  it("control endpoints are not CMS traffic in the file log", async () => {
    const dir = mkdtempSync(join(tmpdir(), "stub-log-"));
    const logFile = join(dir, "log");
    const local = await createCmsStub({ logFile });
    const localFetch = loopbackOnlyFetch(local.origin);
    try {
      await localFetch(`${local.origin}/__health`);
      await localFetch(`${local.origin}/__requests`);
      expect(readFileSync(logFile, "utf8")).toBe("");
      await localFetch(`${local.origin}/graphql`, {
        method: "POST",
        body: JSON.stringify({ query: SERVICES }),
      });
      expect(readFileSync(logFile, "utf8")).toBe("POST /graphql\n");
    } finally {
      await local.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
