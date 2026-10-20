import { useTranslations } from "next-intl";
import {
  MaskText,
  Stagger,
  StaggerItem,
  CountUp,
} from "@/components/ui/motion";

type Movement = { value: string; title: string; subtitle: string };

/**
 * Case Studies hero — the ink band with a soft radial glow, the page headline on
 * the left and the "headline movement" panel on the right: the three numbers the
 * three case studies below are about to prove, so the page's argument is stated
 * before the reader scrolls.
 */
export default function Hero() {
  const t = useTranslations("CaseStudiesPage");
  const movement = t.raw("hero.movement") as Movement[];

  return (
    <section className="relative flex items-center overflow-hidden bg-ink lg:min-h-[486px]">
      {/* Radial glow, top start corner — the hero's only art (per Figma). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/5 start-[-14%] aspect-square w-[43%] rounded-full bg-[radial-gradient(circle,#1C97D4_0%,transparent_68%)] opacity-30 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-360 px-6 pb-20 pt-32 lg:px-10 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_473px] lg:gap-20">
          {/* Left: eyebrow + headline */}
          <Stagger
            as="div"
            className="flex flex-col items-start"
            stagger={0.14}
            delayChildren={0.05}
            amount={0.3}
          >
            <StaggerItem className="mb-5" distance={40}>
              <span className="text-[13px] leading-4 uppercase tracking-[1.5px] text-lightblue-300">
                {t("hero.eyebrow")}
              </span>
            </StaggerItem>

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

            <StaggerItem
              as="p"
              className="mt-6 max-w-[60ch] text-[16px] leading-7 text-slate-200 lg:text-[18px]"
            >
              {t("hero.description")}
            </StaggerItem>
          </Stagger>

          {/* Right: headline movement panel */}
          <div>
            <Stagger as="div" stagger={0.09} delayChildren={0.25} amount={0.2}>
              <StaggerItem className="mb-4" distance={24}>
                <span className="text-[13px] leading-4 uppercase tracking-[1.5px] text-slate-400">
                  {t("hero.movementLabel")}
                </span>
              </StaggerItem>
              <ul>
                {movement.map((m) => (
                  <StaggerItem as="li" key={m.title} distance={28}>
                    <div className="flex items-center justify-between gap-8 border-b border-[rgba(224,224,224,0.12)] py-3">
                      <CountUp
                        value={m.value}
                        className="text-[32px] leading-10 font-bold tabular-nums text-lightblue-300 [direction:ltr]"
                      />
                      <div className="text-end">
                        <div className="text-[14px] leading-5 font-medium text-slate-200">
                          {m.title}
                        </div>
                        <div className="mt-1.5 text-[13px] leading-5 text-slate-400">
                          {m.subtitle}
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </ul>
            </Stagger>
          </div>
        </div>
      </div>
    </section>
  );
}
