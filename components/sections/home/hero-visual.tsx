"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Positions are % of the HeroVisual wrapper (top-left origin), tuned against
 * the design screenshot. chart.svg and percentage.svg carry their own
 * self-playing SMIL <animate> loops (line-draw + pulsing rings), so they
 * animate automatically once mounted — no framer-motion needed for that part.
 */
const CARDS = [
  {
    src: "/assets/hero/f2.svg", // headset icon
    w: 67,
    h: 80,
    top: "26%",
    start: "10%",
    depth: 22,
    float: 8,
    delay: 0,
  },
  {
    src: "/assets/hero/f3.svg", // waveform icon
    w: 62,
    h: 65,
    top: "41%",
    start: "0%",
    depth: 2,
    float: 10,
    delay: 0.4,
  },
  {
    src: "/assets/hero/f4.svg", // terminal icon
    w: 67,
    h: 75,
    top: "60%",
    start: "5%",
    depth: 20,
    float: 9,
    delay: 0.8,
  },
  {
    src: "/assets/hero/chart.svg", // animated line chart card
    w: 220,
    h: 160,
    top: "55%",
    start: "30%",
    depth: 38,
    float: 13,
    delay: 0.2,
  },
  {
    src: "/assets/hero/percentage.svg", // animated 80% circle card
    w: 150,
    h: 160,
    top: "65%",
    start: "54%",
    depth: 34,
    float: 12,
    delay: 1,
  },
] as const;

export default function HeroVisual() {
  const t = useTranslations("Main");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const prefersReduced = useReducedMotion();
  const enabled = isDesktop && !prefersReduced;

  const wrapRef = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 120, damping: 20, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 120, damping: 20, mass: 0.4 });

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start end", "end start"],
  });

  const yImg = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };

  const resetMove = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={resetMove}
      className="relative h-full w-full"
    >
      {/* Art box — vertically centred in the column and height-capped
          (min of 92% of the column and 46vw) so the 675×550 artwork can never
          scale past the column width or the fold on tall/short viewports.
          object-bottom-left keeps people + circle pinned to the box's own
          baseline. Mobile stays in normal flow (relative, w-full). */}
      {/* Blue backdrop shape — its own layer behind the arc so it can mirror
          in RTL (rtl:-scale-x-100 on the image). Shares arc.svg's 675×550
          viewBox + identical object-fit and the same yImg parallax, so it
          stays pixel-locked to the people image on scroll. */}
      <motion.div
        style={enabled ? { y: yImg } : undefined}
        aria-hidden
        className="pointer-events-none absolute inset-0 lg:inset-x-0 lg:inset-y-0 lg:my-auto lg:h-[min(92%,46vw)]"
      >
        <Image
          src="/assets/hero/shape.svg"
          alt=""
          aria-hidden
          width={680}
          height={550}
          className="h-full w-full object-contain object-bottom-left rtl:-scale-x-100"
        />
      </motion.div>

      <motion.div
        style={enabled ? { y: yImg } : undefined}
        className="relative w-full lg:absolute lg:inset-x-0 lg:inset-y-0 lg:my-auto lg:h-[min(92%,46vw)]"
      >
        <Image
          src="/assets/hero/arc.png"
          alt={t("heroImageAlt")}
          width={1360}
          height={1108}
          priority
          className="h-auto w-full object-contain object-bottom-left lg:h-full"
        />
      </motion.div>

      {/* Desktop: absolute + parallax + idle bob. Hidden below lg.
          Uses the same geometry as the art box so the tuned % offsets stay
          locked to the artwork at every viewport size. */}
      <div className="pointer-events-none absolute inset-0 lg:inset-x-0 lg:inset-y-0 lg:my-auto lg:h-[min(92%,46vw)]">
        {CARDS.map((card, i) => (
          <FloatingCard
            key={`${card.src}-${i}`}
            card={card}
            sx={sx}
            sy={sy}
            enabled={enabled}
          />
        ))}
      </div>
    </div>
  );
}

function FloatingCard({
  card,
  sx,
  sy,
  enabled,
}: {
  card: (typeof CARDS)[number];
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  enabled: boolean;
}) {
  const x = useTransform(sx, (v) => -v * card.depth);
  const y = useTransform(sy, (v) => -v * card.depth);

  return (
    <motion.div
      style={{
        insetBlockStart: card.top,
        insetInlineStart: card.start,
        ...(enabled ? { x, y } : {}),
      }}
      className="absolute"
    >
      <motion.div
        animate={enabled ? { y: [0, -card.float, 0] } : undefined}
        transition={
          enabled
            ? {
                duration: 5 + card.float / 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: card.delay,
              }
            : undefined
        }
      >
        <Image
          src={card.src}
          alt=""
          aria-hidden
          width={card.w}
          height={card.h}
          className="h-auto w-[clamp(48px,10vw,220px)] drop-shadow-[0_18px_40px_rgba(28,151,212,0.28)]"
        />
      </motion.div>
    </motion.div>
  );
}
