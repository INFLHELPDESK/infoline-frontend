"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useForceLightHeader } from "@/components/layout/header/theme";
import ErrorPage, {
  errorButtonClass,
  errorPillClass,
} from "@/components/sections/error/error-page";

/**
 * Locale-level error boundary (500). It renders inside the locale layout, so
 * header and footer stay. "Try again" calls Next's `reset()` (re-renders the
 * segment); the digest, when the framework provides one, is shown as a
 * reference line support can ask for.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPages.500");
  useForceLightHeader();

  return (
    <ErrorPage
      status="500"
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      help={{
        title: t("help.title"),
        text: t("help.text"),
        action: (
          <Link href={t("help.link.href")} className={errorPillClass}>
            {t("help.link.label")}
          </Link>
        ),
      }}
      reference={
        error.digest ? (
          <p className="mt-4 text-[13px] leading-5 text-slate-500">
            {t("referenceLabel")}:{" "}
            <code dir="ltr" className="font-mono text-slate-700">
              {error.digest}
            </code>
          </p>
        ) : undefined
      }
      actions={
        <>
          <button
            type="button"
            onClick={reset}
            className={errorButtonClass.primary}
          >
            {t("primary.label")}
            <ArrowRight className="size-5 rtl:rotate-180" />
          </button>
          <Link href={t("secondary.href")} className={errorButtonClass.secondary}>
            {t("secondary.label")}
          </Link>
        </>
      }
    />
  );
}
