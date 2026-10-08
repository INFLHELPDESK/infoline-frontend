"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * "Part of Omantel group" chip from the hero ("bouncing-card" in Figma):
 * a frosted pill that bobs gently, with a pulsing brand dot.
 */
export default function HeroBadge({ label }: { label: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      className="inline-flex h-9 items-center whitespace-nowrap gap-2 rounded-full bg-white/20 ps-1 pe-4 text-[13px] text-white backdrop-blur-xl"
      animate={reduce ? undefined : { y: [0, -5, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="relative grid size-6.5 place-items-center rounded-full bg-white/15">
        {!reduce && (
          <span
            aria-hidden
            className="absolute inset-1 animate-ping rounded-full bg-brandblue-400/60"
          />
        )}
        <span aria-hidden className="relative size-2 rounded-full bg-brandblue-400" />
      </span>
      {label}
    </motion.span>
  );
}
