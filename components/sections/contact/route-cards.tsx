"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Handshake,
  Mail,
  MonitorSmartphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { SpotlightCard, Stagger, StaggerItem } from "@/components/ui/motion";
import { useRouteSelection, type RouteId } from "./route-context";

type Route = {
  id: RouteId;
  tag: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

/**
 * Route chooser — the four selectable cards from the Figma. Selection is
 * animated (radio dot springs in, border/glow transition) and drives the form's
 * field set below the trust strip.
 */
export default function RouteCards() {
  const t = useTranslations("ContactPage.routes");
  const { route, setRoute } = useRouteSelection();

  const routes: Route[] = [
    { id: "service", tag: t("routeA.tag"), title: t("routeA.title"), description: t("routeA.description"), icon: Mail },
    { id: "project", tag: t("routeB.tag"), title: t("routeB.title"), description: t("routeB.description"), icon: MonitorSmartphone },
    { id: "vendor", tag: t("routeC.tag"), title: t("routeC.title"), description: t("routeC.description"), icon: Handshake },
    { id: "careers", tag: t("routeD.tag"), title: t("routeD.title"), description: t("routeD.description"), icon: Users },
  ];

  return (
    <section className="bg-slate-25 pb-10 pt-12">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger as="div" className="flex flex-col items-center" stagger={0.1}>
          <StaggerItem>
            <Eyebrow>{t("label")}</Eyebrow>
          </StaggerItem>
          <StaggerItem>
            <h2 className="mt-3 text-center text-[24px] leading-9 font-semibold text-slate-900 lg:text-[28px]">
              {t("title")}
            </h2>
          </StaggerItem>
        </Stagger>

        <Stagger
          as="div"
          className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
          stagger={0.09}
          amount={0.2}
        >
          {routes.map((r) => {
            const active = route === r.id;
            const Icon = r.icon;
            return (
              <StaggerItem key={r.id} className="h-full">
                <SpotlightCard className="h-full rounded-2xl" lift={4}>
                <motion.button
                  type="button"
                  onClick={() => setRoute(r.id)}
                  aria-pressed={active}
                  whileTap={reduceTap}
                  className={`relative flex h-full min-h-[249px] w-full flex-col justify-between gap-6 rounded-2xl border bg-white p-6 text-start transition-[border-color,background-color] duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] ${
                    active
                      ? "border-brandblue-500"
                      : "border-[#e0e0e0] hover:border-brandblue-300"
                  }`}
                >
                  <span className="flex w-full items-center gap-4">
                    <span
                      className={`flex size-10 flex-none items-center justify-center rounded-full transition-colors duration-300 ${
                        active
                          ? "bg-brandblue-500 text-white"
                          : "bg-[#eceff1] text-slate-500"
                      }`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span
                      className={`text-[14px] leading-5 font-medium transition-colors duration-300 ${
                        active ? "text-brandblue-500" : "text-slate-500"
                      }`}
                    >
                      {r.tag}
                    </span>
                  </span>

                  <span className="flex flex-col gap-1.5">
                    <span className="text-[16px] leading-6 font-bold text-slate-900">
                      {r.title}
                    </span>
                    <span className="text-[13px] leading-5 text-slate-600">
                      {r.description}
                    </span>
                  </span>
                </motion.button>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </Stagger>

        <div className="mt-8 text-center">
          <a
            href="/assets/infoline-company-profile.pdf"
            onClick={(e) => e.preventDefault()}
            className="group inline-flex items-center gap-2 text-[14px] leading-5 text-slate-500 transition-colors hover:text-brandblue-600"
          >
            {t("profileLink")}
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
            >
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

const reduceTap = { scale: 0.985 };
