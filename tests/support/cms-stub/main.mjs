// Process entry for Playwright's webServer: the CMS stub on the loopback port
// from NEXT_PUBLIC_WPGRAPHQL_ENDPOINT. It replaces the earlier 503 tripwire.
//
// No public page is wired to WordPress yet, so *any* request that reaches this
// process is unexpected. Every non-control request is appended to
// CMS_TRIPWIRE_LOG and `tests/support/global-teardown.ts` fails the run if the
// log is not empty — the stub keeps the tripwire's guarantee while also being
// able to serve fixtures to the slice that wires the first page.
import { createCmsStub, LOOPBACK_HOSTS } from "./server.mjs";

const endpoint = new URL(process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT ?? "");
const logFile = process.env.CMS_TRIPWIRE_LOG;
if (!LOOPBACK_HOSTS.includes(endpoint.hostname) || !endpoint.port || !logFile) {
  console.error("cms-stub: a loopback endpoint with an explicit port and CMS_TRIPWIRE_LOG are required");
  process.exit(1);
}

await createCmsStub({
  host: endpoint.hostname,
  port: Number(endpoint.port),
  logFile,
});
