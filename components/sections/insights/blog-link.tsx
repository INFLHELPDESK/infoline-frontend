import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Entry point from Insights to the Blog listing, placed under the article
 * cards. Kept out of `Formats` so the cards stay the only links in that grid.
 */
export default function BlogLink() {
  const t = useTranslations("InsightsPage");

  return (
    <div className="mx-auto w-full max-w-360 -mt-8 px-6 pb-16 lg:px-10">
      <Link
        href={t("formats.allCta.href")}
        className="group inline-flex items-center gap-1.5 text-[14px] leading-5 font-medium text-brandblue-500 hover:underline"
      >
        {t("formats.allCta.label")}
        <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
