"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/components/ui/motion/shared";

/**
 * Route-level entrance: a template (unlike a layout) re-mounts on every
 * navigation, so each page fades up softly as it arrives. Header and footer
 * live in the layout and stay put.
 *
 * Only opacity + y are animated. Framer resets an identity transform to
 * `none` when the animation settles, so this wrapper never leaves a lasting
 * containing block that would break `position: fixed/sticky` descendants
 * (which is also why there is deliberately no blur filter here).
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.25 : 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
