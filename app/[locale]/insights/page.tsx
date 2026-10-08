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
import { getPosts, type WpLocale } from "@/lib/wp";
import { toInsight } from "@/lib/content-adapters";
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
  const localeInsights = t.raw("Insights.items") as Insight[];

  // The insights grid is fed by the CMS (WP `posts`, locale-aware); the designed
  // locale items are the graceful fallback while the CMS has none.
  const wpLocale: WpLocale = locale === "ar" ? "ar" : "en";
  const backend = await getPosts(wpLocale).catch(() => []);
  const insights = backend.length ? backend.map(toInsight) : localeInsights;

  return (
    <main className="overflow-x-clip">
      <Hero />
      <Callout />
      <Themes />
      <Proof />
      <Formats insights={insights} />
      <FeaturedProof />
      <Cta />
    </main>
  );
}
