import Image from "next/image";
import { useTranslations } from "next-intl";
import { CountUp, Stagger, StaggerItem } from "@/components/ui/motion";
import { PillButton } from "./shared";
import HeroBadge from "./hero-badge";

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
    <section className="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink text-white lg:min-h-[760px]">
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
      <div className="mx-auto flex w-full max-w-360 flex-1 items-center px-6 pt-32 pb-12 md:px-12 lg:px-20 lg:pt-36">
        <Stagger
          as="div"
          className="w-full max-w-[768px]"
          stagger={0.12}
          delayChildren={0.1}
        >
          <StaggerItem distance={24}>
            <HeroBadge label={t("badge")} />
          </StaggerItem>

          {/* Plain, unanimated h1 — it is the LCP element (same rule as the
              reference home), so it paints at full opacity immediately. */}
          <h1 className="mt-7 text-[40px] leading-[1.1] font-bold tracking-[-0.03em] sm:text-[52px] lg:text-[66px] lg:leading-[1.2]">
            {t("titleLead")}{" "}
            <span className="text-brandblue-400">{t("titleAccent")}</span>
          </h1>

          <StaggerItem
            as="p"
            className="mt-5 max-w-[641px] text-[15px] leading-6 text-slate-100 sm:text-[16px]"
          >
            {t("description")}
          </StaggerItem>

          <StaggerItem className="mt-9 flex flex-wrap items-center gap-4">
            <PillButton href={t("primaryCta.href")} size="lg">
              {t("primaryCta.label")}
            </PillButton>
            <PillButton href={t("secondaryCta.href")} size="lg" variant="soft">
              {t("secondaryCta.label")}
            </PillButton>
          </StaggerItem>
        </Stagger>
      </div>

      {/* Stats rail */}
      <div className="bg-[#041d2a]/55 backdrop-blur-lg">
        <Stagger
          as="ul"
          className="mx-auto grid w-full max-w-360 grid-cols-2 px-6 sm:grid-cols-3 md:px-12 lg:grid-cols-5 lg:px-14"
          stagger={0.08}
          amount={0.4}
        >
          {stats.map((stat, i) => (
            <StaggerItem
              as="li"
              key={`${stat.label}-${i}`}
              distance={24}
              className="group border-white/10 py-6 max-lg:border-b sm:px-4 lg:py-10 lg:px-6 [&:nth-child(odd)]:max-sm:pe-4"
            >
              <p
                dir="ltr"
                className="flex h-10 items-end gap-1 text-[36px] leading-none font-semibold lg:h-14 text-white transition-colors duration-300 group-hover:text-brandblue-400 rtl:justify-end lg:text-[48px]"
              >
                <CountUp value={stat.value} />
                {stat.unit && (
                  <span className="pb-0.5 text-[16px] font-semibold lg:pb-1 lg:text-[20px]">
                    {stat.unit}
                  </span>
                )}
              </p>
              <p className="mt-3 max-w-[18ch] pt-5 text-[14px] leading-6 text-slate-500 sm:text-[16px]">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
