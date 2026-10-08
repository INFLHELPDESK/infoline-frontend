import { useTranslations } from "next-intl";
import {
  Stagger,
  StaggerItem,
  CountUp,
  MaskText,
} from "@/components/ui/motion";

/**
 * Omani capability — light band with the three proof numbers from the catalogue
 * (80%+ Omani workforce, 100% Omani middle-management, 45 promotions in 2026).
 */
export default function Capability() {
  const t = useTranslations("CareersPage");
  const stats = t.raw("capability.stats") as { value: string; label: string }[];

  return (
    <section className="bg-brandblue-900/[0.04] py-24 lg:py-32">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="flex flex-col items-center text-center"
          stagger={0.12}
          delayChildren={0.05}
          amount={0.3}
        >
          <StaggerItem className="mb-6" distance={28}>
            <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-brandblue-600">
              {t("capability.eyebrow")}
            </span>
          </StaggerItem>

          <MaskText
            as="h2"
            className="max-w-[30ch] text-[30px] font-bold leading-[1.15] tracking-[-.025em] text-ink lg:text-[40px]"
            segments={[{ text: t("capability.title") }]}
            stagger={0.05}
            duration={0.85}
          />

          <StaggerItem
            as="p"
            className="mt-6 max-w-[78ch] text-[15px] leading-[25px] text-slate-600 lg:text-base"
          >
            {t("capability.description")}
          </StaggerItem>

          <Stagger
            as="ul"
            className="mt-14 grid w-full grid-cols-1 gap-10 sm:grid-cols-[0.7fr_1.6fr_0.7fr] sm:gap-6 lg:w-[760]"
            stagger={0.12}
            delayChildren={0.15}
            amount={0.25}
          >
            {stats.map((s) => (
              <StaggerItem
                as="li"
                key={s.label}
                distance={32}
                blur={false}
                className=""
              >
                {/* Top rule per stat, matching the design's ticked columns */}
                <div className="mx-auto h-[2px] w-full bg-brandblue-500" />
                <CountUp
                  value={s.value}
                  className="block font-mono mt-3 text-[44px] font-bold tracking-tight text-brandblue-500 lg:text-[56px]"
                />
                <p className="body-md-regular mx-auto mt-3 max-w-[30ch] text-slate-600">
                  {s.label}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </Stagger>
      </div>
    </section>
  );
}
