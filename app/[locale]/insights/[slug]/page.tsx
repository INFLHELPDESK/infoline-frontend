import { cache } from "react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SingleHero from "@/components/sections/blog/single-hero";
import Article from "@/components/sections/blog/article";
import Cta from "@/components/sections/home-1/cta";
import ErrorPage, { errorButtonClass } from "@/components/sections/error/error-page";
import { loadInsightDetail, loadRelatedInsights } from "@/lib/insights-detail";
import { typeLabelsFromFilters } from "@/lib/insights-cards";
import { buildInsightAlternates, verifyInsightTranslations } from "@/lib/insights-seo";
import { getSiteUrl } from "@/lib/site";
import { LocaleTargetsRegistrar } from "@/components/layout/header/locale-targets";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * One lookup per request: generateMetadata and the page share it, so the CMS is
 * asked once (and a failure is decided once).
 */
const resolveInsight = cache(async (slug: string, locale: string) => {
  const t = await getTranslations("Blog.page");
  const labels = typeLabelsFromFilters(t.raw("filters") as { id: string; label: string }[]);
  return loadInsightDetail(slug, locale === "ar" ? "ar" : "en", labels);
});

/** Translations that are published and link back; shared by metadata and the switcher. */
const resolveTranslations = cache(async (slug: string, locale: string) => {
  const result = await resolveInsight(slug, locale);
  return result.kind === "cms"
    ? verifyInsightTranslations(result.detail, locale === "ar" ? "ar" : "en")
    : [];
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const result = await resolveInsight(slug, locale);

  if (result.kind !== "cms") return { title: "Infoline", robots: { index: false, follow: true } };

  const { post, seo } = result.detail;
  return {
    title: seo.title || `${post.title} — Infoline`,
    description: seo.description || post.excerpt || undefined,
    alternates: buildInsightAlternates(
      await getSiteUrl(),
      locale === "ar" ? "ar" : "en",
      post.href ?? `/insights/${post.slug}`,
      await resolveTranslations(slug, locale),
    ),
  };
}

/**
 * Canonical detail route of the Insights content model (`/blog` lists the
 * `article` view of it). Only a CMS record of the requested language renders;
 * a CMS outage is an error (500), never a soft 404.
 */
export default async function InsightDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const locale = await getLocale();
  const result = await resolveInsight(slug, locale);

  if (result.kind === "error") throw result.error;
  if (result.kind !== "cms") return <SoftNotFound />;

  const { post, bodyHtml, readMinutes, event, backHref, type } = result.detail;
  const translations = await resolveTranslations(slug, locale);
  const morePosts = await loadRelatedInsights(
    locale === "ar" ? "ar" : "en",
    post.id,
    typeLabelsFromFilters((await getTranslations("Blog.page")).raw("filters") as { id: string; label: string }[]),
  );

  // The soft 404 is a normal page of this route, so the group layout cannot
  // tell it apart: the shared CTA is rendered here, for found content only.
  return (
    <>
      <LocaleTargetsRegistrar
        targets={Object.fromEntries(translations.map((t) => [t.locale, t.href]))}
      />
      <main className="overflow-x-clip" data-content-source="cms" data-insight-type={type ?? undefined}>
        <SingleHero post={post} backHref={backHref} readMinutes={readMinutes} event={event} />
        <Article post={post} morePosts={morePosts} bodyHtml={bodyHtml} />
      </main>
      <Cta />
    </>
  );
}

async function SoftNotFound() {
  const [t, e] = await Promise.all([
    getTranslations("Blog.page"),
    getTranslations("ErrorPages.404"),
  ]);

  return (
    <ErrorPage
      status="404"
      eyebrow={e("eyebrow")}
      title={t("single.notFoundTitle")}
      description={t("single.notFoundDescription")}
      actions={
        <Link href="/insights" className={errorButtonClass.primary}>
          {t("single.notFoundCta")}
        </Link>
      }
    />
  );
}
