import { useTranslations } from "next-intl";
import {
  CountUp,
  MaskText,
  Stagger,
  StaggerItem,
} from "@/components/ui/motion";

type Stat = { value: string; title: string; source: string };

/**
 * Insights hero — ink band, headline copy left and the "Headline movement"
 * stat ledger right: each row pairs a counted-up light-blue figure with the
 * result name and the case study it comes from (mono, right-aligned).
 */
export default function Hero() {
  const t = useTranslations("InsightsPage");
  const stats = t.raw("hero.stats") as Stat[];

  return (
    <section className="relative flex items-center overflow-hidden bg-ink lg:min-h-[486px]">
      {/* Radial glow, top start corner (per Figma) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/5 start-[-14%] aspect-square w-[43%] rounded-full bg-[radial-gradient(circle,#1C97D4_0%,transparent_68%)] opacity-30 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-360 px-6 pb-20 pt-32 lg:px-10 lg:py-20">
        <Stagger
          as="div"
          className="grid items-center gap-2xl lg:grid-cols-[minmax(0,1fr)_448px] lg:gap-20"
          stagger={0.14}
          amount={0.25}
        >
          <StaggerItem direction="start">
            <p className="mb-5 text-[13px] leading-4 uppercase tracking-[1.5px] text-lightblue-300">
              {t("hero.eyebrow")}
            </p>
            <MaskText
              as="h1"
              className="max-w-[665px] text-[40px] font-bold leading-[1.17] text-white lg:text-[48px] lg:leading-14"
              segments={[
                { text: t("hero.titleLead") },
                { text: t("hero.titleAccent") },
              ]}
              orchestrated
              stagger={0.08}
              duration={0.95}
            />
            <p className="mt-6 max-w-[687px] text-[16px] leading-6 text-slate-200">
              {t("hero.description")}
            </p>
          </StaggerItem>

          <StaggerItem direction="end">
            <p className="mb-4 text-[13px] leading-4 uppercase tracking-[1.5px] text-slate-400">
              {t("hero.statsLabel")}
            </p>
            <ul>
              {stats.map((stat) => (
                <li
                  key={stat.title}
                  className="flex items-center justify-between gap-lg border-b border-[rgba(224,224,224,0.12)] py-3"
                >
                  <CountUp
                    value={stat.value}
                    className="text-[32px] leading-10 font-bold text-lightblue-300 [direction:ltr]"
                  />
                  <span className="text-end">
                    <span className="block text-[14px] leading-5 font-medium text-slate-200">
                      {stat.title}
                    </span>
                    <span className="mt-1.5 block text-[13px] leading-4 text-slate-400">
                      {stat.source}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
