import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import type { Insight, InsightsSource } from "@/lib/insights";

/**
 * Formats — "Executive articles, service explainers, benchmark notes…"
 * headline followed by the three article cards, reusing the exact home
 * Insights items (image, category, title, href) so the two stay in sync.
 */
const cardClass =
  "group flex h-full flex-col rounded-[20px] border border-[#e0e0e0] bg-white p-2 shadow-[0_12px_32px_rgba(90,103,126,0.08)]";

export default function Formats({
  insights,
  contentSource,
}: {
  insights: Insight[];
  contentSource?: InsightsSource;
}) {
  const t = useTranslations("InsightsPage");

  return (
    <section className="pt-4 pb-16" data-content-source={contentSource}>
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger as="div" stagger={0.12} amount={0.2}>
          <StaggerItem direction="start" className="mb-11">
            <Eyebrow className="mb-4 border border-slate-100">
              {t("formats.eyebrow")}
            </Eyebrow>
            <h2 className="max-w-[891px] text-[28px] leading-9 font-semibold lg:text-[36px] lg:leading-11 text-slate-900">
              {t("formats.title")}
            </h2>
          </StaggerItem>

          <Stagger
            as="div"
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
            stagger={0.13}
          >
            {insights.map((insight) => {
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
                  <div className="px-4 pt-4 pb-5">
                    <p className="text-[14px] leading-5 text-slate-500">
                      {insight.category}
                    </p>
                    <h3 className="mt-3 text-[16px] leading-6 font-bold text-slate-900">
                      {insight.title}
                    </h3>
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
