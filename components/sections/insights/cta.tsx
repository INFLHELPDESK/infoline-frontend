import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";

/**
 * Closing CTA — same ink banner pattern as the other pages ("Want the detail
 * behind the result?" → Talk to an expert).
 */
export default function Cta() {
  const t = useTranslations("InsightsPage");

  return (
    <section className="pb-24 lg:pb-28">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-ink p-10 lg:px-11 lg:py-15"
          amount={0.25}
          duration={1.15}
        >
          <div className="relative z-10 flex flex-col justify-between gap-xl md:items-center lg:flex-row">
            <div>
              <h3 className="heading-xl-bold mb-4 max-w-[26ch] text-white lg:text-[36px]">
                {t("cta.title")}
              </h3>
              <p className="body-lg-regular max-w-[54ch] text-brandblue-100">
                {t("cta.description")}
              </p>
            </div>
            <Button href={t("cta.button.href")} size="small" variant="primary">
              {t("cta.button.label")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
