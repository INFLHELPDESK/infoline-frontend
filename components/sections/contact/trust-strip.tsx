import { useTranslations } from "next-intl";
import { CountUp } from "@/components/ui/motion";

type Stat = { value: string; label: string };

/**
 * Trust strip — the full-width band under the route cards. Numbers count up on
 * reveal (same treatment as the home proof strip); certifications render in
 * mono to match the Figma.
 */
export default function TrustStrip() {
  const t = useTranslations("ContactPage.trust");
  const stats = t.raw("stats") as Stat[];

  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="mx-auto flex w-full max-w-360 flex-wrap items-center justify-center gap-x-14 gap-y-5 px-6 py-9 lg:justify-between lg:px-10">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-2.5">
            <CountUp
              value={s.value}
              className="font-mono text-[24px] font-bold tracking-tight text-brandblue-500"
            />
            <span className="text-[14px] text-slate-500">{s.label}</span>
          </div>
        ))}
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[24px] font-bold tracking-tight text-brandblue-500">
            {t("certified")}
          </span>
          <span className="text-[14px] text-slate-500">
            {t("certifiedLabel")}
          </span>
        </div>
      </div>
    </section>
  );
}
