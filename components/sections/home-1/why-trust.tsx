"use client";

import { useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import Image from "next/image";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { EASE } from "@/components/ui/motion/shared";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow, sectionTitle } from "./shared";

type Point = { number: string; title: string; image: string; imageAlt: string };

/** Viewport-heights of scroll spent on each reason. */
const STEP_VH = 80;
/** Angle of the "clock hand" from straight down, towards the reading start. */
const HAND_DEG = 35;
/**
 * Fraction of each step's scroll range used to sweep the photo in; the rest is
 * a dwell where the photo stays full while the reason reads.
 */
const REVEAL_PORTION = 0.62;

/**
 * Section 2 — "Built on trust. Proven under pressure."
 *
 * Pinned storytelling modelled on the reference recording: a stacked step
 * counter on the reading-start side, a circular photo in the middle with a
 * "clock hand" line from its centre, and the reason on the end side.
 * The circle starts empty; each photo sweeps in radially from the hand, like a
 * clock (reference screen recording). After the last reason the pin releases and
 * the page simply scrolls on to the next section.
 *
 * - The sweep is scrubbed directly by scroll progress (smoothed by a spring),
 *   so it tracks the gesture exactly and reverses naturally when scrolling up —
 *   no fixed-duration replays that lag behind the scroll.
 * - RTL: grid order follows `dir`, the hand points the other way and the
 *   sweep turns clockwise.
 * - Reduced motion: a static, stacked list (the Figma frame's layout).
 */
export default function WhyTrust() {
  const t = useTranslations("HomeV1.whyTrust");
  const points = t.raw("points") as Point[];
  const titleLines = t.raw("titleLines") as string[];
  const reduce = useReducedMotion();

  return (
    <section className="relative bg-[#f6f8f9] text-[#1a1a1c]">
      <Stagger
        as="div"
        className="mx-auto flex max-w-[760px] flex-col items-center px-6 pt-20 text-center sm:pt-24 lg:pt-25"
        stagger={0.12}
      >
        <StaggerItem distance={24}>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
        </StaggerItem>
        <StaggerItem as="h2" className={`mt-8 ${sectionTitle}`}>
          {titleLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </StaggerItem>
        <StaggerItem
          as="p"
          className="mt-6 max-w-[687px] text-[15px] leading-6 text-slate-700 sm:text-[16px]"
        >
          {t("description")}
        </StaggerItem>
      </Stagger>

      {reduce ? <StaticList points={points} /> : <PinnedStory points={points} />}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Pinned story                                */
/* -------------------------------------------------------------------------- */

function PinnedStory({ points }: { points: Point[] }) {
  const t = useTranslations("HomeV1.whyTrust");
  const isRtl = useLocale() === "ar";
  const n = points.length;
  const trackVh = n * STEP_VH + 100;

  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // Smooth the raw scroll progress so the radial sweep glides instead of
  // stepping with the mouse wheel / trackpad. Stiff + well-damped keeps it
  // responsive (tracking the gesture) rather than slippery.
  const smoothP = useSpring(p, {
    stiffness: 260,
    damping: 42,
    mass: 0.32,
    restDelta: 0.0005,
  });

  // The reason text / counter / dots change on discrete steps. The circle photos
  // scrub continuously off `smoothP`, so the circle simply starts empty at p=0.
  const [active, setActive] = useState(0);
  useMotionValueEvent(p, "change", (v) => {
    const next = Math.min(n - 1, Math.max(0, Math.floor(v * n)));
    setActive((prev) => (prev === next ? prev : next));
  });

  // The hand points down towards the reading-start side; the photos sweep
  // round from it (counter-clockwise in LTR, clockwise in RTL).
  const handDeg = isRtl ? -HAND_DEG : HAND_DEG;

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const distance = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / n) * distance, behavior: "smooth" });
  };

  const current = points[active];

  return (
    <div ref={trackRef} className="relative" style={{ height: `${trackVh}svh` }}>
      {/* Screen-reader version of the story — the visual one swaps content. */}
      <ol className="sr-only">
        {points.map((pt) => (
          <li key={pt.number}>
            {pt.number}. {pt.title}
          </li>
        ))}
      </ol>

      <div aria-hidden className="sticky top-0 h-svh overflow-hidden">
        {/* Blueprint guide lines (Figma "Lines ///") */}
        <div className="pointer-events-none absolute inset-y-0 start-1/2 w-full max-w-[1280px] -translate-x-1/2 border-x border-[#d6d6d6] max-md:hidden rtl:translate-x-1/2" />

        <div className="relative mx-auto grid h-full w-full max-w-[1280px] grid-rows-[auto_1fr_auto] items-center gap-6 px-6 pt-24 pb-8 md:px-12 lg:grid-cols-[1fr_auto_1fr] lg:grid-rows-1 lg:gap-12 lg:px-10 lg:py-0">
          {/* Counter (reading-start side) */}
          <div className="flex items-center justify-between gap-6 lg:block lg:self-center">
            <Ticker points={points} active={active} />

            {/* On small screens the reason sits beside the counter */}
            <StepTitle
              key={`m-${current.number}`}
              text={current.title}
              className="max-w-[60%] text-end text-[16px] leading-6 lg:hidden"
            />
          </div>

          {/* Circle */}
          <div className="relative grid place-items-center self-center justify-self-center">
            <div className="relative size-[min(80vw,44svh)] overflow-hidden rounded-full lg:size-[clamp(300px,34vw,500px)]">
              {points.map((pt, i) => (
                <SweepLayer
                  key={pt.number}
                  point={pt}
                  index={i}
                  total={n}
                  progress={smoothP}
                  fromDeg={180 + handDeg}
                  clockwise={isRtl}
                />
              ))}
            </div>

            {/* Clock hand + centre dot */}
            <span
              style={{ transform: `rotate(${handDeg}deg)` }}
              className="pointer-events-none absolute start-1/2 top-1/2 h-[120svh] w-px origin-top bg-[#1a1a1c]/80"
            />
            <span className="pointer-events-none absolute start-1/2 top-1/2 z-10 size-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1a1a1c] rtl:translate-x-1/2" />
          </div>

          {/* Reason (reading-end side, desktop) */}
          <div className="relative self-center max-lg:hidden">
            <span className="absolute inset-x-0 top-1/2 h-px bg-[#d6d6d6]" />
            <div className="relative bg-[#f6f8f9] py-6 ps-6">
              <StepTitle
                key={`d-${current.number}`}
                text={current.title}
                className="max-w-[332px] text-[20px] leading-9 font-medium"
              />
            </div>
          </div>

          {/* Step navigation */}
          <div className="flex justify-center gap-2 lg:absolute lg:inset-x-0 lg:bottom-10">
            {points.map((pt, i) => (
              <button
                key={pt.number}
                type="button"
                tabIndex={-1}
                onClick={() => goTo(i)}
                aria-label={`${t("goToLabel")} ${pt.number}`}
                className="group grid h-6 place-items-center px-0.5"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-500 ${
                    i === active
                      ? "w-10 bg-brandblue-500"
                      : "w-5 bg-[#cfd8dc] group-hover:bg-slate-400"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Vertical step counter from the reference: previous / current / next stacked,
 * the current one dark with "• 04" beside it, sliding up on each step.
 */
function Ticker({ points, active }: { points: Point[]; active: number }) {
  const total = String(points.length).padStart(2, "0");
  return (
    <div className="relative h-[108px] overflow-hidden lg:h-[132px]">
      <motion.ol
        initial={false}
        animate={{ y: `calc(${1 - active} * var(--row))` }}
        transition={{ duration: 0.7, ease: EASE }}
        className="[--row:36px] lg:[--row:44px]"
      >
        {points.map((pt, i) => (
          <li
            key={pt.number}
            className={`flex h-(--row) items-center gap-3 tabular-nums transition-[color,opacity] duration-500 ${
              i === active ? "text-[#1a1a1c]" : "text-[#b0bec5]"
            }`}
          >
            <span className="text-[24px] font-semibold lg:text-[28px]">{pt.number}</span>
            <span
              className={`flex items-center gap-2 text-[14px] font-medium text-slate-500 transition-opacity duration-500 ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="size-1.5 rounded-full bg-[#1a1a1c]" />
              {total}
            </span>
          </li>
        ))}
      </motion.ol>
      {/* Fade the rows above/below */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#f6f8f9] to-transparent" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#f6f8f9] to-transparent" />
    </div>
  );
}

/**
 * One photo in the circle, revealed by a radial "clock" sweep that starts at
 * the hand and goes all the way round (conic mask). The sweep is scrubbed
 * straight off scroll progress: it fills over the first part of its step's
 * range and then dwells, and unwinds smoothly when you scroll back up.
 */
function SweepLayer({
  point,
  index,
  total,
  progress,
  fromDeg,
  clockwise,
}: {
  point: Point;
  index: number;
  total: number;
  progress: MotionValue<number>;
  fromDeg: number;
  clockwise: boolean;
}) {
  // This layer's slice of the overall scroll: [start, end]. The photo sweeps in
  // over the first REVEAL_PORTION of it, then holds full for the dwell.
  const start = index / total;
  const end = (index + 1) / total;
  const revealEnd = start + (end - start) * REVEAL_PORTION;
  const sweep = useTransform(progress, [start, revealEnd], [0, 360]);

  const mask = useTransform(sweep, (x) =>
    clockwise
      ? `conic-gradient(from ${fromDeg}deg, #000 0deg ${x}deg, transparent ${Math.min(360, x + 0.6)}deg)`
      : `conic-gradient(from ${fromDeg}deg, transparent 0deg ${Math.max(0, 359.4 - x)}deg, #000 ${360 - x}deg)`,
  );
  // A touch of zoom-out while it sweeps in, for depth.
  const scale = useTransform(sweep, [0, 360], [1.12, 1]);

  return (
    <motion.div
      style={{ zIndex: index, maskImage: mask, WebkitMaskImage: mask }}
      className="absolute inset-0"
    >
      <motion.div style={{ scale }} className="absolute inset-0">
        <Image
          src={point.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 500px, 80vw"
          className="object-cover"
          priority={index === 0}
        />
      </motion.div>
    </motion.div>
  );
}

/** Reason text that rises in word by word each time the step changes. */
function StepTitle({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <p className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-0.5 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.55, ease: EASE, delay: i * 0.035 }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Reduced-motion static layout                       */
/* -------------------------------------------------------------------------- */

function StaticList({ points }: { points: Point[] }) {
  return (
    <ol className="mx-auto flex max-w-[1280px] flex-col gap-16 px-6 py-20 md:px-12 lg:px-10">
      {points.map((pt) => (
        <li
          key={pt.number}
          className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]"
        >
          <div>
            <span className="text-[24px] font-semibold">{pt.number}</span>
            <span className="mt-2 block h-px w-46 bg-[#1a1a1c]" />
          </div>
          <div className="relative size-[min(80vw,473px)] overflow-hidden rounded-full">
            <Image src={pt.image} alt={pt.imageAlt} fill sizes="473px" className="object-cover" />
          </div>
          <p className="max-w-[332px] text-[20px] leading-9 font-medium">{pt.title}</p>
        </li>
      ))}
    </ol>
  );
}
