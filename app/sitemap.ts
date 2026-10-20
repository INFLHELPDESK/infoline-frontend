import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { SITEMAP_PATHS } from "@/lib/routes";
import enMessages from "@/locales/en.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPaths = enMessages.Blog.posts.map((post) => `/blog/${post.slug}`);
  const paths = [...SITEMAP_PATHS, ...blogPaths];

  return paths.map((path) => ({
    url: `${SITE_URL}/${routing.defaultLocale}${path}`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]),
      ),
    },
  }));
}
