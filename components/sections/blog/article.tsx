import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { type BlogPost } from "@/lib/blog";

/**
 * Article layout — headline image, prose column with the grey "About
 * Infoline" rail card, then the "Keep reading" row of next posts.
 */
export default function Article({
  post,
  morePosts,
}: {
  post: BlogPost;
  morePosts: BlogPost[];
}) {
  const t = useTranslations("Blog.page");

  return (
    <section className="bg-white pb-20 lg:pb-28">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        {/* Headline image */}
        <Reveal amount={0.1}>
          <div className="relative -mt-2 aspect-[16/8] w-full overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={post.image}
              alt=""
              fill
              priority
              sizes="(min-width: 1440px) 1336px, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20">
          {/* Prose */}
          <Stagger as="div" stagger={0.05} amount={0.08}>
            {post.body.map((paragraph, i) => (
              <StaggerItem
                as="p"
                key={i}
                className={`text-[16px] leading-[30px] text-slate-700 ${i === 0 ? "text-[19px] leading-[32px] text-ink" : "mt-7"}`}
              >
                {paragraph}
              </StaggerItem>
            ))}
          </Stagger>

          {/* About rail */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <Reveal
              as="div"
              className="rounded-2xl bg-slate-50 p-7"
              amount={0.3}
            >
              <p className="overline-xs-medium text-slate-500">
                {t("single.aboutTitle")}
              </p>
              <p className="body-sm-regular mt-4 text-slate-600">
                {t("single.aboutDescription")}
              </p>
              <Link
                href={t("single.aboutCta.href")}
                className="mt-6 inline-flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-brandblue-700 transition-colors hover:text-brandblue-500"
              >
                {t("single.aboutCta.label")}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Link>
            </Reveal>
          </aside>
        </div>

        {/* Keep reading */}
        {morePosts.length > 0 && (
          <div className="mt-24 lg:mt-32">
            <h2 className="mb-9 text-[32px] font-bold tracking-[-.02em] text-ink">
              {t("single.moreLabel")}
            </h2>
            <Stagger
              as="div"
              className="grid grid-cols-1 gap-7 md:grid-cols-2"
              stagger={0.12}
            >
              {morePosts.map((p) => (
                <StaggerItem as="div" key={p.slug}>
                  <MoreCard post={p} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}
      </div>
    </section>
  );
}

function MoreCard({ post }: { post: BlogPost }) {
  const t = useTranslations("Blog.page");

  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(13,22,27,0.05)] transition-shadow duration-500 hover:shadow-[0_22px_48px_-20px_rgba(13,22,27,0.18)]">
      <Link
        href={`/blog/${post.slug}`}
        className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-brandblue-500"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
          <Image
            src={post.image}
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col p-6 lg:p-7">
          <p className="overline-xs-medium text-slate-500">{post.category}</p>
          <h3 className="body-lg-semibold mt-2.5 leading-snug text-slate-900">
            {post.title}
          </h3>
          <span className="mt-6 inline-flex w-fit items-center gap-2.5 rounded-md border border-slate-300 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-300 group-hover:border-brandblue-500 group-hover:text-brandblue-700">
            {t("readMore")}
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </span>
        </div>
      </Link>
    </article>
  );
}
