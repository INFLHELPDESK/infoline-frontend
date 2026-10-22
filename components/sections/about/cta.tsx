import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/button";
import { Reveal, Parallax } from "@/components/ui/motion";

/**
 * Closing CTA banner, built on the shared banner pattern (parallax photo behind a
 * brand-dark panel). Mirrors the Industries / Home banners for consistency.
 */
export default function Cta() {
  const t = useTranslations("AboutPage");

  return (
    <section className="bg-[#f2f5f7] py-16 lg:py-20">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-ink p-10 lg:px-11 lg:py-12"
          amount={0.25}
          duration={1.15}
        >
          <Parallax
            className="pointer-events-none absolute inset-x-0 -inset-y-[20%]"
            speed={0.12}
          >
            <Image
              src="/assets/options/bg.jpg"
              alt=""
              fill
              aria-hidden
              sizes="100vw"
              className="object-cover object-top-right"
              priority={false}
            />
          </Parallax>

          <div className="relative z-10 flex flex-col items-start gap-6">
            <div className="flex max-w-[927px] flex-col gap-3">
              <h3 className="text-[28px] leading-9 font-semibold text-white lg:text-[36px] lg:leading-11">
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
