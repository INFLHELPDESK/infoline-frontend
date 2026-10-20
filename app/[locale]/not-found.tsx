import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ThemedNotFound from "@/components/sections/not-found";

/**
 * Locale-aware 404 boundary fallback. Renders the same 404 design as the
 * catch-all page for any request that reaches the not-found boundary inside a
 * locale (e.g. notFound() thrown deeper in the tree).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ErrorPages.404");
  return {
    title: `${t("meta")} — Infoline`,
    robots: { index: false, follow: true },
  };
}

export default function NotFoundPage() {
  return <ThemedNotFound />;
}
