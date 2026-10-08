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
    <section className="bg-ink">
      <div className="mx-auto w-full max-w-360 px-6 py-20 lg:px-10 lg:py-30">
        <Stagger
          as="div"
          className="grid items-start gap-2xl lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]"
          stagger={0.14}
          amount={0.25}
        >
          <StaggerItem direction="start">
            <p className="overline-sm-medium mb-sm text-brandblue-300">
              {t("hero.eyebrow")}
            </p>
            <MaskText
              as="h1"
              className="heading-2xl-semibold text-[48px] max-w-[16ch] text-white"
              segments={[
                { text: t("hero.titleLead") },
                { text: t("hero.titleAccent") },
              ]}
              orchestrated
              stagger={0.08}
              duration={0.95}
            />
            <p className="body-md-medium mt-6 max-w-[70ch] text-slate-200">
              {t("hero.description")}
            </p>
          </StaggerItem>

          <StaggerItem direction="end">
            <p className="overline-sm-medium mb-6 uppercase tracking-[0.2em] text-slate-400">
              {t("hero.statsLabel")}
            </p>
            <ul>
              {stats.map((stat) => (
                <li
                  key={stat.title}
                  className="flex items-center justify-between gap-lg border-b border-white/10 py-5 first:pt-0 last:border-b-0"
                >
                  <CountUp
                    value={stat.value}
                    className="text-[40px] font-semibold leading-none tracking-[-.02em] text-brandblue-400"
                  />
                  <span className="text-end">
                    <span className="body-md-medium block text-slate-100">
                      {stat.title}
                    </span>
                    <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
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
