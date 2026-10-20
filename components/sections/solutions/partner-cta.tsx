import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/button";
import { Reveal, Parallax } from "@/components/ui/motion";

/**
 * Partner call-to-action banner. Reuses the home "Options" banner pattern:
 * a <Reveal>-wrapped brandblue panel with a parallax background image and a
 * white CTA button.
 */
export default function PartnerCta() {
  const t = useTranslations("SolutionsPage");

  return (
    <section className="bg-white pb-6xl">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-ink p-10 lg:px-11 lg:py-9"
          amount={0.25}
          duration={1.15}
        >
          {/* Background image — drifts on scroll (desktop only), oversized so the
              parallax translation never exposes an edge. */}
          <Parallax
            className="pointer-events-none absolute inset-x-0 -inset-y-[20%]"
            speed={0.12}
          >
            <Image
              src="/assets/options/bg.jpg"
              alt=""
              fill
              aria-hidden
              className="object-cover object-top-right"
              priority={false}
            />
          </Parallax>

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
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
