"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/sections/home-1/shared";
import Button from "@/components/ui/button";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

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
  const sectors = t.raw("sectors.items") as Sector[];

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
    <section className="bg-white pb-12">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        {/* Header */}
        <Stagger
          as="div"
          className="mb-8 flex flex-col justify-between gap-lg lg:flex-row lg:items-end"
          stagger={0.15}
        >
          <StaggerItem direction="start">
            <Eyebrow className="mb-4 border border-slate-100">
              {t("sectors.eyebrow")}
            </Eyebrow>
            <MaskText
              as="h2"
              className="max-w-[16ch] text-[32px] leading-[1.1] font-semibold text-slate-900 lg:text-[40px] lg:leading-11"
              segments={[{ text: t("sectors.title") }]}
              amount={0.5}
              duration={0.8}
            />
          </StaggerItem>
          <StaggerItem
            as="p"
            direction="end"
            className="max-w-[557px] text-[16px] leading-6 text-slate-600"
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
                className="scroll-mt-[6.5rem] overflow-hidden rounded-2xl border border-[#cfd8dc] bg-white shadow-[0_12px_32px_rgba(90,103,126,0.08)] lg:sticky lg:top-[6.5rem] lg:origin-top lg:will-change-transform lg:animate-stack-recede lg:[animation-timeline:view()] lg:[animation-range:exit-crossing] motion-reduce:[animation:none]"
              >
                <div
                  className={`grid grid-cols-1 items-center ${imageFirst ? "lg:grid-cols-[1fr_416px]" : "lg:grid-cols-[416px_1fr]"}`}
                >
                  {/* Visual */}
                  <div
                    className={`p-5 lg:p-[19px] ${
                      !imageFirst ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    <Image
                      src={s.image}
                      alt={s.title}
                      width={378}
                      height={458}
                      className="h-[280px] w-full rounded-xl object-cover lg:h-[458px]"
                    />
                  </div>

                  {/* Content */}
                  <div
                    className={`flex flex-col gap-6 p-7 lg:px-9 lg:py-10 ${
                      !imageFirst ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[16px] leading-6 tabular-nums text-slate-400">
                          {s.number}
                        </span>
                        <span className="block h-0.5 w-[49px] bg-brandblue-500" />
                      </div>
                      <h3 className="text-[28px] leading-9 font-bold text-slate-900">
                        {s.title}
                      </h3>
                    </div>
                    <p className="text-[16px] leading-6 font-medium text-slate-900">
                      {s.headline}
                    </p>
                    <hr className="border-[#cfd8dc]" />
                    <div className="flex flex-col gap-4">
                      <p className="text-[12px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-400">
                        {s.summaryTitle}
                      </p>
                      <p className="max-w-[721px] text-[14px] leading-5 text-slate-600">
                        {s.summary}
                      </p>
                    </div>

                    {/* Tags */}
                    <Stagger
                      as="div"
                      className="flex flex-wrap gap-x-2 gap-y-3"
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
                          className="inline-block rounded-full border border-[#cfd8dc] bg-white px-4 py-2.5 text-[12px] leading-4 font-medium text-slate-400 transition-colors duration-300 hover:border-brandblue-300 hover:bg-brandblue-50 hover:text-brandblue-700"
                        >
                          {tag}
                        </StaggerItem>
                      ))}
                    </Stagger>

                    <div>
                      <Button
                        href={s.cta.href}
                        icon={ArrowRight}
                        iconPosition="right"
                        size="md"
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
