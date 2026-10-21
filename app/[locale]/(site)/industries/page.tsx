import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
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

export default function IndustriesPage() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      <Differ />
      <Sectors />
      <Cta />
      <Faq />
      <Clients />
    </main>
  );
}
