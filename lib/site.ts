import { headers } from "next/headers";
import { routing } from "@/i18n/routing";

export const SITE_NAME = "Infoline";

/**
 * Static fallback origin — used only where there's no request to read a host
 * from (e.g. app/sitemap.ts, app/robots.ts, which crawlers fetch directly
 * from the real domain rather than through a browser).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://infoline.om");

/**
 * The origin the CURRENT request actually came in on. Canonical/hreflang tags
 * must match the domain a crawler (or Lighthouse) is hitting — hardcoding the
 * production domain here would make `rel=canonical` point at a different
 * origin while testing on localhost or a preview deployment, which fails
 * Lighthouse's canonical audit. Falls back to SITE_URL when headers aren't
 * available (e.g. during static generation with no request in scope).
 */
export async function getSiteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host) return SITE_URL;
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return SITE_URL;
  }
}

/**
 * Canonical + hreflang alternates for a locale-stripped path, e.g. "/about"
 * or "" for the homepage. Every configured locale (see i18n/routing.ts) gets
 * an hreflang entry pointing at its own URL; x-default points at the
 * default locale so search engines have a fallback for unmatched languages.
 */
export async function localeAlternates(locale: string, path: string = "") {
  const siteUrl = await getSiteUrl();
  const clean = path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${siteUrl}/${l}${clean}`]),
  );

  return {
    canonical: `${siteUrl}/${locale}${clean}`,
    languages: { ...languages, "x-default": languages[routing.defaultLocale] },
  };
}
