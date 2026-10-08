"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Living hero backdrop. A dark ink base overlaid with soft radial "aurora"
 * blobs that slowly drift and breathe, plus a faint grid, giving the hero depth
 * and life without competing with the foreground copy.
 *
 * All motion is slow, low-contrast and GPU-friendly (transform/opacity only).
 * Under `prefers-reduced-motion` the blobs render in a fixed resting position.
 */
export function MainBackground({
  tone = "solid",
}: {
  /** "solid" = fully opaque ink base (home hero); "translucent" = bg-ink/90,
   * letting the video/gradient layers underneath (solutions, industries) show through. */
  tone?: "solid" | "translucent";
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className={`absolute inset-0 -z-1 overflow-hidden ${tone === "translucent" ? "bg-ink/90" : "bg-ink"}`}
    >
      {/* Primary brand glow — top-left, wide and soft. */}
      <motion.div
        aria-hidden
        className="absolute -start-[12%] -top-[18%] h-[46rem] w-[46rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(28,151,212,0.34), rgba(28,151,212,0) 68%)",
          filter: "blur(8px)",
        }}
        animate={
          reduce
            ? undefined
            : { x: [0, 46, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }
        }
        transition={
          reduce
            ? undefined
            : { duration: 20, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Accent glow — mid-right, cooler and smaller, drifts on its own clock. */}
      <motion.div
        aria-hidden
        className="absolute end-[2%] top-[24%] h-[34rem] w-[34rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(55,120,247,0.24), rgba(55,120,247,0) 70%)",
          filter: "blur(8px)",
        }}
        animate={
          reduce
            ? undefined
            : { x: [0, -40, 0], y: [0, 36, 0], scale: [1, 1.12, 1] }
        }
        transition={
          reduce
            ? undefined
            : { duration: 26, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
        }
      />

      {/* Deep cyan pool — lower-centre, anchors the composition. */}
      <motion.div
        aria-hidden
        className="absolute bottom-[-14%] start-[38%] h-[30rem] w-[30rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(79,195,247,0.18), rgba(79,195,247,0) 72%)",
          filter: "blur(10px)",
        }}
        animate={reduce ? undefined : { y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={
          reduce
            ? undefined
            : { duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }
        }
      />
    </div>
  );
}
