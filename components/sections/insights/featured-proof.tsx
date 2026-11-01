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
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10 xl:px-20">
       {/* Side by side from xl only (stacked below). Per Figma 406:4941 the list
           is at most 716px and keeps a 40px gap before the image, in both
           directions; the image box takes the rest (min 380px) and crops the
           artwork (empty margin first, never mirrored) instead of sliding under
           the figures. `cqw` = card content width. */}
       <div className="@container relative flex flex-col gap-8 overflow-hidden rounded-2xl bg-[#eef5fa] px-6 py-10 [--fp-img:max(380px,calc(100cqw_-_716px))] lg:px-10 lg:py-14 xl:min-h-[473px]">
        <Stagger as="div" className="xl:max-w-[min(716px,calc(100cqw_-_var(--fp-img)))]" stagger={0.12} amount={0.2}>
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
        <div className="relative mx-auto aspect-[604/473] w-full max-w-[420px] xl:absolute xl:bottom-0 xl:end-0 xl:mx-0 xl:aspect-auto xl:h-[473px] xl:w-(--fp-img) xl:max-w-[none]">
          <Image
            src="/assets/insights/insights.svg"
            alt={t("featuredImageAlt")}
            fill
            sizes="(min-width: 1280px) 484px, 420px"
            className="object-cover object-[40%_center]"
          />
        </div>
       </div>
      </div>
    </section>
  );
}
