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
    // `initial` must not depend on `reduce`: the server always renders it with
    // reduce=false, and a client-only difference would leave the server's
    // translateY(14px) in the DOM forever. Reduced motion instead snaps `y` to
    // 0 on mount (no travel) and only fades.
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0.25, ease: EASE, y: { duration: 0 } }
          : { duration: 0.6, ease: EASE }
      }
    >
      {children}
    </motion.div>
  );
}
