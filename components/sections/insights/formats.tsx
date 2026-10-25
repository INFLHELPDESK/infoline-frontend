import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { ArrowRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import type { Insight, InsightsSource } from "@/lib/insights";

/**
 * Formats — "Executive articles, service explainers, benchmark notes…"
 * headline followed by the three article cards, reusing the exact home
 * Insights items (image, category, title, href) so the two stay in sync.
 */
const cardClass =
  "group flex h-full flex-col rounded-[20px] border border-[#e0e0e0] bg-white p-2 shadow-[0_12px_32px_rgba(90,103,126,0.08)]";

/** Localised publication date; empty for a missing or unparseable value. */
function formatCardDate(iso: string | undefined, fmt: Intl.DateTimeFormat): string {
  // A date-only value is read as local midnight so the day never shifts by time zone.
  const d = iso ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso) : null;
  return d && !Number.isNaN(d.getTime()) ? fmt.format(d) : "";
}

export default function Formats({
  insights,
  contentSource,
}: {
  insights: Insight[];
  contentSource?: InsightsSource;
}) {
  const t = useTranslations("InsightsPage");
  const readMore = useTranslations("Blog.page")("readMore");
  const locale = useLocale();
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const minutes = new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "minute",
    unitDisplay: "short",
  });

  return (
    <section className="pt-4 pb-16" data-content-source={contentSource}>
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger as="div" stagger={0.12} amount={0.2}>
          <StaggerItem
            direction="start"
            className="mb-11 flex flex-col items-start gap-6 md:flex-row md:items-start md:justify-between"
          >
            <div>
              <Eyebrow className="mb-4 border border-slate-100">
                {t("formats.eyebrow")}
              </Eyebrow>
              <h2 className="max-w-[891px] text-[28px] leading-9 font-semibold lg:text-[36px] lg:leading-11 text-slate-900">
                {t("formats.title")}
              </h2>
            </div>
            <Link
              href={t("formats.allCta.href")}
              className="group inline-flex h-11 flex-none items-center gap-2 rounded-lg bg-brandblue-50 px-5 text-[16px] leading-6 font-medium text-brandblue-600 transition-colors hover:bg-brandblue-100"
            >
              {t("formats.allCta.label")}
              <ArrowRight className="size-[18px] transition-transform duration-300 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </StaggerItem>

          {contentSource === "empty" ? (
            <p
              data-empty=""
              className="rounded-[20px] border border-[#e0e0e0] bg-white px-6 py-12 text-center text-[16px] leading-6 text-slate-600"
            >
              {t("formats.empty")}
            </p>
          ) : null}

          <Stagger
            as="div"
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
            stagger={0.13}
          >
            {insights.map((insight) => {
              const meta = [
                insight.category,
                insight.dateLabel ?? formatCardDate(insight.date, date),
                insight.readMinutes ? minutes.format(insight.readMinutes) : "",
              ].filter(Boolean);
              const card = (
                <>
                  <div className="relative aspect-[394/259] w-full overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={insight.image}
                      alt={insight.title}
                      width={430}
                      height={220}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-4 pt-4 pb-5">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] leading-5 text-slate-500">
                      {meta.map((part, i) => (
                        <span key={i} className="flex items-center gap-x-3">
                          {i > 0 && <span aria-hidden className="h-3 w-px bg-slate-300" />}
                          {part}
                        </span>
                      ))}
                    </p>
                    <h3 className="mt-3 text-[16px] leading-6 font-bold text-slate-900">
                      {insight.title}
                    </h3>
                    {insight.excerpt ? (
                      <p className="mt-3 line-clamp-2 text-[14px] leading-5 text-slate-600">
                        {insight.excerpt}
                      </p>
                    ) : null}
                    {insight.href ? (
                      <span className="mt-auto inline-flex w-fit items-center gap-2 pt-5 text-[14px] leading-5 font-medium text-brandblue-500 transition-colors duration-300 group-hover:text-brandblue-600">
                        {readMore}
                        <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                      </span>
                    ) : null}
                  </div>
                </>
              );
              return (
                <StaggerItem as="div" key={insight.title}>
                  {insight.href ? (
                    <Link href={insight.href} className={cardClass}>
                      {card}
                    </Link>
                  ) : (
                    <div className={cardClass} data-unlinked="">
                      {card}
                    </div>
                  )}
                </StaggerItem>
              );
            })}
          </Stagger>
        </Stagger>
      </div>
    </section>
  );
}
