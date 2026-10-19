/**
 * WPGraphQL endpoint + fetch wrapper.
 *
 * Handover notes baked in here:
 * - No auth for published content; plain POST JSON.
 * - `extensions.debug` in responses is dev-only noise — ignored.
 * - Nothing is required in the CMS: every ACF field can come back null, so
 *   normalization to safe shapes happens in `normalize.ts`, never in UI code.
 * - Fetches are cached on the server (RSC / React Query prefetch) and plain
 *   browser fetches on the client. Whether browser-side requests need an
 *   `/api/wp` proxy (CORS) is an open decision; no such route exists yet.
 *
 * Endpoint safety: there is deliberately NO default endpoint. A missing
 * `NEXT_PUBLIC_WPGRAPHQL_ENDPOINT` fails closed instead of quietly falling
 * back to the production CMS (see `.env.example`).
 */

/** Production CMS host. Isolated runs (tests, CI) must never talk to it. */
const PRODUCTION_CMS_HOST = "green-tarsier-764009.hostingersite.com";

/**
 * True for the production host, its subdomains, and their absolute (trailing
 * dot) spellings: `new URL("https://host./").hostname` keeps the dot, so a
 * plain `===` comparison would miss `host.`.
 */
export function isProductionCmsHost(host: string): boolean {
  const name = host.toLowerCase().replace(/\.+$/, "");
  return name === PRODUCTION_CMS_HOST || name.endsWith(`.${PRODUCTION_CMS_HOST}`);
}

/** Loopback spellings accepted for isolated runs (exact match, fail closed). */
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export class WpConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WpConfigError";
  }
}

/**
 * Resolve the WPGraphQL endpoint. The env read must stay a literal
 * `process.env.NEXT_PUBLIC_*` access so Next inlines it into the browser
 * bundle. Messages never include query bodies or credentials.
 */
export function getWpEndpoint(): string {
  const endpoint = process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT;
  if (!endpoint) {
    throw new WpConfigError(
      "NEXT_PUBLIC_WPGRAPHQL_ENDPOINT is not set; refusing to fall back to a default CMS.",
    );
  }

  let host: string;
  try {
    host = new URL(endpoint).hostname;
  } catch {
    throw new WpConfigError("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT is not a valid URL.");
  }

  // Server-side guard; set CMS_ISOLATED=1 for tests, CI and local validation.
  // Isolated runs may only talk to a loopback endpoint (the local CMS stub), so
  // a renamed or aliased production host cannot slip past the host check.
  if (process.env.CMS_ISOLATED === "1") {
    if (isProductionCmsHost(host)) {
      throw new WpConfigError(
        "CMS_ISOLATED=1 but the endpoint targets the production CMS.",
      );
    }
    if (!LOOPBACK_HOSTS.has(host)) {
      throw new WpConfigError(
        "CMS_ISOLATED=1 requires a loopback endpoint (the local CMS stub).",
      );
    }
  }

  return endpoint;
}

/** Seconds a CMS response stays fresh in the Next.js data cache (server-side). */
export const WP_REVALIDATE = 300;

/** Per-request budget. A hung CMS must fail the render, not hold it open. */
export const WP_TIMEOUT_MS = 10_000;

/**
 * Why a CMS request failed. Every kind is an infrastructure/contract failure:
 * none of them means "the CMS has no such content" (that is a resolved `null`
 * or an empty list, never an error).
 *
 * - `http`          non-2xx response (`status` is set)
 * - `graphql`       the `errors` array was non-empty (data is discarded)
 * - `network`       the request never produced a response (DNS, reset, ...)
 * - `timeout`       no complete response within the timeout
 * - `malformed`     body is not JSON, not an envelope, or a list root has no `nodes` array
 * - `missing-root`  valid envelope but a root field the query asked for is absent
 *                   (an explicit `null` root is valid: "not found" / unset options)
 */
export type WpFailureKind =
  | "http"
  | "graphql"
  | "network"
  | "timeout"
  | "malformed"
  | "missing-root";

export class WpRequestError extends Error {
  readonly kind: WpFailureKind;
  readonly status?: number;
  constructor(
    kind: WpFailureKind,
    message: string,
    options?: { status?: number; cause?: unknown },
  ) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = "WpRequestError";
    this.kind = kind;
    this.status = options?.status;
  }
}

export function isWpRequestError(error: unknown): error is WpRequestError {
  return error instanceof WpRequestError;
}

type WpError = { message: string };

type WpResponse<T> = {
  data?: T;
  errors?: WpError[];
};

export type WpFetchOptions = {
  /** Root fields the query selects; each must be present (`null` is allowed). */
  roots?: readonly string[];
  /** Override `WP_TIMEOUT_MS`. */
  timeoutMs?: number;
  /** Caller cancellation. An abort rejects with the caller's own reason, not a WpRequestError. */
  signal?: AbortSignal;
};

function describeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function wpFetch<TData>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate: number = WP_REVALIDATE,
  { roots = [], timeoutMs = WP_TIMEOUT_MS, signal }: WpFetchOptions = {},
): Promise<TData> {
  const isServer = typeof window === "undefined";
  const endpoint = getWpEndpoint();

  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  // Maps an interrupted request to its cause. The timeout covers the body read
  // too: a server that sends headers and then stalls must not hang the render.
  const interrupted = (cause: unknown) => {
    if (signal?.aborted) return signal.reason ?? cause; // cancellation, not a CMS failure
    if (timeout.aborted) {
      return new WpRequestError("timeout", `WPGraphQL request timed out after ${timeoutMs}ms`, {
        cause,
      });
    }
    return undefined;
  };

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: combined,
      // Server fetches go through the Next.js data cache; browser fetches are
      // handled by React Query's cache instead.
      ...(isServer ? { cache: "force-cache", next: { revalidate } } : {}),
    });
  } catch (cause) {
    throw (
      interrupted(cause) ??
      new WpRequestError("network", `WPGraphQL network failure: ${describeError(cause)}`, {
        cause,
      })
    );
  }

  if (!res.ok) {
    throw new WpRequestError("http", `WPGraphQL request failed: HTTP ${res.status}`, {
      status: res.status,
    });
  }

  let json: WpResponse<TData> | null;
  try {
    json = (await res.json()) as WpResponse<TData> | null;
  } catch (cause) {
    throw (
      interrupted(cause) ??
      new WpRequestError("malformed", "WPGraphQL returned a malformed response body", { cause })
    );
  }

  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new WpRequestError("malformed", "WPGraphQL returned a non-object response");
  }

  if (Array.isArray(json.errors) && json.errors.length) {
    throw new WpRequestError(
      "graphql",
      `WPGraphQL error: ${json.errors.map((e) => e?.message).join(" · ")}`,
    );
  }
  if (json.data === undefined || json.data === null) {
    throw new WpRequestError("malformed", "WPGraphQL returned no data");
  }
  if (typeof json.data !== "object" || Array.isArray(json.data)) {
    throw new WpRequestError("malformed", "WPGraphQL data is not an object");
  }

  const data = json.data as Record<string, unknown>;
  for (const root of roots) {
    if (data[root] === undefined) {
      throw new WpRequestError(
        "missing-root",
        `WPGraphQL response is missing root field "${root}"`,
      );
    }
  }

  return json.data;
}

/**
 * Nodes of a connection root. `[]` is valid empty content; a root that is
 * `null` or has no `nodes` array is a broken response, not an empty list.
 */
export function wpNodes<T>(
  connection: { nodes?: T[] | null } | null | undefined,
  root: string,
): T[] {
  if (!connection || !Array.isArray(connection.nodes)) {
    throw new WpRequestError("malformed", `WPGraphQL root "${root}" has no nodes array`);
  }
  return connection.nodes;
}
