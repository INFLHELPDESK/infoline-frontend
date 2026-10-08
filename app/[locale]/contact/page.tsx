import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/contact/hero";
import RouteCards from "@/components/sections/contact/route-cards";
import TrustStrip from "@/components/sections/contact/trust-strip";
import Form from "@/components/sections/contact/form";
import { RouteProvider, type RouteId } from "@/components/sections/contact/route-context";
import { localeAlternates } from "@/lib/site";

const VALID_ROUTES: RouteId[] = ["service", "project", "vendor", "careers"];

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("ContactPage"),
    getLocale(),
  ]);

  return {
    title: `${t("hero.eyebrow")} — ${t("hero.titleLead")} ${t("hero.titleAccent")}`,
    description: t("hero.description"),
    alternates: await localeAlternates(locale, "/contact"),
  };
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ route?: string }>;
}) {
  // Root-scope reads must happen on the server — client `t.raw` across
  // namespaces throws MISSING_MESSAGE in the browser.
  const rootT = await getTranslations();
  const services = rootT.raw("Solutions.items") as { title: string }[];

  const { route } = await searchParams;
  const initialRoute = VALID_ROUTES.includes(route as RouteId)
    ? (route as RouteId)
    : "service";

  return (
    <main className="overflow-x-clip">
      <RouteProvider initialRoute={initialRoute}>
        <Hero />
        <RouteCards />
        <TrustStrip />
        <Form services={services} />
      </RouteProvider>
    </main>
  );
}
