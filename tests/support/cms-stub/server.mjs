// Loopback-only WPGraphQL stand-in for tests. Zero dependencies.
//
// It answers `POST /graphql` from deterministic fixtures, keyed by the GraphQL
// operation name and the `$language` / `$uri` / `$id` variables, and records
// every request. It is a *stub*, not a schema implementation: it never
// validates queries against WPGraphQL (see tests/unit/wp/stub-fixtures for the
// fixture-vs-query selection check) and rejects mutations outright, so a form
// submission can never "succeed" against it.
//
// Scenarios (global via `POST /__scenario`, or per request through the
// `x-cms-stub-scenario` header):
//   data:       ok | empty | null-acf | partial
//   GraphQL:    graphql-error | partial-errors | no-data
//   transport:  http-error | malformed-json | malformed-shape | network-error
//   timing:     hang (never answers) | stalled-body (headers, then a body that never ends)
//
// Control endpoints (all loopback-only like everything else):
//   GET /__health   GET /__requests   POST /__reset   POST /__scenario {scenario}

import { createServer } from "node:http";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { KNOWN_OPERATIONS, VARIANTS, resolve } from "./fixtures.mjs";

export const LOOPBACK_HOSTS = ["127.0.0.1", "localhost", "[::1]", "::1"];

export const SCENARIOS = [
  ...VARIANTS.map((v) => (v === "full" ? "ok" : v)),
  "graphql-error",
  "partial-errors",
  "no-data",
  "http-error",
  "malformed-json",
  "malformed-shape",
  "network-error",
  "hang",
  "stalled-body",
];

export const SCENARIO_HEADER = "x-cms-stub-scenario";

/**
 * @typedef {object} StubRequest
 * @property {string} method
 * @property {string} url
 * @property {string} at
 * @property {string} kind  graphql | mutation-rejected | unhandled-operation | media | bad-request | unexpected
 * @property {string | null} [operation]
 * @property {string | null} [operationType]
 * @property {string} [query]
 * @property {Record<string, any>} [variables]
 * @property {string} [scenario]
 * @property {any} [data]  the `data` served (in-process view only)
 */

const MAX_BODY_BYTES = 1_000_000;

// 1x1 transparent GIF so `next/image` / <img> fixtures resolve without a CDN.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export function isLoopbackAddress(address) {
  if (!address) return false;
  const a = address.replace(/^::ffff:/, "");
  return a === "::1" || a.startsWith("127.");
}

/** `query Foo(...)` / `mutation Foo(...)` -> { type, name }. */
export function parseOperation(query) {
  const match = /^\s*(query|mutation|subscription)\s+([A-Za-z_]\w*)/.exec(String(query ?? ""));
  return match ? { type: match[1], name: match[2] } : { type: null, name: null };
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": `content-type, ${SCENARIO_HEADER}`,
  "access-control-allow-methods": "POST, GET, OPTIONS",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...CORS, ...headers });
  res.end(body);
}

const sendJson = (res, status, payload) =>
  send(res, status, JSON.stringify(payload), { "content-type": "application/json" });

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * @param {{ host?: string, port?: number, logFile?: string }} [options]
 *
 * Start the stub. `port: 0` picks a free port (unit tests); E2E passes the
 * port from NEXT_PUBLIC_WPGRAPHQL_ENDPOINT. Refuses non-loopback hosts.
 */
export async function createCmsStub({ host = "127.0.0.1", port = 0, logFile } = {}) {
  if (!LOOPBACK_HOSTS.includes(host)) {
    throw new Error(`cms-stub: refusing to listen on non-loopback host "${host}"`);
  }
  if (logFile) {
    mkdirSync(dirname(logFile), { recursive: true });
    writeFileSync(logFile, "");
  }

  /** @type {{ scenario: string, requests: StubRequest[] }} */
  const state = { scenario: "ok", requests: [] };

  /** @param {StubRequest} entry */
  function record(entry) {
    state.requests.push(entry);
    // The file log is the cross-process tripwire (global-teardown reads it):
    // control endpoints are not CMS traffic and are never written to it.
    if (logFile) {
      // GraphQL lines carry the operation so teardown can allow only the
      // operations a wired route is expected to make.
      const op =
        entry.kind === "graphql" || entry.kind === "mutation-rejected"
          ? ` op=${entry.operation ?? "unknown"}`
          : "";
      appendFileSync(logFile, `${entry.method} ${entry.url}${op}\n`);
    }
  }

  const server = createServer(async (req, res) => {
    if (!isLoopbackAddress(req.socket.remoteAddress)) {
      req.socket.destroy();
      return;
    }

    const { pathname } = new URL(req.url ?? "/", "http://stub.invalid");
    const method = req.method ?? "GET";

    if (method === "OPTIONS") return send(res, 204, "");

    if (pathname === "/__health") return send(res, 200, "ok");
    if (pathname === "/__requests") return sendJson(res, 200, state.requests);
    if (pathname === "/__reset" && method === "POST") {
      state.requests.length = 0;
      state.scenario = "ok";
      return sendJson(res, 200, { ok: true });
    }
    if (pathname === "/__scenario" && method === "POST") {
      try {
        const { scenario } = JSON.parse(await readBody(req));
        if (!SCENARIOS.includes(scenario)) throw new Error("unknown scenario");
        state.scenario = scenario;
        return sendJson(res, 200, { scenario });
      } catch {
        return sendJson(res, 400, { error: `scenario must be one of ${SCENARIOS.join(", ")}` });
      }
    }

    const base = { method, url: req.url ?? "/", at: new Date().toISOString() };

    if (pathname.startsWith("/stub-media/") && method === "GET") {
      record({ ...base, kind: "media" });
      return send(res, 200, PIXEL, { "content-type": "image/gif" });
    }

    if (pathname !== "/graphql" || method !== "POST") {
      record({ ...base, kind: "unexpected" });
      return sendJson(res, 404, { errors: [{ message: "cms-stub: no such endpoint" }] });
    }

    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      record({ ...base, kind: "bad-request" });
      return sendJson(res, 400, { errors: [{ message: "cms-stub: request body is not JSON" }] });
    }

    const { type, name } = parseOperation(body?.query);
    const header = req.headers[SCENARIO_HEADER];
    const scenario = typeof header === "string" && SCENARIOS.includes(header) ? header : state.scenario;
    /** @type {StubRequest} */
    const entry = {
      ...base,
      kind: "graphql",
      operation: name,
      operationType: type,
      query: body?.query,
      variables: body?.variables ?? {},
      scenario,
      data: undefined,
    };

    if (type === "mutation") {
      // Forms must never succeed against the stub; submissions are mocked per test.
      entry.kind = "mutation-rejected";
      record(entry);
      return sendJson(res, 200, {
        errors: [{ message: `cms-stub: mutation "${name}" is not supported` }],
      });
    }

    if (scenario === "network-error") {
      record(entry);
      req.socket.destroy();
      return;
    }
    if (scenario === "hang") {
      // Never answers; the client's timeout or abort ends it (close() drops the socket).
      record(entry);
      return;
    }
    if (scenario === "stalled-body") {
      record(entry);
      res.writeHead(200, { ...CORS, "content-type": "application/json" });
      res.write('{"data": {"services": ');
      return;
    }
    if (scenario === "http-error") {
      record(entry);
      return send(res, 500, "cms-stub: simulated server error", { "content-type": "text/plain" });
    }
    if (scenario === "malformed-json") {
      record(entry);
      return send(res, 200, '{"data": {"services": {"nodes": [', { "content-type": "application/json" });
    }
    if (scenario === "graphql-error") {
      record(entry);
      return sendJson(res, 200, { errors: [{ message: "stub: simulated GraphQL error" }], data: null });
    }
    if (scenario === "no-data") {
      record(entry);
      return sendJson(res, 200, { data: null });
    }
    if (scenario === "malformed-shape") {
      // Valid envelope, but none of the root fields the query asked for.
      record(entry);
      return sendJson(res, 200, { data: {} });
    }

    const variant = scenario === "partial-errors" ? "full" : scenario === "ok" ? "full" : scenario;
    const data = resolve(name, body?.variables, variant);
    if (data === undefined) {
      entry.kind = "unhandled-operation";
      record(entry);
      return sendJson(res, 200, {
        errors: [
          {
            message: `cms-stub: no fixture for operation "${name}" (known: ${KNOWN_OPERATIONS.join(", ")})`,
          },
        ],
      });
    }

    entry.data = data;
    record(entry);
    if (scenario === "partial-errors") {
      return sendJson(res, 200, { data, errors: [{ message: "stub: partial failure" }] });
    }
    return sendJson(res, 200, { data });
  });

  await new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(port, host === "[::1]" ? "::1" : host, ok);
  });

  const address = server.address();
  const boundPort = typeof address === "object" && address ? address.port : port;
  const origin = `http://${host}:${boundPort}`;

  return {
    origin,
    url: `${origin}/graphql`,
    port: boundPort,
    /** Recorded requests (in-process view; includes the served `data`). */
    requests: state.requests,
    graphqlRequests: () => state.requests.filter((r) => r.kind === "graphql"),
    get scenario() {
      return state.scenario;
    },
    setScenario(next) {
      if (!SCENARIOS.includes(next)) throw new Error(`cms-stub: unknown scenario "${next}"`);
      state.scenario = next;
    },
    reset() {
      state.requests.length = 0;
      state.scenario = "ok";
    },
    close: () =>
      new Promise((ok) => {
        server.closeAllConnections?.();
        server.close(() => ok());
      }),
  };
}
