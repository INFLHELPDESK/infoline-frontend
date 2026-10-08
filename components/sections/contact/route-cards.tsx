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
import { EASE } from "@/components/ui/motion/shared";
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
    <section className="bg-slate-25 pb-16 pt-14 lg:pb-20">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger as="div" className="flex flex-col items-center" stagger={0.1}>
          <StaggerItem>
            <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-slate-400">
              {t("label")}
            </p>
          </StaggerItem>
          <StaggerItem>
            <h2 className="heading-2xl-semibold mt-3 text-center text-slate-900">
              {t("title")}
            </h2>
          </StaggerItem>
        </Stagger>

        <Stagger
          as="div"
          className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
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
                  className={`relative flex h-full w-full flex-col rounded-2xl border p-6 text-start transition-[border-color,background-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] ${
                    active
                      ? "border-brandblue-500 bg-white shadow-[0_0_0_4px_rgba(28,151,212,.08),0_18px_40px_-24px_rgba(28,151,212,.35)]"
                      : "border-slate-200 bg-white hover:border-brandblue-300 hover:shadow-[0_14px_30px_-22px_rgba(15,40,60,.25)]"
                  }`}
                >
                  {/* Radio indicator — animated dot, as in the Figma cards */}
                  <span
                    aria-hidden
                    className={`absolute end-5 top-5 flex size-4.5 items-center justify-center rounded-full border transition-colors duration-300 ${
                      active ? "border-brandblue-500" : "border-slate-300"
                    }`}
                  >
                    <motion.span
                      className="size-2.5 rounded-full bg-brandblue-500"
                      animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                    />
                  </span>

                  <span
                    className={`mb-4 flex size-10 items-center justify-center rounded-lg transition-colors duration-300 ${
                      active
                        ? "bg-brandblue-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>

                  <span
                    className={`font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 ${
                      active ? "text-brandblue-600" : "text-slate-400"
                    }`}
                  >
                    {r.tag}
                  </span>
                  <span className="mt-1.5 text-[15.5px] font-bold text-slate-900">
                    {r.title}
                  </span>
                  <span className="body-md-regular mt-2 text-slate-600">
                    {r.description}
                  </span>
                </motion.button>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </Stagger>

        <div className="mt-10 text-center">
          <a
            href="/assets/infoline-company-profile.pdf"
            onClick={(e) => e.preventDefault()}
            className="group inline-flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-brandblue-600"
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
