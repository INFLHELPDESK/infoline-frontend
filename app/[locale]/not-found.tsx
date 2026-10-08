import type { Metadata } from "next";
import ThemedNotFound from "@/components/sections/not-found";

/**
 * Locale-aware 404 boundary fallback. Renders the same themed coming-soon
 * content as the catch-all page for any request that reaches the not-found
 * boundary inside a locale (e.g. notFound() thrown deeper in the tree).
 */
export const metadata: Metadata = {
  title: "Coming soon — Infoline",
  robots: { index: false, follow: true },
};

export default function NotFoundPage() {
  return <ThemedNotFound />;
}
