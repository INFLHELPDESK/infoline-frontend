import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
    <section className="bg-slate-50 py-20 lg:py-26">
      <div className="mx-auto w-full flex justify-between gap-10 flex-col lg:flex-row items-center max-w-360 px-6 lg:px-10">
        <Stagger as="div" stagger={0.12} amount={0.2}>
          <StaggerItem direction="start" className="mb-11">
            <p className="overline-sm-medium mb-sm text-brandblue-400">
              {t("featured.eyebrow")}
            </p>
            <h2 className="heading-lg-bold text-slate-900">
              {t("featured.title")}
            </h2>
          </StaggerItem>

          <ul>
            {rows.map((row) => (
              <StaggerItem
                key={row.to}
                as="li"
                className="flex flex-col justify-between gap-4 border-b border-slate-200 py-7 last:border-b-0 md:flex-row md:items-center md:gap-2xl"
              >
                <p className="body-md-regular max-w-[62ch] text-slate-700">
                  {row.description}
                </p>
                <p className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[13px] text-slate-400">
                    {row.from}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-4 text-brandblue-500 rtl:rotate-180"
                  />
                  <CountUp
                    value={row.to}
                    className="text-[34px] font-bold leading-none tracking-[-.02em] text-brandblue-500"
                  />
                </p>
              </StaggerItem>
            ))}
          </ul>
        </Stagger>
        <Image
          src="/assets/insights/insights.svg"
          alt={t("featuredImageAlt")}
          height={600}
          width={500}
          className="object-cover"
        />
      </div>
    </section>
  );
}
