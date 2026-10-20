import { useTranslations } from "next-intl";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

/**
 * Blog listing hero — ink band with the eyebrow, headline and supporting
 * copy, aligned to the reading-start edge like the Insights hero. The accent
 * segment is optional (the current design uses a single white headline).
 */
export default function Hero() {
  const t = useTranslations("Blog.page");

  return (
    <section className="relative flex items-center overflow-hidden bg-ink lg:min-h-[486px]">
      {/* Centre glow (per Figma) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[73px] left-1/2 size-[618px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(28,151,212,0.3)_0%,transparent_68%)] blur-[12px]"
      />
      <div className="relative mx-auto w-full max-w-360 px-6 pb-16 pt-32 lg:px-10 lg:py-24">
        <Stagger
          as="div"
          className="flex flex-col items-center text-center"
          stagger={0.14}
          delayChildren={0.05}
          amount={0.3}
        >
          <StaggerItem
            className="mb-5 flex items-center gap-3.5"
            distance={40}
          >
            <span className="text-[13px] leading-4 uppercase tracking-[1.5px] text-lightblue-300">
              {t("eyebrow")}
            </span>
          </StaggerItem>

          <MaskText
            as="h1"
            className="max-w-[665px] text-[40px] font-bold leading-[1.17] text-white lg:text-[48px] lg:leading-14"
            segments={[
              { text: t("titleLead") },
              { text: t("titleAccent"), className: "text-lightblue-300" },
            ].filter((s) => s.text)}
            orchestrated
            stagger={0.08}
            duration={0.95}
          />

          <StaggerItem
            as="p"
            className="mt-6 max-w-[551px] text-[16px] leading-6 text-slate-200"
          >
            {t("description")}
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
