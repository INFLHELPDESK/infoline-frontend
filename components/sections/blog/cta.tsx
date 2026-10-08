import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";

/**
 * Closing CTA — rounded ink band with the grey wave photo, "Let's move your
 * number" headline and the light-blue Talk-to-an-expert button.
 */
export default function Cta() {
  const t = useTranslations("Blog.page");

  return (
    <section className="bg-white pb-24 lg:pb-32">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative isolate overflow-hidden rounded-2xl bg-ink"
          amount={0.25}
          duration={1.15}
        >
          <Image
            src="/assets/options/bg.jpg"
            alt=""
            fill
            aria-hidden
            className="object-cover object-top-right"
            priority={false}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-ink/20"
          />

          <div className="relative z-10 flex flex-col justify-between gap-8 px-8 py-10 md:flex-row md:items-center lg:px-11 lg:py-12">
            <div>
              <h2 className="max-w-[22ch] text-[30px] font-bold leading-[1.1] tracking-[-.02em] text-white lg:text-[36px]">
                {t("cta.title")}
              </h2>
              <p className="mt-3 text-[14px] text-slate-200">
                {t("cta.description")}
              </p>
            </div>
            <Button
              href={t("cta.button.href")}
              size="small"
              icon={ArrowRight}
              iconPosition="right"
              className="shrink-0 bg-brandblue-400 hover:bg-brandblue-500"
            >
              {t("cta.button.label")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
