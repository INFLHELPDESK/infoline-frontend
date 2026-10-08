import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Stagger, StaggerItem, MaskText } from "@/components/ui/motion";
import type { BlogPost } from "@/lib/blog";

/**
 * Single-post hero — ink band with the back link, category + date meta,
 * and the headline.
 */
export default function Hero({ post }: { post: BlogPost }) {
  const t = useTranslations("Blog.page");

  return (
    <section className="bg-ink">
      <div className="mx-auto w-full max-w-360 px-6 pb-16 pt-28 lg:px-10 lg:pb-24 lg:pt-44">
        <Stagger
          as="div"
          className="flex flex-col items-start"
          stagger={0.12}
          delayChildren={0.05}
          amount={0.3}
        >
          <StaggerItem distance={28}>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
              {t("single.backLabel")}
            </Link>
          </StaggerItem>

          <StaggerItem
            className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2"
            distance={28}
          >
            <span className="rounded-full bg-white/10 px-3.5 py-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-brandblue-300">
              {post.category}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
              {post.dateLabel}
            </span>
          </StaggerItem>

          <MaskText
            as="h1"
            className="mt-6 max-w-[22ch] text-[36px] font-bold leading-[1.1] tracking-[-.025em] text-white lg:text-[48px]"
            segments={[{ text: post.title }]}
            orchestrated
            stagger={0.06}
            duration={0.9}
          />
        </Stagger>
      </div>
    </section>
  );
}
