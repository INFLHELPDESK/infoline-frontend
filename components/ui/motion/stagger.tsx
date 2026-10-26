"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { EASE, directionOffset, type RevealDirection } from "./shared";

/**
 * Staggered scroll reveal for grids and lists.
 *
 * <Stagger> is the container: it holds the animation state and orchestrates the
 * timing. Each direct child should be a <StaggerItem>, which only declares the
 * `hidden`/`show` variants and INHERITS the play state from the container via
 * framer-motion's variant propagation. The content inside each item stays
 * server-rendered.
 *
 * RTL-aware and reduced-motion-aware (falls back to a plain fade).
 */
type ContainerTag = "div" | "ul" | "ol" | "section" | "dl";
type ItemTag =
  | "div"
  | "li"
  | "article"
  | "span"
  | "p"
  | "h1"
  | "h2"
  | "h3";

const containerVariants = (
  staggerChildren: number,
  delayChildren: number,
): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

export function Stagger({
  children,
  as = "div",
  className,
  stagger = 0.12,
  delayChildren = 0.1,
  once = true,
  amount = 0.2,
}: {
  children: ReactNode;
  as?: ContainerTag;
  className?: string;
  /** Delay between each child, in seconds. */
  stagger?: number;
  /** Delay before the first child starts, in seconds. */
  delayChildren?: number;
  once?: boolean;
  amount?: number;
}) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      variants={containerVariants(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({
  children,
  as = "div",
  className,
  direction = "up",
  distance = 56,
  duration = 0.8,
  blur = true,
}: {
  children: ReactNode;
  as?: ItemTag;
  className?: string;
  direction?: RevealDirection;
  distance?: number;
  duration?: number;
  blur?: boolean;
}) {
  const reduce = useReducedMotion();
  const isRtl = useLocale() === "ar";
  const MotionTag = motion[as] as typeof motion.div;

  // `hidden` must not depend on `reduce`: the server always renders it with
  // reduce=false, and a client-only difference would leave the server's
  // blur/translate in the DOM forever. Reduced motion instead snaps x/y/filter
  // to their final values on reveal (no travel, no blur) and only fades.
  const { x, y } = directionOffset(direction, distance, isRtl);
  const variants: Variants = {
    hidden: { opacity: 0, x, y, filter: blur ? "blur(10px)" : "blur(0px)" },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: reduce
        ? {
            duration: 0.4,
            ease: "easeOut",
            x: { duration: 0 },
            y: { duration: 0 },
            filter: { duration: 0 },
          }
        : { duration, ease: EASE },
    },
  };

  return (
    <MotionTag
      variants={variants}
      className={className}
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </MotionTag>
  );
}
