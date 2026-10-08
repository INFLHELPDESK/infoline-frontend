import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/providers/query-client/get-query-client";
import { prefetchIndustries, prefetchClients, type WpLocale } from "@/lib/wp";
import Hero from "@/components/sections/industries/hero";
import Differ from "@/components/sections/industries/differ";
import Sectors from "@/components/sections/industries/sectors";
import Cta from "@/components/sections/industries/cta";
import Faq from "@/components/sections/industries/faq";
import Clients from "@/components/sections/industries/clients";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("IndustriesPage"),
    getLocale(),
  ]);

  return {
    title: `${t("hero.eyebrow")} — ${t("hero.titleLead")} ${t("hero.titleAccent")}`,
    description: t("hero.description"),
    alternates: await localeAlternates(locale, "/industries"),
  };
}

export default async function IndustriesPage() {
  const locale: WpLocale = (await getLocale()) === "ar" ? "ar" : "en";
  const queryClient = getQueryClient();
  await Promise.allSettled([
    prefetchIndustries(queryClient, locale),
    prefetchClients(queryClient, locale),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="overflow-x-clip">
        <Hero />
        <Differ />
        <Sectors />
        <Cta />
        <Faq />
        <Clients />
      </main>
    </HydrationBoundary>
  );
}
