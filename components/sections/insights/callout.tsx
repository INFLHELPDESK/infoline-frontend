import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/motion";
import Image from "next/image";

/**
 * Result callout — the pale card with the big sky-blue circle bleeding in
 * from the left (clip on the card, so the circle crops at its edge) and the
 * "what results" paragraph right of it.
 */
export default function Callout() {
  const t = useTranslations("InsightsPage");

  return (
    <section className="pt-20 lg:pt-26">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="flex items-center flex-col lg:flex-row lg:gap-15 gap-10 overflow-hidden rounded-2xl bg-brandblue-50 px-7 py-10 lg:px-12 lg:py-14"
          amount={0.3}
          duration={1.1}
        >
          {/* Sky-blue circle — bleeds in from the inline-start edge */}
          <Image
            src="/assets/insights/callout.svg"
            width={380}
            height={380}
            alt={t("calloutImageAlt")}
          />

          <div className="relative">
            <h2 className="heading-xl-bold mb-4 max-w-[24ch] text-slate-900">
              {t("callout.title")}
            </h2>
            <p className="body-md-regular max-w-[85ch] text-slate-900">
              {t("callout.description")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
