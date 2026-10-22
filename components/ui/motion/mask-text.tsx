"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { CSSProperties } from "react";
import { EASE } from "./shared";

/**
 * Masked, word-by-word text reveal — the signature "editorial" entrance where
 * each word rises from behind an invisible clip mask with a soft blur and a
 * staggered cascade. Used for hero and section headings to give the page a
 * cinematic, Framer-template feel.
 *
 * Takes an array of {@link MaskSegment}s so a single continuous reveal can span
 * differently-styled runs (e.g. a coloured accent phrase inside a heading) while
 * keeping one shared stagger timeline.
 *
 * i18n / RTL: the reveal is purely vertical, so it is inherently direction-safe.
 * Words keep DOM order, so the browser handles bidi shaping and wrapping.
 * Respects `prefers-reduced-motion` (words fade in place: no travel, no blur).
 *
 * Standalone it self-triggers on scroll (`whileInView`). Pass `orchestrated` to
 * drop it inside a <Stagger> instead: it then declares only its `hidden`/`show`
 * variants and inherits the play state from the parent, nesting its per-word
 * cascade under the parent's timeline. This avoids the double-trigger you'd get
 * from a self-animating child living inside a variant container.
 */
type Tag = "h1" | "h2" | "h3" | "p" | "span" | "div";

export type MaskSegment = { text: string; className?: string };

const containerVariants = (
  staggerChildren: number,
  delayChildren: number,
): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

const wordVariants = (
  duration: number,
  blur: boolean,
  reduce: boolean,
): Variants => ({
  hidden: {
    y: "112%",
    opacity: 0,
    ...(blur ? { filter: "blur(8px)" } : {}),
  },
  show: {
    y: "0%",
    opacity: 1,
    ...(blur ? { filter: "blur(0px)" } : {}),
    // Reduced motion: fade only; travel and blur snap straight to their end values.
    transition: reduce
      ? {
          duration: 0.4,
          ease: "easeOut",
          y: { duration: 0 },
          filter: { duration: 0 },
        }
      : { duration, ease: EASE },
  },
});

// The clip window. `overflow: hidden` hides the word until it rises into place;
// the padding/negative-margin pair gives descenders (g, y, p) room so they are
// not shaved off by the mask.
const clipStyle: CSSProperties = {
  display: "inline-block",
  overflow: "hidden",
  verticalAlign: "top",
  paddingBottom: "0.16em",
  marginBottom: "-0.16em",
};

const innerStyle: CSSProperties = {
  display: "inline-block",
  willChange: "transform, opacity, filter",
};

export function MaskText({
  segments,
  as = "span",
  className,
  stagger = 0.075,
  delayChildren = 0.05,
  duration = 0.9,
  blur = true,
  once = true,
  amount = 0.4,
  orchestrated = false,
}: {
  segments: MaskSegment[];
  as?: Tag;
  className?: string;
  /** Delay between each word, in seconds. */
  stagger?: number;
  /** Delay before the first word starts, in seconds. */
  delayChildren?: number;
  duration?: number;
  blur?: boolean;
  once?: boolean;
  /** Fraction of the element visible before it triggers (0–1). */
  amount?: number;
  /**
   * Inherit the play state from a parent <Stagger> instead of self-triggering.
   * When true, no `initial`/`whileInView`/`viewport` is set — the parent drives
   * the reveal and this element nests its word cascade under it.
   */
  orchestrated?: boolean;
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.span;
  // When orchestrated, the parent supplies initial/animate via propagation.
  const trigger = orchestrated
    ? {}
    : ({ initial: "hidden", whileInView: "show", viewport: { once, amount } } as const);

  // The split tree must not depend on `reduce`: the server always renders it with
  // reduce=false, so a client-only branch would leave the server's hidden words
  // in the DOM forever (same hazard as Reveal).
  const wv = wordVariants(duration, blur, !!reduce);

  return (
    <MotionTag
      className={className}
      variants={containerVariants(reduce ? 0 : stagger, reduce ? 0 : delayChildren)}
      {...trigger}
    >
      {segments.map((seg, si) => {
        // Split on whitespace but keep the separators so spacing/wrapping survive.
        const tokens = seg.text.split(/(\s+)/);
        return (
          <span key={si} className={seg.className}>
            {tokens.map((tok, ti) => {
              if (tok === "") return null;
              // Real whitespace → a plain, breakable space between words.
              if (/^\s+$/.test(tok)) return " ";
              return (
                <span key={ti} style={clipStyle}>
                  <motion.span style={innerStyle} variants={wv}>
                    {tok}
                  </motion.span>
                </span>
              );
            })}
            {/* Keep a space between adjacent segments. */}
            {si < segments.length - 1 ? " " : null}
          </span>
        );
      })}
    </MotionTag>
  );
}
