import type { Metadata } from "next";
import ThemedNotFound from "@/components/sections/not-found";

/**
 * Catch-all for unmatched URLs inside a locale. Renders the themed
 * "coming soon" page as a real, server-rendered page — full layout
 * (header/footer, fonts, RTL) and CSS in the initial HTML.
 *
 * Deliberately NOT calling notFound() here: not-found boundaries inside
 * dynamic segments stream no visible HTML in Next 16 (they render client-side
 * only), which is exactly the blank page this route exists to avoid. A 200
 * response for unknown paths is accepted per design ("no 404 page"); the page
 * is marked noindex so search engines don't index soft-404s.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Coming soon — Infoline",
    robots: { index: false, follow: true },
  };
}

export default function CatchAllPage() {
  return <ThemedNotFound />;
}
