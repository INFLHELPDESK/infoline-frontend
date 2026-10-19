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

type WpError = { message: string };

type WpResponse<T> = {
  data?: T;
  errors?: WpError[];
};

export async function wpFetch<TData>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate: number = WP_REVALIDATE,
): Promise<TData> {
  const isServer = typeof window === "undefined";

  const res = await fetch(getWpEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    // Server fetches go through the Next.js data cache; browser fetches are
    // handled by React Query's cache instead.
    ...(isServer ? { cache: "force-cache", next: { revalidate } } : {}),
  });

  if (!res.ok) {
    throw new Error(`WPGraphQL request failed: HTTP ${res.status}`);
  }

  const json = (await res.json()) as WpResponse<TData>;

  if (json.errors?.length) {
    throw new Error(
      `WPGraphQL error: ${json.errors.map((e) => e.message).join(" · ")}`,
    );
  }
  if (json.data === undefined || json.data === null) {
    throw new Error("WPGraphQL returned no data");
  }

  return json.data;
}
