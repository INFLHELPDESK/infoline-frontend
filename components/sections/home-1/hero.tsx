import Image from "next/image";
import { useTranslations } from "next-intl";
import { CountUp, Stagger, StaggerItem } from "@/components/ui/motion";
import { PillButton } from "./shared";

type Stat = { value: string; unit?: string; label: string };

/**
 * Home-1 hero — full-bleed workshop photo under an ink wash, the headline on
 * the reading-start side and a frosted stats rail pinned to the bottom.
 *
 * RTL: the ink gradient that keeps the copy legible runs from the start edge,
 * so it is mirrored with `rtl:` (dark on the right in Arabic).
 */
export default function Hero() {
  const t = useTranslations("HomeV1.hero");
  const stats = t.raw("stats") as Stat[];

  return (
    // From lg the Hero is the Figma frame (406:3782): 794px tall, copy anchored
    // 188px from the top, stats band 184px (36 + 48 + 8 + 56 + 36). Below lg it
    // fills the viewport (no Figma frame at those widths).
    <section className="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink text-white lg:min-h-[794px]">
      {/* Background photo + washes */}
      <Image
        src={t("image")}
        alt={t("imageAlt")}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[70%_center]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/60" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent rtl:bg-gradient-to-l"
      />
      <div
        aria-hidden
        className="absolute -start-44 -top-52 -z-10 size-[618px] rounded-full bg-[radial-gradient(circle,rgba(28,151,212,0.3)_0%,rgba(28,151,212,0)_68%)] blur-2xl"
      />

      {/* Copy */}
      <div className="mx-auto flex w-full max-w-360 flex-1 items-center px-6 pt-32 pb-12 md:px-12 lg:items-start lg:px-20 lg:pt-[188px]">
        <Stagger
          as="div"
          className="w-full max-w-[768px]"
          stagger={0.12}
          delayChildren={0.1}
        >
          {/* Plain, unanimated h1 — it is the LCP element (same rule as the
              reference home), so it paints at full opacity immediately. */}
          <h1 className="text-[40px] leading-[1.1] font-black tracking-normal sm:text-[52px] lg:text-[56px] lg:leading-[70px]">
            {t("titleLead")}{" "}
            <span className="text-brandblue-400">{t("titleAccent")}</span>
          </h1>

          <StaggerItem
            as="p"
            className="mt-5 max-w-[641px] text-[15px] leading-6 text-slate-100 sm:text-[16px] lg:text-[18px] lg:leading-7"
          >
            {t("description")}
          </StaggerItem>

          <StaggerItem className="mt-9 flex flex-wrap items-center gap-4">
            <PillButton
              href={t("primaryCta.href")}
              size="lg"
              className="lg:text-[18px] lg:leading-7 lg:[&_svg]:size-6"
            >
              {t("primaryCta.label")}
            </PillButton>
            <PillButton
              href={t("secondaryCta.href")}
              size="lg"
              variant="outline"
              arrow={false}
              className="[&:not(:hover)]:text-slate-700 lg:text-[18px] lg:leading-7"
            >
              {t("secondaryCta.label")}
            </PillButton>
          </StaggerItem>
        </Stagger>
      </div>

      {/* Stats rail */}
      <div className="bg-gradient-to-t from-[#041d2a]/54 to-transparent backdrop-blur-[8px]">
        <Stagger
          as="ul"
          className="mx-auto grid w-full max-w-360 grid-cols-2 px-6 md:px-12 lg:grid-cols-4 lg:px-14"
          stagger={0.08}
          amount={0.4}
        >
          {stats.map((stat, i) => (
            <StaggerItem
              as="li"
              key={`${stat.label}-${i}`}
              distance={24}
              // Figma column: 36px block padding, figure 44/48, 8px gap, label
              // 18/28. Below lg, pt-11 / mt-3 keep the figure and label glyphs
              // where they sat before the figure had a real line box.
              className="group border-white/10 pt-11 pb-6 max-lg:border-b sm:px-4 lg:py-9 lg:px-6 [&:nth-child(odd)]:max-sm:pe-4"
            >
              {/* Unit sits on the figure's baseline, as in Figma ("22yrs"). */}
              <p
                dir="ltr"
                className="flex h-10 items-baseline gap-1 text-[36px] leading-10 font-extrabold lg:h-12 text-white transition-colors duration-300 group-hover:text-brandblue-400 rtl:justify-end lg:text-[44px] lg:leading-12"
              >
                <CountUp value={stat.value} />
                {stat.unit && (
                  <span className="text-[16px] leading-6 font-semibold">
                    {stat.unit}
                  </span>
                )}
              </p>
              <p className="mt-3 max-w-[18ch] text-[14px] leading-6 text-slate-100 sm:text-[16px] lg:mt-2 lg:text-[18px] lg:leading-7">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
