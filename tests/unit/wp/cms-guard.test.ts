import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  PRODUCTION_CMS_HOST,
  assertBuildIsIsolated,
  assertBuildMatchesEndpoint,
  assertIsolatedCmsEnv,
  buildEmbedsEndpoint,
  findForbiddenCmsTraffic,
  findProductionHostInBuild,
  isProductionCmsHost,
} from "../../support/cms-guard";

const STUB = "http://127.0.0.1:3199/graphql";

describe("assertIsolatedCmsEnv", () => {
  it.each([STUB, "http://localhost:3199/graphql"])("accepts the loopback stub %s", (endpoint) => {
    expect(() =>
      assertIsolatedCmsEnv({ CMS_ISOLATED: "1", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: endpoint }),
    ).not.toThrow();
  });

  it.each([
    ["empty env", {}],
    ["missing isolation flag", { NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: STUB }],
    ["missing endpoint", { CMS_ISOLATED: "1" }],
    ["invalid endpoint", { CMS_ISOLATED: "1", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "nope" }],
    [
      "production endpoint",
      { CMS_ISOLATED: "1", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: `https://${PRODUCTION_CMS_HOST}/graphql` },
    ],
    [
      "any non-loopback host",
      { CMS_ISOLATED: "1", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "https://cms.example.com/graphql" },
    ],
    [
      "loopback without a port",
      { CMS_ISOLATED: "1", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "http://127.0.0.1/graphql" },
    ],
    [
      "a non-http protocol",
      { CMS_ISOLATED: "1", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "ftp://127.0.0.1:3199/graphql" },
    ],
    [
      "a look-alike loopback host",
      { CMS_ISOLATED: "1", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "http://127.0.0.1.example.com:3199/graphql" },
    ],
    [
      "userinfo that hides the real host",
      { CMS_ISOLATED: "1", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "http://127.0.0.1:3199@cms.example.com/graphql" },
    ],
    [
      "isolation flag other than 1",
      { CMS_ISOLATED: "true", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: STUB },
    ],
  ])("refuses %s", (_name, env) => {
    expect(() => assertIsolatedCmsEnv(env)).toThrow(/Refusing/);
  });
});

describe("build isolation scan", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  function fakeBuild(files: Record<string, string>) {
    const dir = mkdtempSync(join(tmpdir(), "build-"));
    dirs.push(dir);
    for (const [rel, content] of Object.entries(files)) {
      const path = join(dir, rel);
      mkdirSync(join(path, ".."), { recursive: true });
      writeFileSync(path, content);
    }
    return dir;
  }

  it("passes a build that only mentions the stub", () => {
    const dir = fakeBuild({ "static/chunks/a.js": 'fetch("http://127.0.0.1:3199/graphql")' });
    expect(findProductionHostInBuild(dir)).toEqual([]);
    expect(() => assertBuildIsIsolated(dir)).not.toThrow();
  });

  it("flags the production host in client and server code", () => {
    const dir = fakeBuild({
      "static/chunks/a.js": `fetch("https://${PRODUCTION_CMS_HOST}/graphql")`,
      "server/chunks/b.js": `x="https://${PRODUCTION_CMS_HOST}"`,
    });
    expect(findProductionHostInBuild(dir)).toHaveLength(2);
    expect(() => assertBuildIsIsolated(dir)).toThrow(/production CMS host/);
  });

  it("ignores source maps and a missing build directory", () => {
    const dir = fakeBuild({ "server/chunks/b.js.map": `"${PRODUCTION_CMS_HOST}"` });
    expect(findProductionHostInBuild(dir)).toEqual([]);
    expect(findProductionHostInBuild(join(dir, "does-not-exist"))).toEqual([]);
  });
});

describe("build/endpoint match", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });
  function build(content: string) {
    const dir = mkdtempSync(join(tmpdir(), "build-"));
    dirs.push(dir);
    mkdirSync(join(dir, "static"), { recursive: true });
    writeFileSync(join(dir, "static", "a.js"), content);
    return dir;
  }

  it("passes when the build embeds the configured endpoint", () => {
    const dir = build(`fetch("${STUB}")`);
    expect(buildEmbedsEndpoint(STUB, dir)).toBe(true);
    expect(() => assertBuildMatchesEndpoint(STUB, dir)).not.toThrow();
  });

  it("refuses a build made with a different endpoint, or none", () => {
    const other = build('fetch("http://127.0.0.1:4000/graphql")');
    expect(() => assertBuildMatchesEndpoint(STUB, other)).toThrow(/does not embed/);
    expect(() => assertBuildMatchesEndpoint(STUB, join(other, "missing"))).toThrow(/does not embed/);
    expect(() => assertBuildMatchesEndpoint(undefined, other)).toThrow(/does not embed/);
  });
});

describe("production host matching (regressions)", () => {
  it.each([
    PRODUCTION_CMS_HOST,
    `${PRODUCTION_CMS_HOST}.`,
    `${PRODUCTION_CMS_HOST}..`,
    PRODUCTION_CMS_HOST.toUpperCase(),
    `www.${PRODUCTION_CMS_HOST}`,
  ])("isProductionCmsHost(%s)", (host) => {
    expect(isProductionCmsHost(host)).toBe(true);
  });

  it.each(["127.0.0.1", "localhost", `x${PRODUCTION_CMS_HOST}`, ""])("not production: %j", (host) => {
    expect(isProductionCmsHost(host)).toBe(false);
  });

  it("flags trailing-dot and subdomain production requests from the browser", () => {
    expect(
      findForbiddenCmsTraffic([
        `https://${PRODUCTION_CMS_HOST}./anything`,
        `https://www.${PRODUCTION_CMS_HOST}/anything`,
      ]),
    ).toHaveLength(2);
  });

  it("the build scan finds the host in every spelling (substring match)", () => {
    const dir = mkdtempSync(join(tmpdir(), "build-"));
    try {
      mkdirSync(join(dir, "static"), { recursive: true });
      writeFileSync(join(dir, "static", "a.js"), `fetch("https://${PRODUCTION_CMS_HOST}./graphql")`);
      expect(findProductionHostInBuild(dir)).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("findForbiddenCmsTraffic", () => {
  it("flags production-host, GraphQL and wp-json requests", () => {
    expect(
      findForbiddenCmsTraffic([
        `https://${PRODUCTION_CMS_HOST}/anything`,
        "http://127.0.0.1:3199/graphql",
        "https://other.example/wp-json/infoline/v1/apply",
      ]),
    ).toHaveLength(3);
  });

  it("ignores unrelated third-party traffic and unparsable urls", () => {
    expect(
      findForbiddenCmsTraffic(["https://challenges.cloudflare.com/turnstile/v0/api.js", "not a url"]),
    ).toEqual([]);
  });
});
