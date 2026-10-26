"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { EASE, directionOffset, type RevealDirection } from "./shared";

/**
 * Scroll-reveal wrapper (bold / cinematic): fades, slides and blurs its child
 * into place the first time it enters the viewport. By default it plays only
 * once and stays put afterwards (pass `once={false}` to replay on re-entry).
 *
 * It is a thin client "island" — the `children` passed in stay server-rendered,
 * so wrapping content in <Reveal> does NOT turn the surrounding section into a
 * client component.
 *
 * RTL: `direction="start" | "end"` is resolved against the active locale, so
 * horizontal entrances mirror correctly. `up`/`down` are direction-agnostic.
 * Respects `prefers-reduced-motion` (fade only, no travel or blur).
 */
type MotionTag =
  | "div"
  | "section"
  | "span"
  | "p"
  | "ul"
  | "li"
  | "article"
  | "header"
  | "figure"
  | "h1"
  | "h2"
  | "h3";

type RevealProps = {
  children: ReactNode;
  as?: MotionTag;
  direction?: RevealDirection;
  delay?: number;
  distance?: number;
  duration?: number;
  blur?: boolean;
  once?: boolean;
  /** Fraction of the element that must be visible before it triggers (0–1). */
  amount?: number;
  className?: string;
};

export function Reveal({
  children,
  as = "div",
  direction = "up",
  delay = 0,
  distance = 64,
  duration = 0.9,
  blur = true,
  once = true,
  amount = 0.3,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();
  const isRtl = useLocale() === "ar";
  const MotionTag = motion[as] as typeof motion.div;

  const { x, y } = directionOffset(direction, distance, isRtl);

  // `initial` must not depend on `reduce`: the server always renders it with
  // reduce=false, and a client-only difference would leave the server's
  // blur/offset in the DOM forever. Reduced motion instead snaps x/y/filter to
  // their final values on reveal (no travel, no blur) and only fades.
  return (
    <MotionTag
      initial={{ opacity: 0, x, y, filter: blur ? "blur(14px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={
        reduce
          ? {
              duration: 0.4,
              ease: "easeOut",
              delay,
              x: { duration: 0, delay },
              y: { duration: 0, delay },
              filter: { duration: 0, delay },
            }
          : { duration, ease: EASE, delay }
      }
      className={className}
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </MotionTag>
  );
}
