"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useState, type PointerEvent, type ReactNode } from "react";

/**
 * Interactive card shell: a soft radial "spotlight" follows the pointer across
 * the card and the card lifts on a spring while hovered.
 *
 * - The glow is positioned from the pointer's physical coordinates, so it is
 *   inherently direction-safe (identical behaviour in LTR and RTL).
 * - Mouse only: touch and pen never trigger the glow, so taps don't leave a
 *   stuck highlight on mobile.
 * - `prefers-reduced-motion`: the lift is disabled; the glow (a colour change,
 *   not movement) is kept.
 *
 * The children stay server-rendered — this is a thin client island, like
 * <Reveal>. Place it INSIDE a <StaggerItem> (not instead of one) so the
 * scroll-reveal transform and the hover lift never fight over `y`.
 */
type Tag = "div" | "li" | "article";

const TONES = {
  dark: "rgba(116, 192, 231, 0.16)",
  light: "rgba(28, 151, 212, 0.09)",
} as const;

export function SpotlightCard({
  children,
  as = "div",
  className = "",
  tone = "light",
  radius = 360,
  lift = 6,
}: {
  children: ReactNode;
  as?: Tag;
  className?: string;
  /** Glow colour preset: `dark` for cards on ink backgrounds, `light` on white. */
  tone?: keyof typeof TONES;
  /** Radius of the spotlight in px. */
  radius?: number;
  /** Hover lift in px (0 to disable). */
  lift?: number;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);

  // Pointer position relative to the card, smoothed so the glow glides.
  const mx = useMotionValue(-radius);
  const my = useMotionValue(-radius);
  const sx = useSpring(mx, { stiffness: 380, damping: 40, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 380, damping: 40, mass: 0.4 });
  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${sx}px ${sy}px, ${TONES[tone]}, transparent 70%)`;

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
    if (!active) setActive(true);
  };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      className={`relative isolate ${className}`}
      onPointerMove={onMove}
      onPointerLeave={() => setActive(false)}
      animate={{ y: active && !reduce ? -lift : 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.6 }}
    >
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
        style={{ background }}
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
    </MotionTag>
  );
}
