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

  // The blog detail route renders static locale posts only, so CMS posts are
  // linked only when it has the slug (otherwise the card is not clickable).
  const linkableSlugs = (t.raw("Blog.posts") as { slug: string }[]).map((p) => p.slug);

  // One QueryClient per request (never shared between users); the prefetch
  // fills it and the boundary hands it to the client for hydration.
  const queryClient = getQueryClient();
  const feed = await loadInsightsFeed(queryClient, locale === "ar" ? "ar" : "en");

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
