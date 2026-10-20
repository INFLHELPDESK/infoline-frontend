"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { MaskText, Stagger, StaggerItem, Reveal } from "@/components/ui/motion";

type Role = { title: string; discipline: string; location: string };

/**
 * Vacancies — the hiring table, driven entirely by the static
 * `CareersPage.vacancies.roles` locale content.
 *
 * On desktop it reads as a table with a header row; below `sm` it collapses
 * into stacked cards (role / meta / apply). The grid-template-columns come
 * from CSS variables so RTL flips column order automatically with the
 * document direction.
 */
export default function Vacancies() {
  const t = useTranslations("CareersPage");
  const col = (k: string) => t(`vacancies.columns.${k}`);
  const roles = t.raw("vacancies.roles") as Role[];

  return (
    <section
      id="vacancies"
      className="scroll-mt-24 bg-brandblue-900/[0.04] pt-10 pb-4 lg:pt-11"
    >
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="flex flex-col items-start"
          stagger={0.1}
          delayChildren={0.05}
          amount={0.25}
        >
          <StaggerItem className="mb-4" distance={24}>
            <Eyebrow>{t("vacancies.eyebrow")}</Eyebrow>
          </StaggerItem>

          <MaskText
            as="h2"
            className="max-w-[641px] text-[32px] leading-[1.1] font-semibold lg:text-[40px] lg:leading-11 text-ink"
            segments={[{ text: t("vacancies.title") }]}
            stagger={0.05}
            duration={0.85}
          />

          <StaggerItem
            as="p"
            className="mt-4 max-w-[735px] text-[16px] leading-6 text-slate-600"
          >
            {t("vacancies.note")}
          </StaggerItem>
        </Stagger>

        {/* Table header — desktop only */}
        <div
          aria-hidden
          className="mt-10 hidden gap-6 border-b border-[#e0e0e0] pb-[17px] sm:grid sm:[grid-template-columns:var(--vac-cols)]"
          style={{ ["--vac-cols" as string]: "659fr 276fr 272fr 71fr" }}
        >
          <span className="text-[14px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-600">
            {col("role")}
          </span>
          <span className="text-[14px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-600">
            {col("discipline")}
          </span>
          <span className="text-[14px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-600">
            {col("location")}
          </span>
          <span className="text-end text-[14px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-600">
            {col("apply")}
          </span>
        </div>

        <ul>
          {roles.map((role) => (
            <li key={role.title} className="group border-b border-[#e0e0e0]">
              <Reveal
                as="div"
                className="py-[18px]"
                amount={0.3}
                distance={28}
                duration={0.8}
              >
                <div
                  className="grid gap-4 sm:gap-6 sm:[grid-template-columns:var(--vac-cols)] sm:items-center"
                  style={{ ["--vac-cols" as string]: "659fr 276fr 272fr 71fr" }}
                >
                  {/* Role */}
                  <h3 className="text-[16px] leading-6 font-bold text-ink transition-colors duration-300 group-hover:text-brandblue-600">
                    {role.title}
                  </h3>

                  {/* Discipline */}
                  <div className="text-[16px] leading-6 font-medium text-slate-600">
                    {/* Mobile label */}
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:hidden">
                      {col("discipline")} ·{" "}
                    </span>
                    {role.discipline}
                  </div>

                  {/* Location */}
                  <div className="text-[16px] leading-6 text-slate-600">
                    <span className="block font-medium text-slate-600">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:hidden">
                        {col("location")} ·{" "}
                      </span>
                      {role.location}
                    </span>
                    <span className="text-[14px] leading-5 text-slate-500">
                      {t("vacancies.fullTime")}
                    </span>
                  </div>

                  {/* Apply — deep-links to the on-page application card. */}
                  <div className="sm:text-end">
                    <a
                      href="#apply"
                      className="inline-flex items-center gap-2.5 text-[16px] leading-6 font-medium text-brandblue-500 transition-colors duration-300 hover:text-brandblue-600"
                    >
                      {col("apply")}
                      <ArrowRight className="size-[18px] transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </a>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
