import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Stagger, StaggerItem, MaskText } from "@/components/ui/motion";
import type { BlogPost } from "@/lib/blog";
import ShareLinks from "./share-links";

type SocialLink = { label: string; network: string };

/**
 * Single-post header — light band: back arrow, headline, excerpt, then the
 * category pill + date meta on the start side and the share buttons on the
 * end side (Figma › article).
 */
export default function Hero({ post }: { post: BlogPost }) {
  const t = useTranslations("Blog.page");
  const socials = useTranslations("Footer").raw("socials") as SocialLink[];

  return (
    <section className="bg-slate-25 pt-28 pb-10 lg:pt-[119px] lg:pb-14">
      <div className="mx-auto w-full max-w-[1062px] px-6 lg:px-0">
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
              aria-label={t("single.backLabel")}
              className="group inline-flex size-6 items-center justify-center text-slate-900 transition-colors hover:text-brandblue-500"
            >
              <ArrowLeft className="size-6 transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
            </Link>
          </StaggerItem>

          <MaskText
            as="h1"
            className="mt-6 max-w-[1062px] text-[32px] font-bold leading-10 text-slate-900 lg:text-[40px] lg:leading-12"
            segments={[{ text: post.title }]}
            orchestrated
            stagger={0.06}
            duration={0.9}
          />

          <StaggerItem
            as="p"
            className="mt-5 max-w-[755px] text-[14px] leading-5 text-slate-600 lg:text-[16px] lg:leading-5"
            distance={24}
          >
            {post.excerpt}
          </StaggerItem>

          <StaggerItem
            className="mt-6 flex w-full flex-wrap items-center justify-between gap-4"
            distance={24}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-7 items-center rounded-full border border-[#abd7ed] bg-[#ecf4f9] px-3 text-[12px] leading-4 text-brandblue-600">
                {post.category}
              </span>
              <span className="text-[13px] leading-5 text-slate-500">
                {post.dateLabel}
              </span>
            </div>
            <ShareLinks
              title={post.title}
              shareLabel={t("single.shareLabel")}
              networks={socials}
            />
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
