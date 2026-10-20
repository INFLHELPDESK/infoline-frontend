import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

type Doc = { title: string; meta: string; cta: string; href: string };

/**
 * Company documents — download rows for the company profile. The PDFs are not yet
 * wired up, so links point at "#" (placeholder) but are styled per the design.
 */
export default function Documents() {
  const t = useTranslations("AboutPage");
  const items = t.raw("documents.items") as Doc[];

  return (
    <section className="pt-12 pb-24 lg:pb-32">
      <div className="grid w-full max-w-360 grid-cols-1 items-start gap-12 px-6 lg:grid-cols-2 lg:gap-20 lg:px-30 mx-auto">
        <div>
          <Eyebrow className="border border-slate-100">
            {t("documents.eyebrow")}
          </Eyebrow>
          <MaskText
            as="h2"
            className="mt-5 max-w-[414px] text-[32px] leading-[1.1] font-semibold lg:text-[40px] lg:leading-11 text-slate-900"
            segments={[{ text: t("documents.title") }]}
            amount={0.5}
            duration={0.85}
          />
          <p className="mt-5 max-w-[478px] text-[16px] leading-6 text-slate-600">
            {t("documents.description")}
          </p>
        </div>

        <Stagger
          as="div"
          className="flex flex-col gap-4 lg:max-w-[549px]"
          stagger={0.12}
          amount={0.3}
        >
          {items.map((doc) => (
            <StaggerItem key={doc.title}>
              <Link
                href={doc.href}
                className="group flex items-center gap-3 rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-[0_6px_6px_rgba(52,55,70,0.06)] transition-colors hover:border-brandblue-500/50"
              >
                <Image
                  src="/assets/about/pdf-icon.svg"
                  alt=""
                  aria-hidden
                  width={40}
                  height={40}
                  className="size-10 flex-none"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] leading-5 font-bold text-slate-900">
                    {doc.title}
                  </span>
                  <span className="mt-1 block text-[13px] leading-5 text-slate-900">
                    {doc.meta}
                  </span>
                </span>
                <span className="inline-flex flex-none items-center gap-1.5 text-[13px] leading-4 font-medium uppercase tracking-[1.5px] text-brandblue-500">
                  {doc.cta}
                  <ArrowRight
                    className="size-4 rtl:rotate-180 transition-transform duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                    strokeWidth={1.75}
                  />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
