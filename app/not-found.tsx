import Link from "next/link";
import en from "@/locales/en.json";
import ErrorPage, {
  errorButtonClass,
} from "@/components/sections/error/error-page";

/**
 * Root 404 fallback — shown for unmatched URLs outside any locale (e.g. before
 * middleware redirects). English copy from the locale file; the locale-aware
 * variant with the same design lives in app/[locale]/not-found.tsx.
 */
export default function RootNotFound() {
  const c = en.ErrorPages["404"];

  return (
    <ErrorPage
      status="404"
      eyebrow={c.eyebrow}
      title={c.title}
      description={c.description}
      actions={
        <>
          <Link href="/" className={errorButtonClass.primary}>
            {c.primary.label}
          </Link>
          <Link href="/en/contact" className={errorButtonClass.secondary}>
            {c.secondary.label}
          </Link>
        </>
      }
    />
  );
}
