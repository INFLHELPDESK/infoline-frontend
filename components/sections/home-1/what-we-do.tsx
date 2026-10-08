import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/ui/icon";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow, sectionTitle } from "./shared";
import GlowCard from "./glow-card";

export type CapabilityItem = {
  icon: string | null;
  title: string;
  description: string;
  href: string;
};

/**
 * Section 3 — "Everything your operation needs." Dark capability grid.
 * Figma layout: two wide cards, then rows of three. The grid is 6 columns so
 * that holds for any count: the first two items span 3, the rest span 2.
 */
export default function WhatWeDo({ items }: { items?: CapabilityItem[] }) {
  const t = useTranslations("HomeV1.whatWeDo");
  const list = items?.length ? items : (t.raw("items") as CapabilityItem[]);

  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 text-white sm:py-24 lg:pt-20 lg:pb-32">
      {/* Concentric rings, top end corner (Figma Ellipse 16/17) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-12 -top-28 -z-10 size-[339px] animate-[spin_60s_linear_infinite] rounded-full border border-brandblue-500/15"
      >
        <span className="absolute inset-14 rounded-full border border-brandblue-500/30" />
        <span className="absolute start-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brandblue-500/60 rtl:translate-x-1/2" />
      </div>

      <div className="mx-auto w-full max-w-360 px-6 md:px-12 lg:px-20">
        <Stagger as="div" className="mx-auto flex max-w-[655px] flex-col items-center text-center" stagger={0.12}>
          <StaggerItem distance={24}>
            <Eyebrow tone="dark">{t("eyebrow")}</Eyebrow>
          </StaggerItem>
          <StaggerItem as="h2" className={`mt-6 ${sectionTitle} font-medium`}>
            {t("title")}
          </StaggerItem>
          <StaggerItem as="p" className="mt-6 max-w-[536px] text-[15px] leading-6 text-slate-100 sm:text-[16px]">
            {t("description")}
          </StaggerItem>
        </Stagger>

        <Stagger
          as="ul"
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-6 lg:gap-6"
          stagger={0.08}
          amount={0.15}
        >
          {list.map((item, i) => (
            <StaggerItem
              as="li"
              key={item.title}
              className={i < 2 ? "lg:col-span-3" : "lg:col-span-2"}
            >
              <GlowCard className="h-full rounded-[20px]">
                <Link
                  href={item.href}
                  className="group relative flex h-full min-h-[196px] flex-col rounded-[20px] border border-white/8 bg-[#1d262b]/60 p-6 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:border-brandblue-500/45 hover:shadow-[0_44px_90px_-30px_rgba(21,122,172,0.35)] focus-visible:outline-2 focus-visible:outline-brandblue-400 sm:p-8"
                >
                  {item.icon && (
                    <Icon
                      src={item.icon}
                      aria-hidden
                      className="size-9 text-brandblue-500 transition-transform duration-500 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] group-hover:scale-110 group-hover:-rotate-6"
                    />
                  )}
                  <h3 className="mt-5 text-[22px] leading-9 font-semibold transition-colors duration-300 group-hover:text-brandblue-500 sm:text-[28px]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-[42ch] text-[15px] leading-6 text-slate-100 sm:text-[16px]">
                    {item.description}
                  </p>
                </Link>
              </GlowCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
