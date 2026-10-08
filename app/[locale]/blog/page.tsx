import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/blog/hero";
import Featured from "@/components/sections/blog/featured";
import Updates from "@/components/sections/blog/updates";
import Cta from "@/components/sections/blog/cta";
import type { BlogPost } from "@/lib/blog";
import { getPosts, type WpLocale } from "@/lib/wp";
import { toBlogPost } from "@/lib/content-adapters";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("Blog.page"),
    getLocale(),
  ]);

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: await localeAlternates(locale, "/blog"),
  };
}

export default async function BlogPage() {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const localePosts = t.raw("Blog.posts") as BlogPost[];

  // Blog articles come from the CMS (WP `posts`, locale-aware); the designed
  // locale posts are the graceful fallback while the CMS has none.
  const wpLocale: WpLocale = locale === "ar" ? "ar" : "en";
  const backend = await getPosts(wpLocale).catch(() => []);
  const posts = backend.length
    ? backend.map((p) => toBlogPost(p, locale))
    : localePosts;

  if (posts.length === 0) {
    return (
      <main className="overflow-x-clip">
        <Hero />
        <Cta />
      </main>
    );
  }

  const featured = posts[0];

  return (
    <main className="overflow-x-clip">
      <Hero />
      <Featured post={featured} />
      <Updates posts={posts} />
      <Cta />
    </main>
  );
}
