import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/blog";
import { SpotlightCard } from "@/components/ui/motion";

/**
 * Post card used in the "All updates" grid and the single page's
 * "Keep reading" row. White bordered card with an inset image, category and
 * date meta, two-line title and excerpt, and a "Read more" link.
 */
export default function PostCard({ post }: { post: BlogPost }) {
  const t = useTranslations("Blog.page");

  return (
    <SpotlightCard
      as="article"
      className="group h-full rounded-[20px] border border-[#e0e0e0] bg-white p-2 shadow-[0_12px_32px_rgba(90,103,126,0.08)] transition-shadow duration-500 hover:shadow-[0_22px_48px_-20px_rgba(13,22,27,0.18)]"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="flex h-full flex-col rounded-2xl focus-visible:outline-2 focus-visible:outline-brandblue-500"
      >
        <div className="relative aspect-[394/259] w-full overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={post.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 394px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
          />
        </div>
        <div className="flex flex-1 flex-col px-4 pt-4 pb-5">
          <p className="flex flex-wrap items-center gap-x-3 text-[14px] leading-5 text-slate-500">
            <span>{post.category}</span>
            <span aria-hidden className="h-3 w-px bg-slate-300" />
            <span>{post.dateLabel}</span>
          </p>
          <h3 className="mt-3 text-[16px] leading-6 font-bold text-slate-900">
            {post.title}
          </h3>
          <p className="mt-3 line-clamp-2 text-[14px] leading-5 text-slate-600">
            {post.excerpt}
          </p>
          <span className="mt-auto inline-flex w-fit items-center gap-2 pt-5 text-[14px] leading-5 font-medium text-brandblue-500 transition-colors duration-300 group-hover:text-brandblue-600">
            {t("readMore")}
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </span>
        </div>
      </Link>
    </SpotlightCard>
  );
}
