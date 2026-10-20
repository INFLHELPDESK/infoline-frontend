import type { ReactNode } from "react";
import Image from "next/image";
import { Headset } from "lucide-react";
import { Eyebrow } from "@/components/sections/home-1/shared";

export type ErrorStatus = "404" | "403" | "500" | "503";

export type ErrorHelp = {
  title: string;
  text: string;
  /** Link to an existing route (callers pass a locale-aware link). */
  action: ReactNode;
};

/** Pill link style used inside the help strip. */
export const errorPillClass =
  "rounded-full border border-[#cfd8dc] bg-slate-25 px-3 py-1.5 text-[14px] leading-5 text-slate-600 transition-colors hover:border-brandblue-300 hover:text-brandblue-600";

/** Button styles from the error designs: 44px, 8px radius. */
export const errorButtonClass = {
  primary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brandblue-500 px-4 text-[16px] leading-6 font-medium text-white transition-colors duration-300 hover:bg-brandblue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandblue-400",
  secondary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#cfd8dc] bg-white px-4 text-[16px] leading-6 font-medium text-slate-600 transition-colors duration-300 hover:border-brandblue-300 hover:text-brandblue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandblue-400",
};

/**
 * Presentation (and the page's `<main>` landmark) for the four error designs (404 / 403 / 500 / 503): light page,
 * eyebrow pill, headline, copy and two actions on the start side, the large
 * status number on the end side, and (403/500/503) the "Need help now?" strip.
 *
 * Deliberately free of hooks and i18n helpers so it renders in server pages,
 * client error boundaries and `global-error` (which replaces the root layout).
 * Callers pass already-localised strings and the action elements, so each
 * boundary keeps its own real behaviour (links, `reset`, reload).
 */
export default function ErrorPage({
  status,
  eyebrow,
  title,
  description,
  actions,
  reference,
  help,
}: {
  status: ErrorStatus;
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
  /** Optional reference line (e.g. the framework's error digest). */
  reference?: ReactNode;
  help?: ErrorHelp;
}) {
  return (
    <main className="overflow-x-clip bg-[#f1f2f2] pt-28 pb-16 lg:pt-[180px] lg:pb-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <Eyebrow className="border border-[#eee]">{eyebrow}</Eyebrow>
            <h1 className="mt-5 max-w-[584px] text-[36px] leading-[1.17] font-bold text-slate-900 lg:text-[48px] lg:leading-14">
              {title}
            </h1>
            <p className="mt-5 max-w-[584px] text-[16px] leading-7 text-slate-600 lg:text-[18px]">
              {description}
            </p>
            {reference}
            <div className="mt-6 flex flex-wrap gap-4">{actions}</div>
          </div>

          {/* Large status number (decorative; the h1 carries the meaning). */}
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <Image
              src={`/assets/errors/${status}.svg`}
              alt=""
              aria-hidden
              width={522}
              height={221}
              priority
              className="h-auto w-full max-w-[260px] lg:max-w-[522px]"
            />
          </div>
        </div>

        {help && (
          <div className="mt-10 rounded-3xl border border-[#e0e0e0] bg-white p-2 shadow-[0_8px_20px_rgba(71,75,85,0.08)] lg:mt-14">
            <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:gap-3">
              <div className="flex flex-1 items-start gap-6">
                <span className="flex size-[50px] flex-none items-center justify-center rounded-full bg-[#ecf4f9] text-brandblue-500">
                  <Headset className="size-6" aria-hidden />
                </span>
                <div className="flex flex-col gap-3">
                  <p className="text-[16px] leading-6 font-bold text-slate-900">
                    {help.title}
                  </p>
                  <p className="text-[14px] leading-5 text-slate-600">
                    {help.text}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">{help.action}</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
