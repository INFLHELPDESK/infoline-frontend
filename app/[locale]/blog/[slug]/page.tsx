import { cache } from "react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SingleHero from "@/components/sections/blog/single-hero";
import Article from "@/components/sections/blog/article";
import { nextBlogPosts, type BlogPost } from "@/lib/blog";
import { decodeSlug, loadBlogPost } from "@/lib/blog-post";
import { localeAlternates, singleLocaleAlternates } from "@/lib/site";

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

  return (
    <main className="overflow-x-clip">
      <SingleHero post={post} />
      <Article post={post} morePosts={morePosts} />
    </main>
  );
}

function SoftNotFound() {
  return (
    <main className="overflow-x-clip">
      <section className="flex min-h-[70vh] items-center bg-ink">
        <div className="mx-auto w-full max-w-360 px-6 py-28 lg:px-10">
          <NotFoundBody />
        </div>
      </section>
    </main>
  );
}

async function NotFoundBody() {
  const t = await getTranslations("Blog.page");

  return (
    <div className="flex flex-col items-start">
      <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-lightblue-300">
        404
      </p>
      <h1 className="mt-5 max-w-[20ch] text-[40px] font-bold leading-[1.05] tracking-[-.03em] text-white lg:text-[48px]">
        {t("single.notFoundTitle")}
      </h1>
      <p className="mt-6 max-w-[52ch] text-[16px] leading-[26px] text-slate-200">
        {t("single.notFoundDescription")}
      </p>
      <Link
        href="/blog"
        className="mt-10 inline-flex items-center gap-2.5 rounded-md border border-white/18 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.11em] text-white transition-colors hover:border-white/40 hover:bg-white/[.04]"
      >
        {t("single.notFoundCta")}
      </Link>
    </div>
  );
}
