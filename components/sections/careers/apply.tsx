"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import { Link } from "@/i18n/navigation";

/**
 * Apply — a static CTA card pointing candidates to the contact page's
 * careers route, which is where role applications are actually submitted.
 */
export default function Apply() {
  const t = useTranslations("CareersPage.apply");

  return (
    <section id="apply" className="scroll-mt-24 bg-slate-25 py-10 lg:py-15">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal amount={0.25}>
          <div className="rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(15,40,60,.04),0_18px_44px_-24px_rgba(15,40,60,.18)] lg:p-10">
            <h3 className="heading-lg-semibold text-slate-900">
              {t("title")}
            </h3>
            <p className="body-lg-regular mt-3 max-w-[64ch] text-slate-600">
              {t("description")}
            </p>
            <Link
              href={t("cta.href")}
              className="group mt-7 inline-flex items-center gap-2.5 rounded-md bg-brandblue-500 px-7 py-4 text-[12.5px] font-semibold uppercase tracking-[0.11em] text-white shadow-[0_8px_24px_-12px_rgba(28,151,212,.9)] transition-[background,box-shadow] duration-300 hover:bg-brandblue-600 hover:shadow-[0_16px_34px_-14px_rgba(28,151,212,1)]"
            >
              {t("cta.label")}
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
