import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SingleHero from "@/components/sections/blog/single-hero";
import Article from "@/components/sections/blog/article";
import { getBlogPost, nextBlogPosts, type BlogPost } from "@/lib/blog";
import { getPost, getPosts, type WpLocale } from "@/lib/wp";
import { toBlogPost } from "@/lib/content-adapters";
import { localeAlternates } from "@/lib/site";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * Resolve a post for a slug: CMS first (WP `post` by slug), then the designed
 * locale posts. Returns the post plus the full list it belongs to (for the
 * "more posts" rail).
 */
async function resolvePost(slug: string, locale: string) {
  const t = await getTranslations();
  const localePosts = t.raw("Blog.posts") as BlogPost[];

  const wpLocale: WpLocale = locale === "ar" ? "ar" : "en";
  const fromCms = await getPost(slug).catch(() => null);
  if (fromCms) {
    const backendList = await getPosts(wpLocale).catch(() => []);
    const posts = backendList.length
      ? backendList.map((p) => toBlogPost(p, locale))
      : [toBlogPost(fromCms, locale)];
    return { post: toBlogPost(fromCms, locale), posts };
  }

  return { post: getBlogPost(localePosts, slug) ?? null, posts: localePosts };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const { post } = await resolvePost(slug, locale);

  return {
    title: post ? `${post.title} — Infoline` : "Infoline",
    description: post?.excerpt,
    robots: post ? undefined : { index: false, follow: true },
    alternates: post ? await localeAlternates(locale, `/blog/${slug}`) : undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const locale = await getLocale();
  const { post, posts } = await resolvePost(slug, locale);

  if (!post) {
    // Soft 404 — themed, server-rendered, noindex (same reasoning as the
    // catch-all route: dynamic not-found boundaries stream no visible HTML
    // in Next 16).
    return <SoftNotFound />;
  }

  const morePosts = nextBlogPosts(posts, slug, 2).filter(
    (p) => p.slug !== slug,
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
