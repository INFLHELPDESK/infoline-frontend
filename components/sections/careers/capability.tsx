import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/sections/home-1/shared";
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
    <section className="bg-brandblue-900/[0.04] py-16 lg:py-14">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="flex flex-col items-center text-center"
          stagger={0.12}
          delayChildren={0.05}
          amount={0.3}
        >
          <StaggerItem className="mb-6" distance={28}>
            <Eyebrow>{t("capability.eyebrow")}</Eyebrow>
          </StaggerItem>

          <MaskText
            as="h2"
            className="max-w-[660px] text-[32px] leading-[1.1] font-semibold lg:text-[40px] lg:leading-11 text-ink"
            segments={[{ text: t("capability.title") }]}
            stagger={0.05}
            duration={0.85}
          />

          <StaggerItem
            as="p"
            className="mt-5 max-w-[890px] text-[16px] leading-6 text-slate-600"
          >
            {t("capability.description")}
          </StaggerItem>

          <Stagger
            as="ul"
            className="mt-12 grid w-full grid-cols-1 gap-10 sm:grid-cols-[1fr_1.45fr_1fr] sm:gap-6 lg:w-[765px] lg:grid-cols-[207px_303px_207px]"
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
                <div className="px-6 py-3">
                <CountUp
                  value={s.value}
                  className="block font-mono text-[44px] leading-[1.2] font-semibold text-brandblue-500 lg:text-[48px] lg:leading-14"
                />
                <p className="mx-auto mt-3 text-[14px] leading-5 text-slate-500">
                  {s.label}
                </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Stagger>
      </div>
    </section>
  );
}
