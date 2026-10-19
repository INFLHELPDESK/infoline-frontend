/**
 * The only CMS traffic a test run may produce. Each wired route adds exactly
 * the operation it needs; anything else (another page starting to fetch, a
 * mutation, an unknown query) still fails the run.
 */
export const ALLOWED_CMS_OPERATIONS: readonly string[] = [
  "Posts", // /[locale]/insights (cards)
  "PostBySlug", // /[locale]/blog/[slug] (CMS posts) and the Insights link check
];

/**
 * Stub log lines (tests/support/cms-stub/server.mjs):
 *   `POST /graphql op=<Operation>`  a GraphQL request
 *   `GET /stub-media/<file>`        an image the server fetched for next/image
 */
export function isAllowedCmsLogLine(line: string): boolean {
  const graphql = /^POST \/graphql op=(\w+)$/.exec(line);
  if (graphql) return ALLOWED_CMS_OPERATIONS.includes(graphql[1]);
  return /^GET \/stub-media\/[\w.-]+$/.test(line);
}
