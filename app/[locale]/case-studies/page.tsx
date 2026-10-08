import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/case-studies/hero";
import Chapters from "@/components/sections/case-studies/chapters";
import Cta from "@/components/sections/case-studies/cta";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("CaseStudiesPage"),
    getLocale(),
  ]);

  return {
    title: `${t("hero.eyebrow")} — ${t("hero.titleLead")} ${t("hero.titleAccent")}`,
    description: t("hero.description"),
    alternates: await localeAlternates(locale, "/case-studies"),
  };
}

export default function CaseStudiesPage() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      <Chapters />
      <Cta />
    </main>
  );
}
