import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { CountUp, Stagger, StaggerItem } from "@/components/ui/motion";

type FeaturedRow = {
  description: string;
  from: string;
  to: string;
};

/**
 * Featured proof — full-width smoke band with three before → after rows:
 * description left, muted "from" value, arrow, then the counted-up brand-blue
 * "to" figure right (81.8% → 88.8%, 68% → 94%, 6 → 1).
 */
export default function FeaturedProof() {
  const t = useTranslations("InsightsPage");
  const rows = t.raw("featured.rows") as FeaturedRow[];

  return (
    <section className="pb-16">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
       <div className="relative flex flex-col gap-8 overflow-hidden rounded-2xl bg-[#eef5fa] px-6 py-10 lg:min-h-[473px] lg:px-10 lg:py-14">
        <Stagger as="div" className="lg:max-w-[716px]" stagger={0.12} amount={0.2}>
          <StaggerItem direction="start" className="mb-10">
            <Eyebrow className="mb-4">{t("featured.eyebrow")}</Eyebrow>
            <h2 className="text-[28px] leading-9 font-semibold lg:text-[36px] lg:leading-11 text-slate-900">
              {t("featured.title")}
            </h2>
          </StaggerItem>

          <ul>
            {rows.map((row) => (
              <StaggerItem
                key={row.to}
                as="li"
                className="flex flex-col justify-between gap-4 border-t border-[#cfd8dc] py-5 md:flex-row md:items-center md:gap-2xl"
              >
                <p className="max-w-[501px] text-[14px] leading-5 text-slate-700">
                  {row.description}
                </p>
                <p className="flex shrink-0 items-center gap-3">
                  <span className="text-[14px] leading-4 text-slate-500 [direction:ltr]">
                    {row.from}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-[18px] text-slate-500 rtl:rotate-180"
                  />
                  <CountUp
                    value={row.to}
                    className="text-[32px] leading-11 font-bold text-brandblue-500 [direction:ltr] lg:text-[36px]"
                  />
                </p>
              </StaggerItem>
            ))}
          </ul>
        </Stagger>
        <div className="relative mx-auto aspect-[604/473] w-full max-w-[420px] lg:absolute lg:bottom-0 lg:end-0 lg:mx-0 lg:h-[473px] lg:w-[604px] lg:max-w-[604px]">
          <Image
            src="/assets/insights/insights.svg"
            alt={t("featuredImageAlt")}
            fill
            sizes="(min-width: 1024px) 604px, 420px"
            className="object-cover"
          />
        </div>
       </div>
      </div>
    </section>
  );
}
