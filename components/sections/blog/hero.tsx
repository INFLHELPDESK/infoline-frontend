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
    <section className="bg-ink">
      <div className="mx-auto w-full max-w-360 px-6 pb-16 pt-28 lg:px-10 lg:pb-24 lg:pt-44">
        <Stagger
          as="div"
          className="flex flex-col items-center text-center"
          stagger={0.14}
          delayChildren={0.05}
          amount={0.3}
        >
          <StaggerItem
            className="mb-8.5 flex items-center gap-3.5"
            distance={40}
          >
            <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-lightblue-300">
              {t("eyebrow")}
            </span>
          </StaggerItem>

          <MaskText
            as="h1"
            className="max-w-[18ch] text-[44px] font-bold leading-[1.05] tracking-[-.033em] text-white lg:text-[48px]"
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
            className="mt-7.5 max-w-[60ch] text-[16px] leading-[24px] text-slate-200"
          >
            {t("description")}
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
