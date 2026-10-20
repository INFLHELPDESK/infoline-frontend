import { useTranslations } from "next-intl";
import Image from "next/image";
import { PillButton } from "@/components/sections/home-1/shared";
import { Reveal, Parallax } from "@/components/ui/motion";

/**
 * Closing CTA banner — the shared site-wide banner pattern (smoke photo
 * parallax behind a brand-dark panel), driven by the Case Studies strings.
 */
export default function Cta() {
  const t = useTranslations("CaseStudiesPage");

  return (
    <section className="bg-white pb-16 lg:pb-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-ink p-10 lg:px-11 lg:py-[81px]"
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

          <div className="relative z-10 flex flex-col justify-between gap-6 md:items-center lg:flex-row">
            <div className="flex max-w-[989px] flex-col gap-3">
              <h3 className="text-[28px] leading-9 font-semibold text-white lg:text-[36px] lg:leading-11">
                {t("cta.title")}
              </h3>
              <p className="text-[16px] leading-6 text-slate-100">
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
