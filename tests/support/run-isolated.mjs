// Runs a Next.js command with the CMS isolation env forced on, so a test or
// validation build can never pick up a production endpoint from the shell or
// from .env.local (Next never overrides variables that are already set).
//
//   node tests/support/run-isolated.mjs build
//
// The endpoint defaults to the local CMS stub; any other value must be an
// explicit loopback URL with a port, otherwise the command refuses to run.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { LOOPBACK_HOSTS } from "./cms-stub/server.mjs";

const DEFAULT_ENDPOINT = "http://127.0.0.1:3199/graphql";
const endpoint = process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT || DEFAULT_ENDPOINT;

let url;
try {
  url = new URL(endpoint);
} catch {
  url = null;
}
if (!url || !["http:", "https:"].includes(url.protocol) || !LOOPBACK_HOSTS.includes(url.hostname) || !url.port) {
  console.error(
    `run-isolated: refusing to run with NEXT_PUBLIC_WPGRAPHQL_ENDPOINT=${endpoint}; ` +
      "it must be a loopback http(s) URL with an explicit port (the CMS stub).",
  );
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("run-isolated: usage: run-isolated.mjs <next command> [args]");
  process.exit(1);
}

const next = createRequire(import.meta.url).resolve("next/dist/bin/next");
const result = spawnSync(process.execPath, [next, command, ...args], {
  stdio: "inherit",
  env: { ...process.env, CMS_ISOLATED: "1", NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: endpoint },
});
process.exit(result.status ?? 1);
