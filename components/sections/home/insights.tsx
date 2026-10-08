"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";
import { usePosts } from "@/lib/wp";
import { toInsight } from "@/lib/content-adapters";

type Insight = {
  category: string;
  title: string;
  image: string;
  href: string;
};

export default function Insights() {
  const t = useTranslations("Insights");
  // Designed items from the locale files — graceful fallback while the CMS
  // query loads or when it has no posts.
  const fallback = t.raw("items") as Insight[];

  // Latest posts from the CMS (WP `posts`, locale-aware); home teaser shows 3.
  const { data: posts } = usePosts();
  const insights = useMemo(() => {
    const fromCms = (posts ?? []).map(toInsight);
    return fromCms.length > 0 ? fromCms.slice(0, 3) : fallback;
  }, [posts, fallback]);

  return (
    <section className="insights flex items-center justify-center py-20 lg:py-26">
      <div className="px-6 lg:px-10 max-w-360">
        <Stagger
          as="div"
          className="flex flex-col lg:flex-row items-start justify-between gap-lg"
          stagger={0.15}
        >
          <StaggerItem direction="start">
            <p className="overline-sm-medium text-slate-300 mb-sm">
              {t("eyebrow")}
            </p>
            <MaskText
              as="h2"
              className="heading-xl-bold text-[48px] text-white"
              segments={[{ text: t("title") }]}
              amount={0.5}
              duration={0.8}
            />
          </StaggerItem>
          <StaggerItem direction="end">
            <Link
              href="/blog"
              className="group overline-sm-medium uppercase text-brandblue-500 hover:text-brandblue-300 transition-colors whitespace-nowrap flex items-center gap-xs"
            >
              {t("allCta.label")}
              <ArrowRight className="size-4 rtl:rotate-180 transition-transform duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </StaggerItem>
        </Stagger>

        <Stagger
          as="div"
          className="mt-11 grid grid-cols-1 md:grid-cols-3 gap-2xl"
          stagger={0.13}
        >
          {insights.map((insight) => (
            <StaggerItem as="div" key={insight.title}>
              <Link
                href={insight.href}
                className="group flex flex-col max-h-[315px]"
              >
                <div className="relative aspect-[16/11] w-full overflow-hidden rounded-lg bg-slate-800">
                  <Image
                    src={insight.image}
                    alt={insight.title}
                    width={430}
                    height={220}
                    className="object-cover h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="overline-xs-medium mt-3 text-slate-300 mt-lg mb-xs">
                  {insight.category}
                </p>
                <h3 className="body-lg-semibold  text-white leading-snug">
                  {insight.title}
                </h3>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
