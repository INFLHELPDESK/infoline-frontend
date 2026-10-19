import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  PRODUCTION_CMS_HOST,
  assertBuildIsIsolated,
  assertIsolatedCmsEnv,
  findProductionHostInBuild,
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
