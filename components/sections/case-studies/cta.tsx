import { useTranslations } from "next-intl";
import { PillButton } from "@/components/sections/home-1/shared";
import { Reveal } from "@/components/ui/motion";
import CtaBackdrop from "./cta-backdrop";

/**
 * Closing contact band (Figma 406:4474) — the approved footage behind a
 * brand-dark panel, driven by the Case Studies strings.
 */
export default function Cta() {
  const t = useTranslations("CaseStudiesPage");

  return (
    <section className="bg-white pb-16 lg:pb-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10 xl:px-20">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-ink p-10 lg:px-11 lg:py-[81px]"
          amount={0.25}
          duration={1.15}
        >
          <CtaBackdrop image="/assets/options/bg.jpg" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:items-center lg:flex-row">
            <div className="flex max-w-[989px] flex-col gap-3">
              {/* Figma heading/2xl/bold: Avenir Black (800). Arabic keeps its
                  current Tajawal weight pending the Arabic type decision. */}
              <h3 className="text-[28px] leading-9 font-black text-white lg:text-[36px] lg:leading-11">
                {t("cta.title")}
              </h3>
              <p className="text-[16px] leading-6 text-[#e3e3e3]">
                {t("cta.description")}
              </p>
            </div>
            <PillButton href={t("cta.button.href")}>
              {t("cta.button.label")}
            </PillButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
