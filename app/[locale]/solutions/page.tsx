import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/providers/query-client/get-query-client";
import { prefetchSolutions, prefetchClients, type WpLocale } from "@/lib/wp";
import Hero from "@/components/sections/solutions/hero";
import Catalogue from "@/components/sections/solutions/catalogue";
import PartnerCta from "@/components/sections/solutions/partner-cta";
import Faq from "@/components/sections/solutions/faq";
import Clients from "@/components/sections/solutions/clients";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("SolutionsPage"),
    getLocale(),
  ]);

  return {
    title: `${t("hero.eyebrow")} — ${t("hero.titleLead")} ${t("hero.titleAccent")}`,
    description: t("hero.description"),
    alternates: await localeAlternates(locale, "/solutions"),
  };
}

export default async function SolutionsPage() {
  const locale: WpLocale = (await getLocale()) === "ar" ? "ar" : "en";
  const queryClient = getQueryClient();
  await Promise.allSettled([
    prefetchSolutions(queryClient, locale),
    prefetchClients(queryClient, locale),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="overflow-x-clip">
        <Hero />
        <Catalogue />
        <PartnerCta />
        <Faq />
        <Clients />
      </main>
    </HydrationBoundary>
  );
}
