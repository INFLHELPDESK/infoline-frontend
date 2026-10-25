import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { Stagger, StaggerItem, MaskText } from "@/components/ui/motion";
import type { BlogPost, PostEvent } from "@/lib/blog";
import ShareLinks from "./share-links";

/** Localised event date or range from the CMS strings; empty when none parses. */
function eventWhen(event: PostEvent, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const parse = (v: string | null) => {
    const d = v ? new Date(v) : null;
    return d && !Number.isNaN(d.getTime()) ? fmt.format(d) : "";
  };
  const start = parse(event.start);
  const end = parse(event.end);
  return start && end && start !== end ? `${start} – ${end}` : start || end;
}

type SocialLink = { label: string; network: string };

/**
 * Single-post header — light band: back arrow, headline, excerpt, then the
 * category pill + date meta on the start side and the share buttons on the
 * end side (Figma › article).
 */
export default function Hero({
  post,
  backHref = "/blog",
  readMinutes,
  event,
}: {
  post: BlogPost;
  /** Where the back arrow goes: the Blog unless the Insight is not an article. */
  backHref?: string;
  /** Whole minutes to read (CMS Insights only). */
  readMinutes?: number;
  /** Event Insights only; each field is independently optional. */
  event?: PostEvent | null;
}) {
  const t = useTranslations("Blog.page");
  const locale = useLocale();
  const minutes = readMinutes
    ? new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay: "short" }).format(readMinutes)
    : "";
  const when = event ? eventWhen(event, locale) : "";
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
              href={backHref}
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

          {event && (when || event.location || event.url) && (
            <StaggerItem className="mt-5" distance={24}>
              <ul
                data-event-details=""
                className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] leading-5 text-slate-700"
              >
                {when && (
                  <li className="flex items-center gap-2">
                    <CalendarDays aria-hidden className="size-4 text-brandblue-600" />
                    <span className="sr-only">{t("single.eventWhen")}: </span>
                    {when}
                  </li>
                )}
                {event.location && (
                  <li className="flex items-center gap-2">
                    <MapPin aria-hidden className="size-4 text-brandblue-600" />
                    <span className="sr-only">{t("single.eventWhere")}: </span>
                    {event.location}
                  </li>
                )}
                {event.url && (
                  <li>
                    <a
                      href={event.url}
                      {...(/^https?:/i.test(event.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="font-medium text-brandblue-600 underline underline-offset-2 hover:text-brandblue-500"
                    >
                      {t("single.eventRegister")}
                    </a>
                  </li>
                )}
              </ul>
            </StaggerItem>
          )}

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
              {minutes && <span className="text-[13px] leading-5 text-slate-500">{minutes}</span>}
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
