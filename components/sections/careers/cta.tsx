import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import BandVideoBackdrop from "@/components/ui/band-video-backdrop";

/**
 * Closing CTA — the shared site-wide banner pattern (smoke photo parallax
 * behind a brand-dark panel): "Don't see your fit?" → general application.
 */
export default function Cta() {
  const t = useTranslations("CareersPage");

  return (
    <section className="bg-brandblue-900/[0.04] pt-16 pb-24 lg:pt-12 lg:pb-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-ink p-10 lg:px-11 lg:py-[69px]"
          amount={0.25}
          duration={1.15}
        >
          <BandVideoBackdrop image="/assets/options/bg.jpg" />

          <div className="relative z-10 flex flex-col justify-between gap-xl md:items-center lg:flex-row">
            <div className="flex max-w-[688px] flex-col gap-3">
              <h3 className="text-[28px] leading-9 font-black text-white lg:text-[36px] lg:leading-11">
                {t("cta.title")}
              </h3>
              <p className="text-[16px] leading-6 text-slate-100">
                {t("cta.description")}
              </p>
            </div>
            <Button
              href={t("cta.button.href")}
              size="md"
              variant="primary"
              icon={ArrowRight}
              iconPosition="right"
            >
              {t("cta.button.label")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
