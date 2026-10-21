import { cache } from "react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SingleHero from "@/components/sections/blog/single-hero";
import Article from "@/components/sections/blog/article";
import { nextBlogPosts, type BlogPost } from "@/lib/blog";
import { decodeSlug, loadBlogPost } from "@/lib/blog-post";
import { localeAlternates, singleLocaleAlternates } from "@/lib/site";
import Cta from "@/components/sections/home-1/cta";
import ErrorPage, { errorButtonClass } from "@/components/sections/error/error-page";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * One lookup per request: generateMetadata and the page share it, so the CMS is
 * asked once (and a failure is decided once).
 */
const resolvePost = cache(async (slug: string, locale: string) => {
  const t = await getTranslations();
  const posts = t.raw("Blog.posts") as BlogPost[];
  const result = await loadBlogPost(posts, slug, locale === "ar" ? "ar" : "en");
  return { posts, result };
});

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const { result } = await resolvePost(slug, locale);

  if (result.kind === "static") {
    return {
      title: `${result.post.title} — Infoline`,
      description: result.post.excerpt,
      alternates: await localeAlternates(locale, `/blog/${slug}`),
    };
  }
  if (result.kind === "cms") {
    return {
      title: `${result.post.title} — Infoline`,
      description: result.post.excerpt || undefined,
      alternates: await singleLocaleAlternates(
        locale,
        `/blog/${encodeURIComponent(decodeSlug(slug))}`,
      ),
    };
  }
  return { title: "Infoline", robots: { index: false, follow: true } };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const locale = await getLocale();
  const { posts, result } = await resolvePost(slug, locale);

  // A CMS outage is not "no such post": surface it to Next's error handling
  // (500, never a cacheable 404) instead of the soft 404 below.
  if (result.kind === "error") throw result.error;

  if (result.kind !== "static" && result.kind !== "cms") {
    // Soft 404 — themed, server-rendered, noindex (same reasoning as the
    // catch-all route: dynamic not-found boundaries stream no visible HTML
    // in Next 16).
    return <SoftNotFound />;
  }

  const post = result.post;
  const morePosts = nextBlogPosts(posts, post.slug, 2).filter(
    (p) => p.slug !== post.slug,
  );

  // The soft 404 above is a normal page of this route, so the group layout
  // cannot tell it apart: the shared CTA is rendered here, for found posts only.
  return (
    <>
      <main className="overflow-x-clip">
        <SingleHero post={post} />
        <Article post={post} morePosts={morePosts} />
      </main>
      <Cta />
    </>
  );
}

async function SoftNotFound() {
  const [t, e] = await Promise.all([
    getTranslations("Blog.page"),
    getTranslations("ErrorPages.404"),
  ]);

  return (
    <ErrorPage
      status="404"
      eyebrow={e("eyebrow")}
      title={t("single.notFoundTitle")}
      description={t("single.notFoundDescription")}
      actions={
        <Link href="/blog" className={errorButtonClass.primary}>
          {t("single.notFoundCta")}
        </Link>
      }
    />
  );
}
