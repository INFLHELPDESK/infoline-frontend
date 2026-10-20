"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/sections/home-1/shared";
import Icon from "@/components/ui/icon";
import Button from "@/components/ui/button";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";
import { EASE } from "@/components/ui/motion/shared";

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
  const services = t.raw("catalogue.services") as Service[];
  const coversLabel = t("catalogue.coversLabel");
  const reduce = useReducedMotion();

  const [activeId, setActiveId] = useState(services[0].id);

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
    <section id="catalogue" className="bg-white pt-20 pb-12">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        {/* Header */}
        <Stagger
          as="div"
          className="mb-8 flex flex-col justify-between gap-lg lg:flex-row lg:items-end"
          stagger={0.15}
        >
          <StaggerItem direction="start">
            <Eyebrow className="mb-4 border border-slate-100">
              {t("catalogue.eyebrow")}
            </Eyebrow>
            <MaskText
              as="h2"
              className="max-w-[16ch] text-[32px] leading-[1.1] font-semibold text-slate-900 lg:text-[40px] lg:leading-11"
              segments={[{ text: t("catalogue.title") }]}
              amount={0.5}
              duration={0.8}
            />
          </StaggerItem>
          <StaggerItem
            as="p"
            direction="end"
            className="max-w-[557px] text-[16px] leading-6 text-slate-600"
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
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#cfd8dc] bg-white lg:grid-cols-[260px_1fr]">
          {/* LEFT RAIL */}
          <div className="border-b border-[#cfd8dc] lg:border-e lg:border-b-0">
            <div className="flex overflow-x-auto lg:flex-col lg:overflow-visible">
              {services.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    aria-pressed={isActive}
                    className={`group relative flex shrink-0 flex-col items-start border-s-2 p-4 text-start transition-colors lg:w-full lg:shrink lg:border-b lg:border-b-[#cfd8dc] lg:last:border-b-0 ${
                      isActive
                        ? "border-brandblue-500"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="cat-rail-active"
                        className="absolute inset-0 bg-slate-25"
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 420, damping: 38 }
                        }
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2 text-[13px] leading-5 font-medium">
                      <span
                        className={`tabular-nums ${
                          isActive ? "text-brandblue-500" : "text-slate-400"
                        }`}
                      >
                        {s.number}
                      </span>
                      <span className="text-slate-900">{s.title}</span>
                    </span>
                    <span className="relative z-10 ps-6 text-[13px] leading-5 text-slate-400">
                      {s.family}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MIDDLE — detail copy, changes per service */}
          <div className="relative flex min-h-110 flex-col gap-10 overflow-hidden p-6 lg:flex-row lg:justify-between lg:gap-12 lg:p-8">
            <Image
              src="/assets/solutions/ellipse-17.svg"
              alt=""
              width={339}
              height={339}
              aria-hidden
              className="pointer-events-none absolute -top-37 -end-66 max-w-none"
            />
            <Image
              src="/assets/solutions/ellipse-16.svg"
              alt=""
              width={227}
              height={227}
              aria-hidden
              className="pointer-events-none absolute -top-22 -end-52 max-w-none"
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                {...detailMotion}
                className="relative max-w-[622px] flex-1"
              >
                <Icon
                  src={active.icon}
                  className="size-6 text-brandblue-500"
                  aria-hidden
                />
                <h2 className="mt-4 text-[24px] leading-7 font-semibold text-slate-900">
                  {active.title}
                </h2>
                <h3 className="mt-6 text-[16px] leading-6 font-medium text-slate-900">
                  {active.headline}
                </h3>
                <p className="mt-1.5 text-[14px] leading-5 text-slate-500">
                  {active.summary}
                </p>
                <hr className="mt-6 border-[#cfd8dc]" />

                <p className="mt-6 text-[12px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-400">
                  {coversLabel}
                </p>
                <div className="mt-4 space-y-5">
                  {active.body.map((para, i) => (
                    <p key={i} className="text-[14px] leading-5 text-slate-600">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Channel / capability tags */}
                <div className="mt-6 flex flex-wrap gap-x-2 gap-y-3">
                  {active.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#cfd8dc] bg-white px-4 py-2.5 text-[12px] leading-4 font-medium text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 py-3">
                  <Button
                    href={active.cta.href}
                    icon={ArrowRight}
                    iconPosition="right"
                    size="md"
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
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl lg:h-[528px] lg:w-[290px] lg:shrink-0 lg:self-start">
      <Image
        src={src}
        alt=""
        height={528}
        width={290}
        aria-hidden
        className="size-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(28,151,212,0.22)_0%,rgba(37,165,226,0)_100%)]" />
    </div>
  );
}
