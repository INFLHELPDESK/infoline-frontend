"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Icon from "@/components/ui/icon";
import Button from "@/components/ui/button";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";
import { useIndustries } from "@/lib/wp";

type Sector = {
  id: string;
  number: string;
  icon: string;
  image: string;
  title: string;
  headline: string;
  summary: string;
  summaryTitle: string;
  tags: string[];
  cta: { label: string; href: string };
};

export default function Sectors() {
  const t = useTranslations("IndustriesPage");
  // Designed content from the locale files — graceful fallback while the CMS
  // query loads or when it returns nothing.
  const fallback = t.raw("sectors.items") as Sector[];

  // Industries from the CMS (WPGraphQL `industries`). CMS drives the title,
  // hero image and summary; the designed slot (matched positionally) supplies
  // number, icon, headline, tags and CTA so anchors (#sec-<id>) and the rich
  // card design stay intact. Entries without a hero image are skipped.
  const { data: industriesPage } = useIndustries();
  const sectors: Sector[] = useMemo(() => {
    const fromCms = (industriesPage?.items ?? [])
      .filter((i) => i.image?.src)
      .map((i, idx) => {
        const base = fallback[idx % fallback.length];
        return {
          ...base,
          title: i.title || base.title,
          image: i.image!.src,
          summary: i.intro || base.summary,
        };
      });
    return fromCms.length > 0 ? fromCms : fallback;
  }, [industriesPage, fallback]);

  /**
   * Deep-link correction (e.g. /industries#sec-telecom from the home grid).
   *
   * Every sector article is `position: sticky` with a scroll-driven recede
   * animation, so the browser's built-in hash scroll can align against a
   * stuck/scaled box instead of the article's natural flow position — landing
   * deep-links on the wrong card. This effect recomputes the target's natural
   * offset from LAYOUT metrics (offsetHeight ignores transforms; preceding
   * siblings + the container's row gap) and applies it directly, so the
   * landing point is exact regardless of sticky/animation state. Re-applied
   * after fonts/images settle so late layout shifts can't undo it.
   */
  useEffect(() => {
    const applyHashScroll = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#sec-")) return;
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      const scroller = document.scrollingElement;
      if (!el || !scroller) return;

      const container = el.parentElement;
      let naturalTop: number;
      if (container) {
        const gap = parseFloat(getComputedStyle(container).rowGap || "0") || 0;
        let acc = 0;
        let node = container.firstElementChild as HTMLElement | null;
        while (node && node !== el) {
          acc += node.offsetHeight + gap; // offsetHeight: layout size, sticky/transform-proof
          node = node.nextElementSibling as HTMLElement | null;
        }
        naturalTop = container.getBoundingClientRect().top + scroller.scrollTop + acc;
      } else {
        naturalTop = el.getBoundingClientRect().top + scroller.scrollTop;
      }

      const margin = parseFloat(getComputedStyle(el).scrollMarginTop || "0") || 0;
      const target = Math.max(0, naturalTop - margin);
      if (Math.abs(scroller.scrollTop - target) > 2) {
        scroller.scrollTop = target;
      }
    };

    applyHashScroll();
    const t = setTimeout(applyHashScroll, 400);
    window.addEventListener("load", applyHashScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener("load", applyHashScroll);
    };
  }, []);

  return (
    <section className="bg-white py-6xl">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        {/* Header */}
        <Stagger
          as="div"
          className="mb-4xl flex flex-col justify-between gap-lg lg:flex-row lg:items-end"
          stagger={0.15}
        >
          <StaggerItem direction="start">
            <p className="overline-sm-medium mb-sm text-slate-400">
              {t("sectors.eyebrow")}
            </p>
            <MaskText
              as="h2"
              className="heading-2xl-semibold font-bold max-w-[22ch] text-slate-900"
              segments={[{ text: t("sectors.title") }]}
              amount={0.5}
              duration={0.8}
            />
          </StaggerItem>
          <StaggerItem
            as="p"
            direction="end"
            className="body-lg-regular max-w-[52ch] text-slate-700"
          >
            {t("sectors.description")}
          </StaggerItem>
        </Stagger>

        {/* The stack */}
        <div className="flex flex-col gap-8 lg:gap-10">
          {sectors.map((s, i) => {
            const imageFirst = i % 2 === 0;
            return (
              <article
                key={s.id}
                id={`sec-${s.id}`}
                className="scroll-mt-[6.5rem] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_24px_60px_-45px_rgba(38,50,56,0.55)] lg:sticky lg:top-[6.5rem] lg:origin-top lg:will-change-transform lg:animate-stack-recede lg:[animation-timeline:view()] lg:[animation-range:exit-crossing] motion-reduce:[animation:none]"
              >
                <div
                  className={`grid grid-cols-1 items-center lg:grid-cols-2 ${!imageFirst ? "lg:grid-cols-[.7fr_1.3fr]" : "lg:grid-cols-[1.3fr_.7fr]"}`}
                >
                  {/* Visual */}
                  <div
                    className={`min-h-[240px]  p-5  lg:min-h-[420px] items-center justify-center ${
                      !imageFirst ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    <Image
                      src={s.image}
                      alt={s.title}
                      width={380}
                      height={460}
                      className="object-cover rounded-lg"
                    />

                    {/* Ghosted service-icon watermark. */}
                    <Icon
                      src={s.icon}
                      aria-hidden
                      className="absolute -end-6 -top-6 size-40 text-white/10"
                    />
                  </div>

                  {/* Content */}
                  <div
                    className={`flex flex-col justify-center p-7 lg:p-11 ${
                      !imageFirst ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <div className="mb-5 flex flex-col items-start gap-2">
                      <span className="font-mono text-[13px] tabular-nums text-slate-400">
                        {s.number}
                      </span>
                      <span className="block h-0.5 w-8 bg-brandblue-400" />
                    </div>

                    <h3 className="heading-lg-semibold text-slate-900">
                      {s.title}
                    </h3>
                    <p className="body-lg-medium mt-2 text-slate-900">
                      {s.headline}
                    </p>
                    <p className="overline-xs-medium mt-6 uppercase text-slate-400">
                      {s.summaryTitle}
                    </p>
                    <p className="body-md-regular mt-4 max-w-[54ch] text-slate-700">
                      {s.summary}
                    </p>

                    {/* Tags */}
                    <Stagger
                      as="div"
                      className="mt-6 flex flex-wrap gap-2"
                      stagger={0.06}
                      delayChildren={0.15}
                      amount={0.6}
                    >
                      {s.tags.map((tag) => (
                        <StaggerItem
                          as="span"
                          key={tag}
                          distance={14}
                          duration={0.55}
                          blur={false}
                          className="inline-block rounded-full border border-slate-200 bg-slate-25 px-3 py-1 text-[12px] font-medium text-slate-600 transition-colors duration-300 hover:border-brandblue-300 hover:bg-brandblue-50 hover:text-brandblue-700"
                        >
                          {tag}
                        </StaggerItem>
                      ))}
                    </Stagger>

                    <div className="mt-8">
                      <Button
                        href={s.cta.href}
                        icon={ArrowRight}
                        iconPosition="right"
                        size="small"
                        variant="primary"
                      >
                        {s.cta.label}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
