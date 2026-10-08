import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import type { Insight } from "@/lib/insights";

/**
 * Formats — "Executive articles, service explainers, benchmark notes…"
 * headline followed by the three article cards, reusing the exact home
 * Insights items (image, category, title, href) so the two stay in sync.
 */
export default function Formats({ insights }: { insights: Insight[] }) {
  const t = useTranslations("InsightsPage");

  return (
    <section className="pb-20 lg:pb-26">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger as="div" stagger={0.12} amount={0.2}>
          <StaggerItem direction="start" className="mb-11">
            <p className="overline-sm-medium mb-sm text-brandblue-400">
              {t("formats.eyebrow")}
            </p>
            <h2 className="heading-xl-bold max-w-[40ch] text-slate-900">
              {t("formats.title")}
            </h2>
          </StaggerItem>

          <Stagger
            as="div"
            className="grid grid-cols-1 gap-2xl md:grid-cols-3"
            stagger={0.13}
          >
            {insights.map((insight) => (
              <StaggerItem as="div" key={insight.title}>
                <Link href={insight.href} className="group flex flex-col">
                  <div className="relative aspect-[16/11] w-full overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={insight.image}
                      alt={insight.title}
                      width={430}
                      height={220}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="overline-xs-medium mt-lg mb-xs text-slate-500">
                    {insight.category}
                  </p>
                  <h3 className="body-lg-semibold leading-snug text-slate-900">
                    {insight.title}
                  </h3>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Stagger>
      </div>
    </section>
  );
}
