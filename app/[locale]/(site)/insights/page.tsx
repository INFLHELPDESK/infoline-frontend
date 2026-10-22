import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/insights/hero";
import Callout from "@/components/sections/insights/callout";
import Themes from "@/components/sections/insights/themes";
import Proof from "@/components/sections/insights/proof";
import FormatsLive from "@/components/sections/insights/formats-live";
import FeaturedProof from "@/components/sections/insights/featured-proof";
import Cta from "@/components/sections/insights/cta";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Insight } from "@/lib/insights";
import { loadInsightsFeed } from "@/lib/insights-feed";
import { renderableSlugs } from "@/lib/blog-post";
import type { BlogPost } from "@/lib/blog";
import { INSIGHTS_LIMIT } from "@/lib/content-adapters";
import type { PostCard } from "@/lib/wp";
import { wpKeys } from "@/lib/wp/keys";
import { ProviderQueryWrapper } from "@/providers";
import { getQueryClient } from "@/providers/query-client/get-query-client";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("InsightsPage"),
    getLocale(),
  ]);

  return {
    title: `${t("hero.eyebrow")} — ${t("hero.titleLead")} ${t("hero.titleAccent")}`,
    description: t("hero.description"),
    alternates: await localeAlternates(locale, "/insights"),
  };
}

const WORDS_PER_MINUTE = 200;

/**
 * Adds date, excerpt and reading time to a static card from the locale blog
 * post it links to (matched by slug). Reading time is computed from that
 * post's body; a card with no matching post stays as it was.
 */
function withPostDetails(item: Insight, posts: BlogPost[]): Insight {
  const post = posts.find((p) => item.href === `/blog/${p.slug}`);
  if (!post) return item;
  const words = post.body.join(" ").split(/\s+/).filter(Boolean).length;
  return {
    ...item,
    // Same label the Blog pages show for this post.
    dateLabel: post.dateLabel || undefined,
    excerpt: post.excerpt || undefined,
    readMinutes: words ? Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) : undefined,
  };
}

export default async function InsightsPage() {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  // Static locale items: the fallback whenever the CMS has no usable posts.
  const staticPosts = t.raw("Blog.posts") as BlogPost[];
  const insights = (t.raw("Insights.items") as Insight[]).map((item) =>
    withPostDetails(item, staticPosts),
  );

  // One QueryClient per request (never shared between users); the prefetch
  // fills it and the boundary hands it to the client for hydration.
  const queryClient = getQueryClient();
  const wpLocale = locale === "ar" ? "ar" : "en";
  const feed = await loadInsightsFeed(queryClient, wpLocale);

  // A CMS card links only to a blog detail page that actually renders (static
  // locale posts, or a CMS post the detail route can show); otherwise it stays
  // a plain, non-clickable card. Lookups share the Next data cache with the
  // detail route and never touch this page's dehydrated QueryClient.
  const cards =
    feed.source === "cms"
      ? (queryClient.getQueryData(wpKeys.latestPosts(wpLocale, INSIGHTS_LIMIT)) as PostCard[] | undefined) ?? []
      : [];
  const linkableSlugs = [
    ...(await renderableSlugs(
      staticPosts,
      cards.slice(0, INSIGHTS_LIMIT).map((c) => c.slug),
      wpLocale,
    )),
    ...staticPosts.map((p) => p.slug),
  ];

  return (
    <main className="overflow-x-clip">
      <Hero />
      <Callout />
      <Themes />
      <Proof />
      <ProviderQueryWrapper>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <FormatsLive
            fallback={insights}
            source={feed.source}
            linkableSlugs={linkableSlugs}
          />
        </HydrationBoundary>
      </ProviderQueryWrapper>
      <FeaturedProof />
      <Cta />
    </main>
  );
}
