"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";
import { EASE } from "@/components/ui/motion/shared";

type FaqItem = { q: string; a: string };

/**
 * FAQ accordion for the Industries page. One item open at a time (first open by
 * default); the panel animates `height: auto` with a rotating plus. Reduced
 * motion → instant open/close.
 */
export default function Faq() {
  const t = useTranslations("IndustriesPage");
  const items = t.raw("faq.items") as FaqItem[];
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-slate-25 pt-14 pb-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="mb-6 flex flex-col gap-lg"
          stagger={0.15}
        >
          <StaggerItem>
            <Eyebrow className="mb-6">{t("faq.eyebrow")}</Eyebrow>
            <MaskText
              as="h2"
              className="text-[32px] leading-[1.1] font-semibold text-slate-900 lg:text-[40px] lg:leading-11"
              segments={[{ text: t("faq.title") }]}
              amount={0.5}
              duration={0.8}
            />
          </StaggerItem>
        </Stagger>

        <Stagger as="div" className="mx-auto" stagger={0.08}>
          {items.map((item, i) => {
            const isOpen = i === open;
            return (
              <StaggerItem
                as="div"
                key={item.q}
                className="relative border-b border-[#cfd8dc]"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center py-[18px] pe-14 text-start ${isOpen ? "pb-2" : ""}`}
                >
                  <span className="text-[16px] leading-6 font-semibold text-slate-900">
                    {item.q}
                  </span>
                </button>
                <span
                  aria-hidden
                  className="pointer-events-none absolute end-0 top-[30px] flex size-9 -translate-y-1/2 items-center justify-center text-brandblue-500"
                >
                  {isOpen ? (
                    <Minus className="size-6" strokeWidth={1.5} />
                  ) : (
                    <Plus className="size-6" strokeWidth={1.5} />
                  )}
                </span>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={
                        reduce ? { duration: 0 } : { duration: 0.4, ease: EASE }
                      }
                      className="overflow-hidden"
                    >
                      <p className="pe-14 pb-4 text-[14px] leading-6 text-slate-600">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
