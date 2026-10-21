import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
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

export default function CareersPage() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      <Capability />
      <Learn />
      <Traits />
      <Vacancies />
      <Cta />
    </main>
  );
}
