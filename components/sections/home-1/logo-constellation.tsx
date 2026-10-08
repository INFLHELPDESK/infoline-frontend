"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/components/ui/motion/shared";

export type ClientLogo = { src: string; name: string };

/**
 * Logos arranged as two staggered clusters around a central Infoline tile.
 *
 * Desktop: five columns — [outer][inner][centre][inner][outer]; inner columns
 * sit higher, outer ones lower, like the Figma frame. Each tile pops in from
 * the centre outwards, then drifts gently on its own phase. Hovering a tile
 * shows the client's name in a pill above it (Figma "Frame 11").
 * Mobile: centre tile first, then a two-column grid.
 */
export default function LogoConstellation({
  logos,
  centerAlt,
}: {
  logos: ClientLogo[];
  centerAlt: string;
}) {
  const reduce = useReducedMotion();

  // Split into four columns around the centre: outer-start, inner-start,
  // inner-end, outer-end (round-robin keeps both sides balanced).
  const cols: ClientLogo[][] = [[], [], [], []];
  const order = [1, 2, 0, 3];
  logos.forEach((logo, i) => cols[order[i % 4]].push(logo));

  const tile = (logo: ClientLogo, ring: number, i: number) => (
    <motion.div
      key={logo.src + logo.name}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.1 + ring * 0.15 + i * 0.08 }}
      className="group relative"
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -7, 0] }}
        transition={{
          duration: 5 + ((i + ring) % 3),
          repeat: Infinity,
          ease: "easeInOut",
          delay: (i * 0.7 + ring * 0.4) % 2.5,
        }}
        className="relative grid h-[104px] w-full place-items-center rounded-2xl bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-shadow duration-500 group-hover:shadow-[0_24px_48px_-24px_rgba(28,151,212,0.45)] sm:h-[118px] lg:w-[218px]"
      >
        <Image
          src={logo.src}
          alt={logo.name}
          width={140}
          height={72}
          className="h-14 w-auto max-w-[70%] object-contain grayscale-[35%] transition-[filter] duration-500 group-hover:grayscale-0 sm:h-[60px]"
        />
        {/* Name pill on hover */}
        <span className="pointer-events-none absolute -top-4 start-1/2 z-10 max-w-[260px] -translate-x-1/2 translate-y-1 truncate rounded-full border border-brandblue-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 opacity-0 shadow-[0_2px_12px_rgba(171,215,237,0.4)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 rtl:translate-x-1/2">
          {logo.name}
        </span>
      </motion.div>
    </motion.div>
  );

  const centre = (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.9, ease: EASE }}
      className="relative mx-auto grid h-[120px] w-[218px] place-items-center rounded-2xl bg-brandblue-600 shadow-[0_30px_60px_-28px_rgba(21,122,172,0.8)]"
    >
      {!reduce && (
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-2xl bg-brandblue-500/20 [animation-duration:3s]"
        />
      )}
      <Image
        src="/assets/logo.svg"
        alt={centerAlt}
        width={96}
        height={26}
        className="relative h-6.5 w-auto"
      />
    </motion.div>
  );

  return (
    <>
      {/* Desktop constellation */}
      <div className="hidden items-center justify-between gap-6 lg:flex">
        <div className="flex flex-col gap-4 pt-28">{cols[0].map((l, i) => tile(l, 2, i))}</div>
        <div className="flex flex-col gap-4 pb-28">{cols[1].map((l, i) => tile(l, 1, i))}</div>
        {centre}
        <div className="flex flex-col gap-4 pb-28">{cols[2].map((l, i) => tile(l, 1, i))}</div>
        <div className="flex flex-col gap-4 pt-28">{cols[3].map((l, i) => tile(l, 2, i))}</div>
      </div>

      {/* Mobile / tablet */}
      <div className="lg:hidden">
        {centre}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {logos.map((l, i) => tile(l, 1, i))}
        </div>
      </div>
    </>
  );
}
