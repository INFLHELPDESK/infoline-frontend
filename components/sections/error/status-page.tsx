"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useForceLightHeader } from "@/components/layout/header/theme";
import ErrorPage, { errorButtonClass, errorPillClass } from "./error-page";

/**
 * Localised 404 / 403 / 503 page. Only 404 is rendered today (catch-all route
 * and not-found boundary). 403 and 503 are the approved designs, kept ready but
 * not wired: the site has no authorisation flow to raise a 403 (it would need
 * Next's experimental `forbidden()` + `forbidden.tsx`) and no maintenance mode
 * for a 503. The primary action is a link, except on 503 where "Try again"
 * reloads the current page.
 */
export default function StatusPage({ status }: { status: "404" | "403" | "503" }) {
  const t = useTranslations(`ErrorPages.${status}`);
  // Error pages use the light header (the 404 route is also detected by path).
  useForceLightHeader();

  const help =
    status === "404"
      ? undefined
      : {
          title: t("help.title"),
          text: t("help.text"),
          action: (
            <Link href={t("help.link.href")} className={errorPillClass}>
              {t("help.link.label")}
            </Link>
          ),
        };

  const primary =
    status === "503" ? (
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={errorButtonClass.primary}
      >
        {t("primary.label")}
        <ArrowRight className="size-5 rtl:rotate-180" />
      </button>
    ) : (
      <Link href={t("primary.href")} className={errorButtonClass.primary}>
        {t("primary.label")}
        <ArrowRight className="size-5 rtl:rotate-180" />
      </Link>
    );

  return (
    <ErrorPage
      status={status}
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      help={help}
      actions={
        <>
          {primary}
          <Link href={t("secondary.href")} className={errorButtonClass.secondary}>
            {t("secondary.label")}
          </Link>
        </>
      }
    />
  );
}
