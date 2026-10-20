/**
 * Browser-side CMS endpoint for the form clients (lib/forms, lib/api-client).
 *
 * There is deliberately NO default: a missing NEXT_PUBLIC_WPGRAPHQL_ENDPOINT
 * throws instead of quietly posting to the production CMS. The env read stays a
 * literal `process.env.NEXT_PUBLIC_*` access so Next inlines it into the bundle.
 * Resolved per call, never at import time. Messages carry no secrets.
 */
export function requireCmsEndpoint(): string {
  const endpoint = process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT;
  if (!endpoint) {
    throw new Error(
      "NEXT_PUBLIC_WPGRAPHQL_ENDPOINT is not set; refusing to fall back to a default CMS.",
    );
  }
  return endpoint;
}
