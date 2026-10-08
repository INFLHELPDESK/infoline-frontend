"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import type { BlogPost } from "@/lib/blog";

/**
 * Featured story — wide white card, image left / content right, with the
 * [ARTICLE] pill, date and category meta line from the design.
 */
export default function Featured({ post }: { post: BlogPost }) {
  const t = useTranslations("Blog.page");

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="p"
          className="overline-sm-medium mb-6 text-slate-500"
          amount={0.4}
        >
          {t("featuredLabel")}
        </Reveal>

        <Reveal amount={0.2} duration={1.1}>
          <article className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(13,22,27,0.05)] transition-shadow duration-500 hover:shadow-[0_22px_48px_-20px_rgba(13,22,27,0.18)]">
            <Link
              href={`/blog/${post.slug}`}
              className="grid focus-visible:outline-2 focus-visible:outline-brandblue-500 md:grid-cols-[minmax(0,42%)_1fr]"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 md:aspect-auto md:min-h-[300px]">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 42vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center p-7 lg:p-11">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="rounded-full bg-brandblue-50 px-3.5 py-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-brandblue-700">
                    {post.category}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
                    {post.dateLabel}
                  </span>
                </div>
                <h2 className="mt-4 max-w-[26ch] text-[26px] font-bold leading-[1.15] tracking-[-.02em] text-ink lg:text-[30px]">
                  {post.title}
                </h2>
                <p className="body-md-regular mt-3.5 max-w-[64ch] text-slate-600">
                  {post.excerpt}
                </p>
                <span className="mt-7 inline-flex w-fit items-center gap-2.5 rounded-md border border-slate-300 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-300 group-hover:border-brandblue-500 group-hover:text-brandblue-700">
                  {t("readMore")}
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </span>
              </div>
            </Link>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
