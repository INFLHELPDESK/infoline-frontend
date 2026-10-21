/**
 * Registry of the site's top-level routes (locale-stripped). It is the single
 * list behind the sitemap and the header's light-theme check for unknown URLs,
 * so adding a route here keeps both in step.
 */

/** Indexable routes, in sitemap order ("" is the home page). */
export const SITEMAP_PATHS = [
  "",
  "/about",
  "/industries",
  "/solutions",
  "/solutions/managed-branch-retail",
  "/case-studies",
  "/careers",
  "/insights",
  "/blog",
  "/contact",
];

/** Every real top-level route, including ones kept out of the sitemap. */
export const KNOWN_ROUTES = [...SITEMAP_PATHS.filter(Boolean), "/home-1"];
