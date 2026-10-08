"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * Hairline reading-progress bar pinned to the top of the viewport.
 *
 * RTL: grows from the reading-start edge (left in LTR, right in RTL) via the
 * `rtl:` transform-origin variant, so nothing is hard-coded to a physical side.
 * Reduced motion: tracks scroll 1:1 without the spring overshoot.
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-brandblue-500 to-lightblue-300 rtl:origin-right rtl:bg-gradient-to-l"
      style={{ scaleX: reduce ? scrollYProgress : smooth }}
    />
  );
}
