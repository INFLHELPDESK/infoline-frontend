import { useTranslations } from "next-intl";
import { MaskText, Reveal } from "@/components/ui/motion";
import Image from "next/image";

/**
 * Result callout — the pale card with a sky-blue circle bleeding in from the
 * inline-start edge and the person (transparent PNG) standing over it, head
 * cropped by the card top, per the Figma frame. The circle is plain CSS so it
 * stays a true curve at every size; the card clips both shapes. Below `lg` the
 * artwork stacks above the copy.
 */
export default function Callout() {
  const t = useTranslations("InsightsPage");

  return (
    <section className="pt-16 pb-12">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative flex flex-col items-center gap-8 overflow-hidden rounded-2xl bg-[#eef5fa] px-7 pb-10 lg:min-h-[268px] lg:flex-row lg:gap-0 lg:px-0 lg:pb-0"
          amount={0.3}
          duration={1.1}
        >
          {/* Artwork — `lg:contents` lets the shapes position against the card */}
          <div className="relative h-[280px] w-full overflow-hidden lg:contents">
            <div
              aria-hidden
              className="absolute start-1/2 top-1/2 -ms-[150px] -mt-[150px] size-[300px] rounded-full bg-[#74c0e7] lg:start-[-140px] lg:top-[-145px] lg:ms-0 lg:mt-0 lg:size-[542px]"
            />
            <Image
              src="/assets/insights/callout-person.png"
              width={843}
              height={1178}
              alt={t("calloutImageAlt")}
              sizes="(min-width: 1024px) 370px, 190px"
              className="absolute start-1/2 top-3 -ms-[95px] h-auto w-[190px] lg:start-[51px] lg:-top-[97px] lg:ms-0 lg:w-[370px]"
            />
          </div>

          <div className="relative lg:ps-[467px] lg:pe-10">
            <MaskText
              as="h2"
              className="mb-4 max-w-[617px] text-[28px] leading-9 font-semibold text-slate-900 lg:text-[36px] lg:leading-11"
              segments={[
                { text: t("callout.titleLead") },
                { text: t("callout.titleAccent"), className: "text-brandblue-500" },
                { text: t("callout.titleTail") },
              ]}
              amount={0.5}
              duration={0.85}
            />
            <p className="max-w-[799px] text-[16px] leading-6 text-slate-700">
              {t("callout.description")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
