"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { MaskText, Stagger, StaggerItem, Reveal } from "@/components/ui/motion";
import { useCareers } from "@/lib/wp";

type Role = { title: string; discipline: string; location: string };
type Vacancy = Role & { jobType?: string | null };

/**
 * Vacancies — the hiring table. Roles come from the CMS (`careers` CPT,
 * locale-aware); the designed `CareersPage.vacancies.roles` are the graceful
 * fallback while the query loads or when the CMS has none.
 *
 * On desktop it reads as a table with a header row; below `sm` it collapses
 * into stacked cards (role / meta / apply). The grid-template-columns come
 * from CSS variables so RTL flips column order automatically with the
 * document direction.
 */
export default function Vacancies() {
  const t = useTranslations("CareersPage");
  const col = (k: string) => t(`vacancies.columns.${k}`);
  const fallback = t.raw("vacancies.roles") as Role[];

  const { data: careers } = useCareers();
  const roles: Vacancy[] = useMemo(() => {
    const fromCms = (careers ?? []).map((c) => ({
      title: c.title,
      discipline: c.discipline ?? "",
      location: c.location ?? "",
      jobType: c.jobType,
    }));
    return fromCms.length > 0 ? fromCms : fallback;
  }, [careers, fallback]);

  return (
    <section
      id="vacancies"
      className="scroll-mt-24 bg-brandblue-900/[0.04] py-10 lg:py-15"
    >
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="flex flex-col items-start"
          stagger={0.1}
          delayChildren={0.05}
          amount={0.25}
        >
          <StaggerItem className="mb-5" distance={24}>
            <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-brandblue-600">
              {t("vacancies.eyebrow")}
            </span>
          </StaggerItem>

          <MaskText
            as="h2"
            className="max-w-[26ch] text-[30px] font-bold leading-[1.15] tracking-[-.025em] text-ink lg:text-[40px]"
            segments={[{ text: t("vacancies.title") }]}
            stagger={0.05}
            duration={0.85}
          />

          <StaggerItem
            as="p"
            className="mt-5 max-w-[56ch] text-[15px] leading-[24px] text-slate-600"
          >
            {t("vacancies.note")}
          </StaggerItem>
        </Stagger>

        {/* Table header — desktop only */}
        <div
          aria-hidden
          className="mt-14 hidden gap-6 border-b border-grey-300 pb-4 sm:grid sm:[grid-template-columns:var(--vac-cols)]"
          style={{ ["--vac-cols" as string]: "1.9fr 1fr 1fr 0.45fr" }}
        >
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            {col("role")}
          </span>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            {col("discipline")}
          </span>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            {col("location")}
          </span>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-end text-slate-500">
            {col("apply")}
          </span>
        </div>

        <ul>
          {roles.map((role) => (
            <li key={role.title} className="group border-b border-grey-300">
              <Reveal
                as="div"
                className="py-7"
                amount={0.3}
                distance={28}
                duration={0.8}
              >
                <div
                  className="grid gap-4 sm:gap-6 sm:[grid-template-columns:var(--vac-cols)] sm:items-center"
                  style={{ ["--vac-cols" as string]: "1.9fr 1fr 1fr 0.45fr" }}
                >
                  {/* Role */}
                  <h3 className="text-[17px] font-bold tracking-[-.01em] text-ink transition-colors duration-300 group-hover:text-brandblue-600 lg:text-[19px]">
                    {role.title}
                  </h3>

                  {/* Discipline */}
                  <div className="body-md-regular text-slate-700">
                    {/* Mobile label */}
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:hidden">
                      {col("discipline")} ·{" "}
                    </span>
                    {role.discipline}
                  </div>

                  {/* Location */}
                  <div className="body-md-regular text-slate-700">
                    <span className="block font-medium text-ink">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:hidden">
                        {col("location")} ·{" "}
                      </span>
                      {role.location}
                    </span>
                    <span className="text-[13px] text-slate-500">
                      {role.jobType || t("vacancies.fullTime")}
                    </span>
                  </div>

                  {/* Apply — deep-links to the on-page application card. */}
                  <div className="sm:text-end">
                    <a
                      href="#apply"
                      className="inline-flex items-center gap-2 text-[14px] font-semibold text-brandblue-500 transition-colors duration-300 hover:text-brandblue-500"
                    >
                      {col("apply")}
                      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
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
