"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { FileText, Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";
import { useCompanyProfile } from "@/lib/wp";

type Doc = { title: string; meta: string; cta: string; href: string };

/** Bytes → a short human label (e.g. "248 KB", "1.2 MB"). */
function formatSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Company documents — download rows for the company profile. Files come from
 * the CMS (`aboutSettings.companyProfile`, EN + AR PDFs with size); the designed
 * locale rows are the graceful fallback while the query loads or when the CMS
 * has no files yet.
 */
export default function Documents() {
  const t = useTranslations("AboutPage");
  const fallback = t.raw("documents.items") as Doc[];
  const ctaLabel = fallback[0]?.cta ?? t("documents.title");

  const { data: profile } = useCompanyProfile();

  const cmsItems = useMemo(() => {
    const rows: (Doc & { external: true })[] = [];
    const pdfMeta = (size: number | null) =>
      ["PDF", formatSize(size)].filter(Boolean).join(" · ");

    if (profile?.en.file?.url) {
      rows.push({
        title: profile.en.label || fallback[0]?.title || "Company profile (English)",
        meta: pdfMeta(profile.en.file.fileSize),
        cta: ctaLabel,
        href: profile.en.file.url,
        external: true,
      });
    }
    if (profile?.ar.file?.url) {
      rows.push({
        title: profile.ar.label || fallback[1]?.title || "Company profile (Arabic)",
        meta: pdfMeta(profile.ar.file.fileSize),
        cta: ctaLabel,
        href: profile.ar.file.url,
        external: true,
      });
    }
    return rows;
  }, [profile, fallback, ctaLabel]);

  const items: (Doc & { external?: boolean })[] =
    cmsItems.length > 0 ? cmsItems : fallback;

  return (
    <section className="py-24 lg:py-32">
      <div className="grid w-full max-w-360 grid-cols-1 items-start gap-12 px-6 lg:grid-cols-2 lg:gap-20 lg:px-30 mx-auto">
        <div>
          <p className="overline-sm-medium text-slate-400">
            {t("documents.eyebrow")}
          </p>
          <MaskText
            as="h2"
            className="mt-4 heading-2xl-semibold max-w-[20ch] text-slate-900"
            segments={[{ text: profile?.heading || t("documents.title") }]}
            amount={0.5}
            duration={0.85}
          />
          <p className="mt-5 max-w-[48ch] body-lg-regular text-slate-700">
            {profile?.intro || t("documents.description")}
          </p>
        </div>

        <Stagger
          as="div"
          className="flex flex-col gap-4"
          stagger={0.12}
          amount={0.3}
        >
          {items.map((doc) => {
            const className =
              "group flex items-center gap-5 rounded-xl border border-ink/20 bg-ink/[.02] p-5 transition-colors hover:border-brandblue-500/50 hover:bg-white/[.04]";
            const inner = (
              <>
                <span className="flex size-12 flex-none items-center justify-center rounded-lg bg-brandblue-500/10 text-brandblue-400">
                  <FileText className="size-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block body-lg-medium text-slate-900">
                    {doc.title}
                  </span>
                  <span className="mt-0.5 block body-sm-regular text-slate-900">
                    {doc.meta}
                  </span>
                </span>
                <span className="inline-flex flex-none items-center gap-2 overline-sm-medium text-brandblue-500">
                  {doc.cta}
                  <Download
                    className="size-4 transition-transform duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0.5"
                    strokeWidth={2}
                  />
                </span>
              </>
            );
            return (
              <StaggerItem key={doc.title}>
                {doc.external ? (
                  <a
                    href={doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className={className}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link href={doc.href} className={className}>
                    {inner}
                  </Link>
                )}
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
