import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { localeAlternates } from "@/lib/site";
import HomePage from "../page";

/**
 * Temporary alias of the homepage, kept for regression comparison. It renders
 * the same page as `/` but is not indexable and canonicalises to the homepage.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    alternates: await localeAlternates(locale),
    robots: { index: false, follow: true },
  };
}

export default HomePage;
