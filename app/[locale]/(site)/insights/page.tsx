import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/insights/hero";
import Callout from "@/components/sections/insights/callout";
import Themes from "@/components/sections/insights/themes";
import Proof from "@/components/sections/insights/proof";
import Formats from "@/components/sections/insights/formats";
import FeaturedProof from "@/components/sections/insights/featured-proof";
import Cta from "@/components/sections/insights/cta";
import type { Insight } from "@/lib/insights";
import { cardToInsight, toInsightCard, typeLabelsFromFilters } from "@/lib/insights-cards";
import { INSIGHTS_PAGE_CARDS, loadInsightsListing } from "@/lib/insights-listing";
import type { BlogPost } from "@/lib/blog";
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
  const wpLocale = locale === "ar" ? "ar" : "en";

  // One QueryClient per request (never shared between users).
  const listing = await loadInsightsListing(getQueryClient(), wpLocale, INSIGHTS_PAGE_CARDS);

  let formats: React.ReactNode;
  if (listing.status === "cms") {
    const labels = typeLabelsFromFilters(t.raw("Blog.page.filters") as { id: string; label: string }[]);
    formats = (
      <Formats
        insights={listing.items.map((item) => cardToInsight(toInsightCard(item, labels)))}
        contentSource="cms"
      />
    );
  } else if (listing.status === "empty") {
    // The CMS answered and has nothing in this language: say so, never show static items.
    formats = <Formats insights={[]} contentSource="empty" />;
  } else {
    // The CMS could not answer (already logged): the locale's static items.
    const staticPosts = t.raw("Blog.posts") as BlogPost[];
    const insights = (t.raw("Insights.items") as Insight[]).map((item) =>
      withPostDetails(item, staticPosts),
    );
    formats = <Formats insights={insights} contentSource="fallback-error" />;
  }

  return (
    <main className="overflow-x-clip">
      <Hero />
      <Callout />
      <Themes />
      <Proof />
      {formats}
      <FeaturedProof />
      <Cta />
    </main>
  );
}
