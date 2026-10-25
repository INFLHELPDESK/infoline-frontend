"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import type { BlogPost } from "@/lib/blog";

/**
 * Featured story — wide white card, image left / content right, with the
 * category pill and date meta line from the design.
 */
export default function Featured({ post }: { post: BlogPost }) {
  const t = useTranslations("Blog.page");

  return (
    <section className="bg-white pt-14 lg:pt-[60px]">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="p"
          className="mb-6 text-[28px] leading-9 font-semibold text-slate-900 lg:text-[32px] lg:leading-10"
          amount={0.4}
        >
          {t("featuredLabel")}
        </Reveal>

        <Reveal amount={0.2} duration={1.1}>
          <article className="group rounded-3xl border border-[#e0e0e0] bg-white p-2 shadow-[0_6px_13px_rgba(0,0,0,0.03),0_24px_24px_rgba(0,0,0,0.02)] transition-shadow duration-500 hover:shadow-[0_22px_48px_-20px_rgba(13,22,27,0.18)]">
            <Link
              href={post.href ?? `/blog/${post.slug}`}
              className="grid rounded-2xl focus-visible:outline-2 focus-visible:outline-brandblue-500 md:grid-cols-[minmax(0,470px)_1fr]"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100 md:aspect-auto md:min-h-[266px] md:rounded-e-none">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 470px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-between gap-6 px-4 py-6 md:px-6 md:py-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex h-7 items-center rounded-full bg-[#ecf4f9] px-3 text-[12px] leading-4 text-brandblue-600">
                      {post.category}
                    </span>
                    <span className="text-[13px] leading-5 text-slate-500">
                      {post.dateLabel}
                    </span>
                  </div>
                  <h2 className="max-w-[712px] text-[26px] leading-9 font-bold text-slate-900 lg:text-[32px] lg:leading-10">
                    {post.title}
                  </h2>
                  <p className="max-w-[712px] text-[13px] leading-5 text-slate-600">
                    {post.excerpt}
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 text-[14px] leading-5 font-medium text-brandblue-500 transition-colors duration-300 group-hover:text-brandblue-600">
                  {t("readMore")}
                  <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </span>
              </div>
            </Link>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
