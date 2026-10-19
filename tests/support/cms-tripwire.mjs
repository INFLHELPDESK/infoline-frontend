// Loopback listener standing in for the CMS during E2E runs. It answers every
// request with 503 and records it, so any server-side (or browser-side) CMS
// fetch is observable. `global-teardown.ts` fails the run if a hit was logged.
// Replaced by the real CMS stub when the first page is wired to WordPress.
import { createServer } from "node:http";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const endpoint = new URL(process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT ?? "");
const logFile = process.env.CMS_TRIPWIRE_LOG;
if (!["127.0.0.1", "localhost", "[::1]"].includes(endpoint.hostname) || !logFile) {
  console.error("cms-tripwire: loopback endpoint and CMS_TRIPWIRE_LOG are required");
  process.exit(1);
}

mkdirSync(dirname(logFile), { recursive: true });
writeFileSync(logFile, "");

createServer((req, res) => {
  if (req.url === "/__health") {
    res.end("ok");
    return;
  }
  appendFileSync(logFile, `${req.method} ${req.url}\n`);
  res.statusCode = 503;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ errors: [{ message: "CMS tripwire: unexpected request" }] }));
}).listen(Number(endpoint.port), endpoint.hostname);
