import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/insights/hero";
import Callout from "@/components/sections/insights/callout";
import Themes from "@/components/sections/insights/themes";
import Proof from "@/components/sections/insights/proof";
import FormatsLive from "@/components/sections/insights/formats-live";
import FeaturedProof from "@/components/sections/insights/featured-proof";
import Cta from "@/components/sections/insights/cta";
import BlogLink from "@/components/sections/insights/blog-link";
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

export default async function InsightsPage() {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  // Static locale items: the fallback whenever the CMS has no usable posts.
  const insights = t.raw("Insights.items") as Insight[];

  // One QueryClient per request (never shared between users); the prefetch
  // fills it and the boundary hands it to the client for hydration.
  const queryClient = getQueryClient();
  const wpLocale = locale === "ar" ? "ar" : "en";
  const feed = await loadInsightsFeed(queryClient, wpLocale);

  // A CMS card links only to a blog detail page that actually renders (static
  // locale posts, or a CMS post the detail route can show); otherwise it stays
  // a plain, non-clickable card. Lookups share the Next data cache with the
  // detail route and never touch this page's dehydrated QueryClient.
  const staticPosts = t.raw("Blog.posts") as BlogPost[];
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
      <BlogLink />
      <FeaturedProof />
      <Cta />
    </main>
  );
}
