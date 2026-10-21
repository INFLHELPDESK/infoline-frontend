import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
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

export default function AboutPage() {
  return (
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
  );
}
