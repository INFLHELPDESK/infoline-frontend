import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import PartnerCtaVideo from "./partner-cta-video";

/**
 * Partner call-to-action banner: a <Reveal>-wrapped panel with a looping
 * background video (static image fallback, see PartnerCtaVideo) and a CTA button.
 */
export default function PartnerCta() {
  const t = useTranslations("SolutionsPage");
  const showSecondary = t.raw("partner.secondaryCta.show") === true;

  return (
    <section className="bg-white pb-6xl">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-ink p-10 lg:px-11 lg:py-9"
          amount={0.25}
          duration={1.15}
        >
          <PartnerCtaVideo />

          <div className="relative z-10 flex flex-col items-start gap-6">
            <div className="flex max-w-[688px] flex-col gap-3">
              <h3 className="text-[28px] leading-9 font-semibold text-white lg:text-[36px] lg:leading-11">
                {t("partner.title")}
              </h3>
              <p className="text-[16px] leading-6 text-slate-100">
                {t("partner.description")}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button
                href={t("partner.cta.href")}
                size="md"
                variant="primary"
                icon={ArrowRight}
                iconPosition="right"
              >
                {t("partner.cta.label")}
              </Button>
              {/* Pending integration: no confirmed destination yet, so it renders
                  as a disabled button rather than a placeholder link. The Arabic
                  label is awaiting client approval: the ar `show` flag stays
                  false (its label is an English placeholder, never rendered). */}
              {showSecondary && (
                <Button
                  size="md"
                  variant="secondary"
                  disabled
                  className="cursor-not-allowed opacity-60 hover:border-white/18 hover:bg-transparent"
                >
                  {t("partner.secondaryCta.label")}
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
