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
    <section className="pt-16 pb-12">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative flex flex-col items-center gap-8 overflow-hidden rounded-2xl bg-[#eef5fa] px-7 py-10 lg:min-h-[252px] lg:flex-row lg:gap-0 lg:px-0 lg:py-0"
          amount={0.3}
          duration={1.1}
        >
          {/* Sky-blue circle — bleeds in from the inline-start edge */}
          <Image
            src="/assets/insights/callout.svg"
            width={380}
            height={380}
            alt={t("calloutImageAlt")}
            className="h-auto w-[300px] lg:absolute lg:start-8 lg:top-1/2 lg:w-[345px] lg:-translate-y-1/2"
          />

          <div className="relative lg:ps-[420px] lg:pe-10">
            <h2 className="mb-4 max-w-[617px] text-[28px] leading-9 font-bold text-slate-900 lg:text-[36px] lg:leading-11">
              {t("callout.title")}
            </h2>
            <p className="max-w-[799px] text-[16px] leading-6 text-slate-700">
              {t("callout.description")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
