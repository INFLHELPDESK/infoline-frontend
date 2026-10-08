import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Ban, ChartColumnIncreasing, Check, Gem, X } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow, PillButton, sectionTitle } from "./shared";

type Row = { without: string; with: string; impact: string };
type Variant = "without" | "with" | "impact";

/**
 * Section 5 — Without / With / Business impact comparison.
 * The "With Infoline" column is the raised, blue-tinted card with the CTA.
 */
export default function WhatChanges() {
  const t = useTranslations("HomeV1.whatChanges");
  const rows = t.raw("rows") as Row[];

  return (
    <section className="bg-[#f6f8f9] py-20 text-[#1a1a1c] sm:py-24 lg:py-20">
      <div className="mx-auto w-full max-w-360 px-6 md:px-12 lg:px-20">
        <Stagger as="div" className="mx-auto flex max-w-[760px] flex-col items-center text-center" stagger={0.12}>
          <StaggerItem distance={24}>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
          </StaggerItem>
          <StaggerItem as="h2" className={`mt-6 ${sectionTitle}`}>
            {t("title")}
          </StaggerItem>
          <StaggerItem as="p" className="mt-6 max-w-[536px] text-[15px] leading-6 text-slate-700 sm:text-[16px]">
            {t("description")}
          </StaggerItem>
        </Stagger>

        <Stagger
          as="div"
          className="mt-10 grid grid-cols-1 gap-4 rounded-2xl bg-white p-3 sm:p-4 lg:mt-10 lg:grid-cols-3 lg:gap-0"
          stagger={0.14}
          amount={0.25}
        >
          <StaggerItem>
            <Column variant="without" heading={t("columns.without")} cells={rows.map((r) => r.without)} />
          </StaggerItem>
          <StaggerItem>
            <Column
              variant="with"
              heading={t("columns.with")}
              cells={rows.map((r) => r.with)}
              footer={
                <PillButton href={t("cta.href")} className="w-full">
                  {t("cta.label")}
                </PillButton>
              }
            />
          </StaggerItem>
          <StaggerItem>
            <Column variant="impact" heading={t("columns.impact")} cells={rows.map((r) => r.impact)} />
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

const headIcon: Record<Variant, ReactNode> = {
  without: <Ban className="size-5.5 text-[#aca9a9]" strokeWidth={2} />,
  with: <Gem className="size-5.5 text-brandblue-500" strokeWidth={1.8} />,
  impact: <ChartColumnIncreasing className="size-5.5 text-brandblue-500" strokeWidth={1.8} />,
};

function Column({
  variant,
  heading,
  cells,
  footer,
}: {
  variant: Variant;
  heading: string;
  cells: string[];
  footer?: ReactNode;
}) {
  const featured = variant === "with";

  return (
    <div
      className={`flex h-full flex-col rounded-2xl p-6 transition-transform duration-500 sm:p-10 ${
        featured
          ? "bg-gradient-to-b from-[#98d4eb] to-white to-78% shadow-[0_30px_60px_-34px_rgba(28,151,212,0.55)] lg:-my-1 lg:hover:-translate-y-1"
          : ""
      }`}
    >
      <span
        className={`grid size-12 place-items-center rounded-full border-2 border-[#f7f7f7] shadow-[2px_4px_4px_rgba(0,0,0,0.06),2px_8px_4px_rgba(0,0,0,0.04)] ${
          variant === "without"
            ? "bg-gradient-to-b from-[#f7f7f8] to-[#e9eaea]"
            : "bg-gradient-to-b from-[#f7f7f8] to-[#c5e7f3]"
        }`}
      >
        {headIcon[variant]}
      </span>
      <h3 className="mt-3.5 text-[22px] leading-7 font-semibold text-slate-900 sm:text-[24px]">
        {heading}
      </h3>

      <ul className="mt-6 flex flex-col gap-7.5">
        {cells.map((cell) => (
          <li key={cell} className="flex items-start gap-2 text-[14px] leading-5 text-slate-900">
            <Mark variant={variant} />
            <span className="pt-0.5">{cell}</span>
          </li>
        ))}
      </ul>

      {footer && <div className="mt-8 lg:mt-auto lg:pt-8">{footer}</div>}
    </div>
  );
}

function Mark({ variant }: { variant: Variant }) {
  if (variant === "without") {
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#414141]/30 text-white">
        <X aria-hidden className="size-3.5" strokeWidth={2.4} />
      </span>
    );
  }
  return (
    <span
      className={`grid size-6 shrink-0 place-items-center rounded-full ${
        variant === "with" ? "bg-brandblue-500 text-white" : "bg-[#bbe3f2] text-brandblue-500"
      }`}
    >
      <Check aria-hidden className="size-3.5" strokeWidth={2.6} />
    </span>
  );
}
