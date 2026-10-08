import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/providers/query-client/get-query-client";
import { prefetchCompanyProfile, type WpLocale } from "@/lib/wp";
import Hero from "@/components/sections/about/hero";
import WhoWeAre from "@/components/sections/about/who-we-are";
import Accountability from "@/components/sections/about/accountability";
import Scale from "@/components/sections/about/scale";
import Credentials from "@/components/sections/about/credentials";
import Vision from "@/components/sections/about/vision";
import Capability from "@/components/sections/about/capability";
import Leadership from "@/components/sections/about/leadership";
import Documents from "@/components/sections/about/documents";
import Cta from "@/components/sections/about/cta";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("AboutPage"),
    getLocale(),
  ]);

  return {
    title: `${t("hero.eyebrow")} — ${t("hero.titleLead")} ${t("hero.titleAccent")}`,
    description: t("hero.description"),
    alternates: await localeAlternates(locale, "/about"),
  };
}

export default async function AboutPage() {
  const locale: WpLocale = (await getLocale()) === "ar" ? "ar" : "en";
  const queryClient = getQueryClient();
  await prefetchCompanyProfile(queryClient, locale).catch(() => {});

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="overflow-x-clip">
        <Hero />
        <WhoWeAre />
        <Accountability />
        <Scale />
        <Credentials />
        <Vision />
        <Capability />
        <Leadership />
        <Documents />
        <Cta />
      </main>
    </HydrationBoundary>
  );
}
