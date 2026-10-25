/**
 * The only CMS traffic a test run may produce. Each wired route adds exactly
 * the operation it needs; anything else (another page starting to fetch, a
 * mutation, an unknown query) still fails the run.
 */
export const ALLOWED_CMS_OPERATIONS: readonly string[] = [
  "Insights", // /[locale]/insights (every Insight type)
  "InsightTypeInsights", // /[locale]/blog (article term) and its "Load more" server action
  "Posts", // /[locale]/blog/[slug] locale check
  "PostBySlug", // /[locale]/blog/[slug] (CMS posts)
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
