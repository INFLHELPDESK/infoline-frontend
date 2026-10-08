"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Icon from "@/components/ui/icon";
import Button from "@/components/ui/button";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";
import { EASE } from "@/components/ui/motion/shared";
import { useSolutions } from "@/lib/wp";

type Service = {
  id: string;
  number: string;
  family: string;
  icon: string;
  image: string;
  title: string;
  headline: string;
  summary: string;
  body: string[];
  tags: string[];
  facts: string[];
  metric: { value: string; label: string };
  cta: { label: string; href: string };
};

export default function Catalogue() {
  const t = useTranslations("SolutionsPage");
  const fallback = t.raw("catalogue.services") as Service[];
  const coversLabel = t("catalogue.coversLabel");
  const reduce = useReducedMotion();

  // Pillars from the CMS (WPGraphQL `solutions`). CMS drives title/icon/problem
  // statement; the designed slot (matched positionally) supplies the detail
  // copy, photo, tags and CTA the listing API doesn't expose. Ids stay from the
  // designed slot so the hero deep-links (#cat-<id>) keep working.
  const { data: solutionsPage } = useSolutions();
  const services: Service[] = useMemo(() => {
    const fromCms = (solutionsPage?.items ?? []).map((s, idx) => {
      const base = fallback[idx % fallback.length];
      return {
        ...base,
        title: s.title || base.title,
        icon: s.icon?.src || base.icon,
        summary: s.problemStatement || base.summary,
      };
    });
    return fromCms.length > 0 ? fromCms : fallback;
  }, [solutionsPage, fallback]);

  const [activeId, setActiveId] = useState(fallback[0].id);

  // Sync from hero deep-links (#cat-<id>) on mount and on hashchange.
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash.startsWith("cat-")) {
        const id = hash.slice(4);
        if (services.some((s) => s.id === id)) setActiveId(id);
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [services]);

  const active = services.find((s) => s.id === activeId) ?? services[0];

  // Entrance/exit for the swapping middle column (skipped under reduced motion).
  const detailMotion = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 14, filter: "blur(6px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -10, filter: "blur(6px)" },
        transition: { duration: 0.5, ease: EASE },
      };

  return (
    <section id="catalogue" className="mt-20 bg-white py-6xl">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        {/* Header */}
        <Stagger
          as="div"
          className="mb-4xl flex flex-col justify-between gap-lg lg:flex-row lg:items-end"
          stagger={0.15}
        >
          <StaggerItem direction="start">
            <p className="overline-sm-medium mb-sm text-slate-500">
              {t("catalogue.eyebrow")}
            </p>
            <MaskText
              as="h2"
              className="heading-2xl-semibold max-w-[22ch] text-slate-900"
              segments={[{ text: t("catalogue.title") }]}
              amount={0.5}
              duration={0.8}
            />
          </StaggerItem>
          <StaggerItem
            as="p"
            direction="end"
            className="body-lg-regular max-w-[52ch] text-slate-600"
          >
            {t("catalogue.description")}
          </StaggerItem>
        </Stagger>

        {/* Deep-link anchors for the hero index (sit just above the card). */}
        <div aria-hidden className="relative">
          {services.map((s) => (
            <span
              key={s.id}
              id={`cat-${s.id}`}
              className="absolute -top-28 block h-0 w-0"
            />
          ))}
        </div>

        {/* Interactive card */}
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_24px_60px_-45px_rgba(38,50,56,0.55)] lg:grid-cols-[minmax(0,240px)_1fr]">
          {/* LEFT RAIL */}
          <div className="border-b border-slate-100 lg:border-e lg:border-b-0">
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {services.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    aria-pressed={isActive}
                    className={`group relative flex shrink-0 items-center gap-3.5  p-4 text-start transition-colors lg:w-full lg:shrink ${
                      isActive
                        ? "text-brandblue-700 border-l border-brandblue-500"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    {isActive && (
                      <>
                        <motion.span
                          layoutId="cat-rail-active"
                          className="absolute inset-0 rounded-xl bg-brandblue-50"
                          transition={
                            reduce
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 420, damping: 38 }
                          }
                        />
                      </>
                    )}
                    <span
                      className={`relative z-10 font-mono text-[12px] tabular-nums ${
                        isActive ? "text-brandblue-500" : "text-slate-400"
                      }`}
                    >
                      {s.number}
                    </span>
                    <span className="relative z-10 flex flex-col">
                      <span className="body-sm-medium text-slate-900 leading-tight">
                        {s.title}
                      </span>
                      <span
                        className={`body-xs-regular mt-2 ${
                          isActive ? "text-brandblue-400" : "text-slate-400"
                        }`}
                      >
                        {s.family}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MIDDLE — detail copy, changes per service */}
          <div className="relative min-h-110 p-7 lg:p-10 flex flex-col lg:flex-row gap-15">
            <AnimatePresence mode="wait">
              <motion.div key={active.id} {...detailMotion}>
                <Icon
                  src={active.icon}
                  className="size-10 text-brandblue-500"
                  aria-hidden
                />
                <h2 className="heading-lg-semibold mt-4 text-slate-900 leading-tight">
                  {active.title}
                </h2>
                <h3 className="text-[16px] font-medium mt-6 text-slate-900">
                  {active.headline}
                </h3>
                <p className="body-md-regular mt-3 text-slate-600">
                  {active.summary}
                </p>

                <p className="overline-xs-medium mt-8 text-slate-400">
                  {coversLabel}
                </p>
                <div className="mt-3 space-y-3">
                  {active.body.map((para, i) => (
                    <p key={i} className="body-md-regular text-slate-700">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Channel / capability tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {active.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-25 px-3 py-1 text-[12px] font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-8">
                  <Button
                    href={active.cta.href}
                    icon={ArrowRight}
                    iconPosition="right"
                    size="small"
                    variant="primary"
                  >
                    {active.cta.label}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
            <ServicePhoto src={active.image} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicePhoto({ src }: { src: string }) {
  return (
    <div className="relative lg:h-[520px] lg:max-w-[290px] w-full border rounded-xl border-brandblue-500">
      <Image
        src={src}
        alt=""
        height={520}
        width={290}
        aria-hidden
        className="object-cover lg:h-[520px] lg:max-w-[290px] w-full rounded-xl"
      />

      {/* Gradient overlay */}
      <div className="absolute rounded-xl inset-0 bg-[linear-gradient(180deg,rgba(28,151,212,0.22)_0%,rgba(37,165,226,0)_100%)]" />
    </div>
  );
}
