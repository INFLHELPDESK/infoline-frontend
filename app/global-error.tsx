"use client";

import "./[locale]/globals.css";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import ErrorPage, {
  errorButtonClass,
  errorPillClass,
} from "@/components/sections/error/error-page";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";

/**
 * Last-resort error boundary. It replaces the root layout, so it brings its own
 * document and has no next-intl provider, header or footer: the language is
 * taken from the URL and the copy comes straight from the locale files.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isAr = usePathname()?.startsWith("/ar") ?? false;
  const c = (isAr ? ar : en).ErrorPages["500"];

  return (
    <html lang={isAr ? "ar" : "en"} dir={isAr ? "rtl" : "ltr"}>
      <body className="bg-[#f1f2f2]">
        <ErrorPage
          status="500"
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          help={{
            title: c.help.title,
            text: c.help.text,
            action: (
              <a
                href={`/${isAr ? "ar" : "en"}${c.help.link.href}`}
                className={errorPillClass}
              >
                {c.help.link.label}
              </a>
            ),
          }}
          reference={
            error.digest ? (
              <p className="mt-4 text-[13px] leading-5 text-slate-500">
                {c.referenceLabel}:{" "}
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
                {c.primary.label}
                <ArrowRight className="size-5 rtl:rotate-180" />
              </button>
              <a
                href={isAr ? "/ar" : "/en"}
                className={errorButtonClass.secondary}
              >
                {c.secondary.label}
              </a>
            </>
          }
        />
      </body>
    </html>
  );
}
