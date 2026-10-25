import { useTranslations } from "next-intl";

/**
 * Shown when the CMS answered and has no articles in the page's language. A
 * quiet band below the hero; never stands in for static content and is not used
 * when the CMS could not be reached.
 */
export default function Empty() {
  const t = useTranslations("Blog.page");

  return (
    <section className="bg-white py-24 lg:py-32" data-empty="">
      <div className="mx-auto w-full max-w-360 px-6 text-center lg:px-10">
        <h2 className="text-[28px] leading-9 font-semibold text-slate-900 lg:text-[32px] lg:leading-10">
          {t("empty.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-6 text-slate-600">
          {t("empty.description")}
        </p>
      </div>
    </section>
  );
}
