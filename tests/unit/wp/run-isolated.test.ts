import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/** The runner must refuse before it ever launches `next`, so these are cheap. */
function run(endpoint: string | undefined, args: string[] = ["build"]) {
  const env = { ...process.env, NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: endpoint };
  if (endpoint === undefined) delete env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT;
  return spawnSync(process.execPath, ["tests/support/run-isolated.mjs", ...args], {
    env,
    encoding: "utf8",
  });
}

describe("run-isolated.mjs refuses unsafe endpoints", () => {
  it.each([
    ["production", "https://green-tarsier-764009.hostingersite.com/graphql"],
    ["loopback without a port", "http://127.0.0.1/graphql"],
    ["a non-loopback host", "http://cms.example.com:3199/graphql"],
    ["a non-http protocol", "ftp://127.0.0.1:3199/graphql"],
    ["an invalid url", "not a url"],
  ])("%s", (_name, endpoint) => {
    const result = run(endpoint);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/refusing to run/);
  });

  it("requires a command when the endpoint is acceptable (default stub endpoint)", () => {
    const result = run(undefined, []);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/usage/);
  });
});
