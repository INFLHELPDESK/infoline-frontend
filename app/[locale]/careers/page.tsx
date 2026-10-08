import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/providers/query-client/get-query-client";
import { prefetchCareers, type WpLocale } from "@/lib/wp";
import Hero from "@/components/sections/careers/hero";
import Capability from "@/components/sections/careers/capability";
import Learn from "@/components/sections/careers/learn";
import Traits from "@/components/sections/careers/traits";
import Vacancies from "@/components/sections/careers/vacancies";
import Cta from "@/components/sections/careers/cta";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("CareersPage"),
    getLocale(),
  ]);

  return {
    title: `${t("hero.eyebrow")} — ${t("hero.title")}`,
    description: t("hero.description"),
    alternates: await localeAlternates(locale, "/careers"),
  };
}

export default async function CareersPage() {
  const locale: WpLocale = (await getLocale()) === "ar" ? "ar" : "en";
  const queryClient = getQueryClient();
  await prefetchCareers(queryClient, locale).catch(() => {});

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="overflow-x-clip">
        <Hero />
        <Capability />
        <Learn />
        <Traits />
        <Vacancies />
        <Cta />
      </main>
    </HydrationBoundary>
  );
}
