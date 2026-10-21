import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/blog/hero";
import Featured from "@/components/sections/blog/featured";
import Updates from "@/components/sections/blog/updates";
import type { BlogPost } from "@/lib/blog";
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
  const t = await getTranslations();
  const posts = t.raw("Blog.posts") as BlogPost[];

  if (posts.length === 0) {
    return (
      <main className="overflow-x-clip">
        <Hero />
      </main>
    );
  }

  const featured = posts[0];

  return (
    <main className="overflow-x-clip">
      <Hero />
      <Featured post={featured} />
      <Updates posts={posts} />
    </main>
  );
}
