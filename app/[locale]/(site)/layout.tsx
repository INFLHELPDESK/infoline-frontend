import type { ReactNode } from "react";
import Cta from "@/components/sections/home-1/cta";

/**
 * Layout of the regular site pages: the shared closing CTA sits at the end of
 * the page content, directly above the footer (which the locale layout renders
 * after `children`).
 *
 * Error states — `error.tsx`, `not-found.tsx` and the `[...rest]` catch-all —
 * live outside this group on purpose, so they never get the CTA. Pages that can
 * resolve to an inline soft 404 (`blog/[slug]`) render <Cta /> themselves, only
 * for found content.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Cta />
    </>
  );
}
