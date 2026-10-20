import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Icon from "@/components/ui/icon";
import Button from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/motion";
import RailScroll from "./rail-scroll";

type RailService = {
  id: string;
  number: string;
  family: string;
  title: string;
};

/**
 * Managed Branch & Retail Services — standalone detail page (Figma › Solutions
 * node 406:2919). It is the catalogue's "ninth service" view: the same rail and
 * detail card, with item 09 active. The eight catalogue services link to their
 * existing deep links; the ninth service lives in its own `managedBranch`
 * strings and is deliberately not part of `catalogue.services`.
 */
export default function ManagedBranch() {
  const t = useTranslations("SolutionsPage");
  const services = t.raw("catalogue.services") as RailService[];
  const m = useTranslations("SolutionsPage.managedBranch");
  const tags = m.raw("tags") as string[];

  return (
    <section className="bg-white pt-28 pb-16 lg:pt-32 lg:pb-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal amount={0.05}>
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#cfd8dc] bg-white lg:grid-cols-[260px_1fr]">
            {/* Rail: the eight catalogue services, then 09 (active) */}
            <nav
              aria-label={t("catalogue.eyebrow")}
              className="border-b border-[#cfd8dc] lg:border-e lg:border-b-0"
            >
              <RailScroll className="relative flex overflow-x-auto lg:flex-col lg:overflow-visible">
                {services.map((s) => (
                  <li
                    key={s.id}
                    className="shrink-0 lg:w-full lg:border-b lg:border-[#cfd8dc]"
                  >
                    <Link
                      href={`/solutions#cat-${s.id}`}
                      className="flex flex-col items-start border-s-2 border-transparent p-4 text-start transition-colors hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2 text-[13px] leading-5 font-medium">
                        <span className="tabular-nums text-slate-400">
                          {s.number}
                        </span>
                        <span className="text-slate-900">{s.title}</span>
                      </span>
                      <span className="ps-6 text-[13px] leading-5 text-slate-400">
                        {s.family}
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="shrink-0 lg:w-full">
                  <div
                    aria-current="page"
                    className="flex flex-col items-start border-s-2 border-brandblue-500 bg-slate-25 p-4 text-start"
                  >
                    <span className="flex items-center gap-2 text-[13px] leading-5 font-medium">
                      <span className="tabular-nums text-brandblue-500">
                        {m("number")}
                      </span>
                      <span className="text-slate-900">{m("title")}</span>
                    </span>
                    <span className="ps-6 text-[13px] leading-5 text-slate-400">
                      {m("family")}
                    </span>
                  </div>
                </li>
              </RailScroll>
            </nav>

            {/* Detail */}
            <div className="relative flex min-h-110 flex-col gap-10 overflow-hidden p-6 lg:flex-row lg:justify-between lg:gap-12 lg:p-8">
              <Image
                src="/assets/solutions/ellipse-17.svg"
                alt=""
                width={339}
                height={339}
                aria-hidden
                className="pointer-events-none absolute -top-37 -end-66 max-w-[339px]"
              />
              <Image
                src="/assets/solutions/ellipse-16.svg"
                alt=""
                width={227}
                height={227}
                aria-hidden
                className="pointer-events-none absolute -top-22 -end-52 max-w-[227px]"
              />

              <div className="relative max-w-[654px] flex-1">
                <Icon
                  src="/assets/solutions/s9.svg"
                  className="size-6 text-brandblue-500"
                  aria-hidden
                />
                <h1 className="mt-4 text-[24px] leading-7 font-semibold text-slate-900">
                  {m("title")}
                </h1>
                <h2 className="mt-6 text-[16px] leading-6 font-medium text-slate-900">
                  {m("headline")}
                </h2>
                <p className="mt-1.5 text-[14px] leading-5 text-slate-500">
                  {m("summary")}
                </p>
                <hr className="mt-6 border-[#cfd8dc]" />

                <p className="mt-6 text-[12px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-400">
                  {m("overviewLabel")}
                </p>
                <p className="mt-4 text-[14px] leading-5 text-slate-600">
                  {m("overview")}
                </p>

                <ul className="mt-6 flex flex-wrap gap-x-2 gap-y-3">
                  {tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-[#cfd8dc] bg-white px-4 py-2.5 text-[12px] leading-4 font-medium text-slate-400"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 py-3">
                  <Button
                    href={m("cta.href")}
                    icon={ArrowRight}
                    iconPosition="right"
                    size="md"
                    variant="primary"
                  >
                    {m("cta.label")}
                  </Button>
                </div>
              </div>

              <div className="relative h-[420px] w-full overflow-hidden rounded-2xl lg:h-[528px] lg:w-[290px] lg:shrink-0 lg:self-start">
                <Image
                  src="/assets/solutions/cx1.svg"
                  alt=""
                  width={290}
                  height={528}
                  aria-hidden
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(28,151,212,0.22)_0%,rgba(37,165,226,0)_100%)]" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
