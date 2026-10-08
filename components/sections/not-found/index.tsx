"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

/**
 * Themed "not here yet" page content — the hero visual language (ink band,
 * soft radial glow, mono eyebrow, MaskText headline, magnetic buttons) applied
 * to unknown URLs so they read as a coming-soon teaser instead of a dead end.
 *
 * Rendered by the locale catch-all page (full SSR with layout) and by
 * app/[locale]/not-found.tsx (boundary fallback). Copy comes from the
 * `NotFound` namespace; the out-of-locale root fallback duplicates the design
 * with hardcoded English.
 */
export default function ThemedNotFound() {
  const t = useTranslations("NotFound");

  return (
    <section className="relative overflow-hidden bg-ink">
      {/* Radial glow, top start corner — same art as the hero bands. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/5 start-[-14%] aspect-square w-[43%] rounded-full bg-[radial-gradient(circle,#1C97D4_0%,transparent_68%)] opacity-30 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[72vh] w-full max-w-360 flex-col justify-center px-6 py-28 lg:px-10 lg:py-36">
        <Stagger
          as="div"
          className="flex flex-col items-start"
          stagger={0.14}
          delayChildren={0.05}
          amount={0.3}
        >
          <StaggerItem className="mb-8.5" distance={40}>
            <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-lightblue-300">
              {t("eyebrow")}
            </span>
          </StaggerItem>

          <MaskText
            as="h1"
            className="max-w-[16ch] text-[44px] font-bold leading-[1.05] tracking-[-.033em] text-white lg:text-[52px]"
            segments={[{ text: t("titleLead") }, { text: t("titleAccent") }]}
            orchestrated
            stagger={0.08}
            duration={0.95}
          />

          <StaggerItem
            as="p"
            className="mt-7.5 max-w-[60ch] text-[16px] leading-[24px] text-slate-200"
          >
            {t("description")}
          </StaggerItem>

          <StaggerItem className="mt-11 flex flex-wrap gap-4">
            <Button
              href={t("primaryCta.href")}
              icon={ArrowRight}
              iconPosition="right"
            >
              {t("primaryCta.label")}
            </Button>
            <Button href={t("secondaryCta.href")} variant="secondary">
              {t("secondaryCta.label")}
            </Button>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
