"use client";

import { useRef, type ReactNode } from "react";

/**
 * Pointer-following glow for the dark capability cards: a soft brand-blue
 * radial highlight tracks the cursor. Pure CSS variables — no re-renders.
 * Hidden on touch (no hover) and for reduced motion via `motion-safe`.
 */
export default function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--gx", `${e.clientX - r.left}px`);
        el.style.setProperty("--gy", `${e.clientY - r.top}px`);
      }}
      className={`group/glow relative ${className}`}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 motion-safe:group-hover/glow:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--gx, 50%) var(--gy, 50%), rgba(28,151,212,0.16), transparent 60%)",
        }}
      />
    </div>
  );
}
