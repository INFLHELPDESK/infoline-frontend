"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { PillButton } from "./shared";

/**
 * Section 8 — "Start with the outcome you need". Architecture photo that
 * melts into black on every side (Figma Rectangles 5309–5311), drifting with
 * a light scroll parallax, and the closing call to action. Sits directly
 * above the site footer, which is also black.
 */
export default function Cta() {
  const t = useTranslations("HomeV1.cta");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5], reduce ? [1, 1] : [1.12, 1]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-black text-white">
      <motion.div style={{ y, scale }} className="absolute inset-x-0 top-0 -z-10 h-[125%] lg:h-[637px]">
        <Image
          src={t("image")}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>
      {/* Melt to black: bottom, and both sides */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.55)_30%,#000_70%)]" />
      <div aria-hidden className="absolute inset-y-0 start-0 -z-10 w-1/3 bg-gradient-to-r from-black to-transparent rtl:bg-gradient-to-l" />
      <div aria-hidden className="absolute inset-y-0 end-0 -z-10 w-1/3 bg-gradient-to-l from-black to-transparent rtl:bg-gradient-to-r" />

      <Stagger
        as="div"
        className="mx-auto flex max-w-[845px] flex-col items-center px-6 pt-24 pb-20 text-center sm:pt-28 lg:pt-17 lg:pb-24"
        stagger={0.14}
      >
        <StaggerItem
          as="h2"
          className="max-w-[629px] text-[36px] leading-[1.1] font-medium tracking-[-0.02em] sm:text-5xl lg:text-[64px] lg:leading-[1.09]"
        >
          {t("title")}
        </StaggerItem>
        <StaggerItem as="p" className="mt-4 max-w-[425px] text-[15px] leading-6 text-[#e3e3e3] sm:text-[16px]">
          {t("description")}
        </StaggerItem>
        <StaggerItem className="mt-9">
          <PillButton href={t("cta.href")} className="min-w-[271px]">
            {t("cta.label")}
          </PillButton>
        </StaggerItem>
      </Stagger>
    </section>
  );
}
