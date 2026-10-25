import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/blog/hero";
import Featured from "@/components/sections/blog/featured";
import Updates from "@/components/sections/blog/updates";
import Empty from "@/components/sections/blog/empty";
import type { BlogPost } from "@/lib/blog";
import {
  cardToBlogPost,
  pickFeatured,
  toInsightCard,
  typeLabelsFromFilters,
} from "@/lib/insights-cards";
import { loadArticleListing } from "@/lib/insights-listing";
import { localeAlternates } from "@/lib/site";
import { getQueryClient } from "@/providers/query-client/get-query-client";

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

/**
 * The Blog is the `article` view of the Insights content model. A reachable CMS
 * decides what shows: its articles, or an empty state when it has none in this
 * language. Only a CMS failure falls back to the locale's static posts, so a
 * missing Arabic article list never shows English content or static copy as if
 * it were CMS content.
 */
export default async function BlogPage() {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const wpLocale = locale === "ar" ? "ar" : "en";
  const listing = await loadArticleListing(getQueryClient(), wpLocale);

  if (listing.status === "empty") {
    return (
      <main className="overflow-x-clip" data-content-source="empty">
        <Hero />
        <Empty />
      </main>
    );
  }

  if (listing.status === "cms") {
    const labels = typeLabelsFromFilters(t.raw("Blog.page.filters") as { id: string; label: string }[]);
    const cards = listing.items.map((item) => toInsightCard(item, labels));
    const featuredCard = pickFeatured(cards);
    const posts = cards.map((card) => cardToBlogPost(card, wpLocale));

    return (
      <main className="overflow-x-clip" data-content-source="cms">
        <Hero />
        {featuredCard ? <Featured post={cardToBlogPost(featuredCard, wpLocale)} /> : null}
        <Updates
          posts={posts}
          source="cms"
          pageInfo={{ hasNextPage: listing.hasNextPage, endCursor: listing.endCursor }}
        />
      </main>
    );
  }

  // The CMS could not answer (already logged): the locale's static posts.
  const posts = t.raw("Blog.posts") as BlogPost[];

  if (posts.length === 0) {
    return (
      <main className="overflow-x-clip" data-content-source="fallback-error">
        <Hero />
      </main>
    );
  }

  const featured = posts[0];

  return (
    <main className="overflow-x-clip" data-content-source="fallback-error">
      <Hero />
      <Featured post={featured} />
      <Updates posts={posts} />
    </main>
  );
}
