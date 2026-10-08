import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/blog";
import { SpotlightCard } from "@/components/ui/motion";

/**
 * Post card used in the "All updates" grid and the single page's
 * "Keep reading" row. White card, image top, category overline,
 * two-line clamped excerpt and the outlined Read-more chip.
 */
export default function PostCard({ post }: { post: BlogPost }) {
  const t = useTranslations("Blog.page");

  return (
    <SpotlightCard
      as="article"
      className="group h-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(13,22,27,0.05)] transition-shadow duration-500 hover:shadow-[0_22px_48px_-20px_rgba(13,22,27,0.18)]"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-brandblue-500"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <Image
            src={post.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
          />
        </div>
        <div className="flex flex-1 flex-col p-6 lg:p-7">
          <p className="overline-xs-medium text-slate-500">{post.category}</p>
          <h3 className="body-lg-semibold mt-2.5 leading-snug text-slate-900">
            {post.title}
          </h3>
          <p className="body-sm-regular mt-2.5 line-clamp-2 text-slate-600">
            {post.excerpt}
          </p>
          <span className="mt-6 inline-flex w-fit items-center gap-2.5 rounded-md border border-slate-300 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-300 group-hover:border-brandblue-500 group-hover:text-brandblue-700">
            {t("readMore")}
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </span>
        </div>
      </Link>
    </SpotlightCard>
  );
}
