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
  if (process.env.CMS_ISOLATED === "1" && host === PRODUCTION_CMS_HOST) {
    throw new WpConfigError(
      "CMS_ISOLATED=1 but the endpoint targets the production CMS.",
    );
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
