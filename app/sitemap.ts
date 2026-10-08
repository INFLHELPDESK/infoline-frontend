import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import enMessages from "@/locales/en.json";

/** Every static route in the app, locale-stripped. */
const STATIC_PATHS = [
  "",
  "/about",
  "/industries",
  "/solutions",
  "/case-studies",
  "/careers",
  "/insights",
  "/blog",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPaths = enMessages.Blog.posts.map((post) => `/blog/${post.slug}`);
  const paths = [...STATIC_PATHS, ...blogPaths];

  return paths.map((path) => ({
    url: `${SITE_URL}/${routing.defaultLocale}${path}`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]),
      ),
    },
  }));
}
