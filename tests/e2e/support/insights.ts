/**
 * The rendered "Formats" section of a server-rendered /insights page. The
 * whole document also carries the RSC payload (locale messages, static
 * fallback props), so card assertions must look at this markup only.
 */
export function formatsSection(html: string): string {
  const match = /<section[^>]*data-content-source[\s\S]*?<\/section>/.exec(html);
  if (!match) throw new Error("no Formats section (data-content-source) in the server HTML");
  return match[0];
}

/**
 * CMS Insights as the stub serves them (tests/support/cms-stub/fixtures.mjs),
 * newest first. Terms are English-only in the CMS, so card category labels come
 * from the locale copy instead.
 */
export const INSIGHT_TITLES = {
  lead: { en: "A score that had not moved in quarters", ar: "نتيجة لم تتحرك منذ أرباع" },
  event: { en: "Example CX Forum 2026", ar: "منتدى تجربة العملاء ٢٠٢٦" },
  news: { en: "Infoline renews its quality certification", ar: "إنفولاين تجدد شهادة الجودة" },
  minimal: { en: "A minimal article", ar: "مقال مختصر" },
} as const;

/** Router paths of those Insights (the CMS URI without the `/ar` segment). */
export const INSIGHT_PATH = {
  lead: "/insights/lead-article",
  event: "/insights/event-conference",
  news: "/insights/news-update",
  minimal: "/insights/minimal-article",
} as const;
