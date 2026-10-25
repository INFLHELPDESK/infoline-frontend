import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { SITEMAP_PATHS } from "@/lib/routes";
import { buildInsightSitemapEntries } from "@/lib/insights-seo";
import { loadPublishedInsights } from "@/lib/insights-sitemap";
import enMessages from "@/locales/en.json";

/**
 * Rendered per request, not at build: the Insight entries come from the CMS, and
 * a build (isolated or CI) must make no CMS request. The CMS fetch is cached by
 * the Next data cache (WP_REVALIDATE), so crawlers do not hit the CMS each time.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPaths = enMessages.Blog.posts.map((post) => `/blog/${post.slug}`);
  const paths = [...SITEMAP_PATHS, ...blogPaths];

  const staticEntries: MetadataRoute.Sitemap = paths.map((path) => ({
    url: `${SITE_URL}/${routing.defaultLocale}${path}`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]),
      ),
    },
  }));

  const [en, ar] = await Promise.all([loadPublishedInsights("en"), loadPublishedInsights("ar")]);
  const known = new Set(staticEntries.map((e) => e.url));
  const insightEntries = buildInsightSitemapEntries(SITE_URL, { en, ar }).filter((e) => !known.has(e.url));

  return [...staticEntries, ...insightEntries];
}
