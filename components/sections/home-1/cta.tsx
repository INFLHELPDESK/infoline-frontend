"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { Stagger, StaggerItem, useAmbientVideo } from "@/components/ui/motion";
import { PillButton } from "./shared";

/**
 * Shared closing call to action, "Start with the outcome you need" (Figma
 * handoff, 1280×422 block above the footer). The smoke photo sits at 30% over
 * black and fades to solid black towards the footer, drifting with a light
 * scroll parallax. Sits directly above the site footer, which is also black.
 *
 * The approved footage (Figma 4779866-hd_1920_1080_30fps) is mounted only after
 * mount, and only when the user has not asked for reduced motion or data
 * saving, so the server and first client render are identical (still image).
 * It loads nothing until the section nears the viewport and pauses whenever it
 * scrolls away or the tab is hidden. The still is the poster and fallback.
 */
export default function Cta() {
  const t = useTranslations("HomeV1.cta");
  const ref = useRef<HTMLElement>(null);
  const { videoRef, enabled, playing, onPlaying } = useAmbientVideo(ref);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // Ranges must not depend on `useReducedMotion` (server renders it as false, so
  // a client-only difference mismatches hydration). Reduced motion is applied in
  // CSS instead (`motion-reduce:transform-none!`).
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1.12, 1]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-black text-white">
      <motion.div
        style={{ y, scale }}
        className="absolute inset-x-0 top-0 -z-10 h-[125%] motion-reduce:transform-none! lg:h-[140%]"
      >
        <Image
          src={t("image")}
          alt=""
          fill
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-500 ${playing ? "opacity-0" : "opacity-30"}`}
        />
        {enabled && (
          <video
            ref={videoRef}
            aria-hidden
            data-testid="cta-video"
            className="absolute inset-0 size-full object-cover object-center opacity-30"
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            onPlaying={onPlaying}
          >
            <source src="/videos/4779866-hd_1920_1080_30fps.mp4" type="video/mp4" />
          </video>
        )}
      </motion.div>
      {/* Brand-blue tint (Figma: #1C97D4 at 16%) */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#1c97d4]/16" />
      {/* Melt to black towards the footer (Figma: transparent → #000, top to bottom) */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-black" />

      <Stagger
        as="div"
        className="mx-auto flex max-w-[845px] flex-col items-center px-6 pt-24 pb-20 text-center sm:pt-28 lg:pt-[67px] lg:pb-[67px]"
        stagger={0.14}
      >
        <StaggerItem
          as="h2"
          className="max-w-[629px] text-[36px] leading-[1.1] font-medium tracking-[-0.02em] sm:text-5xl lg:text-[56px] lg:leading-[70px] lg:font-black lg:tracking-normal"
        >
          {t("title")}
        </StaggerItem>
        <StaggerItem as="p" className="mt-4 max-w-[425px] text-[15px] leading-6 text-[#cfd8dc] sm:text-[16px]">
          {t("description")}
        </StaggerItem>
        <StaggerItem className="mt-9">
          <PillButton
            href={t("cta.href")}
            iconClassName="size-6"
            className="w-[243px] rounded-[8px]! px-5 text-[18px] shadow-[0_8px_24px_-12px_rgba(28,151,212,0.5)] sm:text-[18px]"
          >
            {t("cta.label")}
          </PillButton>
        </StaggerItem>
      </Stagger>
    </section>
  );
}
