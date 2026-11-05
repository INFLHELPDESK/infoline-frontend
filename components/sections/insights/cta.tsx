import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import BandVideoBackdrop from "@/components/ui/band-video-backdrop";

/**
 * Closing CTA — same ink banner pattern as the other pages ("Want the detail
 * behind the result?" → View Case Studies / Discuss Your Operation).
 */
export default function Cta() {
  const t = useTranslations("InsightsPage");

  return (
    <section className="pb-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10 xl:px-20">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-ink p-10 lg:px-11 lg:py-12"
          amount={0.25}
          duration={1.15}
        >
          <BandVideoBackdrop image="/assets/options/bg.jpg" />

          <div className="relative z-10 flex flex-col items-start gap-6">
            <div className="flex max-w-[1033px] flex-col gap-3">
              <h3 className="text-[28px] leading-9 font-extrabold text-white lg:text-[36px] lg:leading-11">
                {t("cta.title")}
              </h3>
              <p className="text-[16px] leading-6 text-slate-100">
                {t("cta.description")}
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Button
                href={t("cta.button.href")}
                size="md"
                variant="primary"
                icon={ArrowRight}
                iconPosition="right"
              >
                {t("cta.button.label")}
              </Button>
              <Button
                href={t("cta.secondaryButton.href")}
                size="md"
                variant="secondary"
                className="border-white bg-white !text-ink hover:border-white hover:bg-white/90"
              >
                {t("cta.secondaryButton.label")}
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
