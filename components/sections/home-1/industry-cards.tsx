"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  Landmark,
  RadioTower,
  ShoppingBag,
  Truck,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EASE } from "@/components/ui/motion/shared";

export type IndustryCard = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
};

/** Time each card stays open while the rail auto-advances. */
const AUTO_MS = 5000;
const SPRING = { type: "spring", stiffness: 170, damping: 26, mass: 0.9 } as const;

/** Pick an icon from the sector id / slug (works for CMS slugs too). */
function iconFor(id: string): LucideIcon {
  const s = id.toLowerCase();
  if (/(gov|public|citizen)/.test(s)) return Landmark;
  if (/(telecom|tech)/.test(s)) return RadioTower;
  if (/(logistic|transport|touris)/.test(s)) return Truck;
  if (/(utilit|energy|environment)/.test(s)) return Zap;
  if (/(bank|bfsi|financ|insur|fintech)/.test(s)) return Wallet;
  if (/(real|commercial|consumer|retail)/.test(s)) return ShoppingBag;
  return Building2;
}

/**
 * Expanding industry rail (reference: the "Blonkisoaz" card GIF).
 *
 * Desktop: a row where the open card grows to fill the space and the others
 * collapse into tall pills with a vertical title and an icon at the foot.
 * Mobile: the same idea stacked vertically (open card tall, others short bars).
 *
 * Opens on hover, focus or tap, and auto-advances while on screen and idle.
 * On touch, the first tap on a closed card opens it; a tap on the open card
 * follows its link. RTL is free: the row follows `dir`, and vertical titles
 * rotate the same way in both languages.
 */
export default function IndustryCards({
  items,
  exploreLabel,
}: {
  items: IndustryCard[];
  exploreLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduce = useReducedMotion();
  const railRef = useRef<HTMLUListElement>(null);
  const inView = useInView(railRef, { amount: 0.4 });

  // Auto-advance, restarted whenever the open card changes.
  useEffect(() => {
    if (reduce || paused || !inView || items.length < 2) return;
    const id = window.setTimeout(
      () => setActive((i) => (i + 1) % items.length),
      AUTO_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, paused, inView, reduce, items.length]);

  const transition = reduce ? { duration: 0 } : SPRING;

  return (
    <ul
      ref={railRef}
      onPointerLeave={() => setPaused(false)}
      className="flex flex-col gap-3 lg:h-[394px] lg:flex-row lg:gap-6"
    >
      {items.map((item, i) => {
        const open = i === active;
        const SectorIcon = iconFor(item.id);

        return (
          <motion.li
            key={item.id}
            initial={false}
            // Both axes are always animated; CSS decides which one counts:
            // on desktop `lg:h-full!` overrides the mobile height and
            // flex-grow does the work, on mobile the column has no free
            // space so flex-grow is inert and the height does the work.
            // That keeps SSR (no media query yet) from flashing a wrong layout.
            animate={{
              flexGrow: open ? 1 : 0,
              height: open ? 360 : 72,
              borderRadius: open ? 24 : isDesktop ? 54 : 36,
            }}
            transition={transition}
            className="relative shrink-0 overflow-hidden border border-[#eeeeee] bg-ink lg:h-full! lg:min-w-[108px] lg:basis-[108px]"
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") {
                setPaused(true);
                setActive(i);
              }
            }}
          >
            <Link
              href={item.href}
              aria-label={`${item.title} — ${exploreLabel}`}
              onFocus={() => {
                setPaused(true);
                setActive(i);
              }}
              onClick={(e) => {
                if (!open) {
                  e.preventDefault();
                  setPaused(true);
                  setActive(i);
                }
              }}
              className="group absolute inset-0 block focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brandblue-300"
            >
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 620px, 100vw"
                className={`object-cover transition-transform duration-[1.2s] [transition-timing-function:cubic-bezier(.16,1,.3,1)] ${
                  open ? "scale-100" : "scale-110"
                } group-hover:scale-105`}
              />
              {/* Ink + brand washes (Figma: ink .1→.7 / .9, blue 0→.5 / .8) */}
              <span
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-b transition-opacity duration-700 ${
                  open
                    ? "from-[#061620]/10 to-[#061620]/70"
                    : "from-[#061620]/10 to-[#061620]/90"
                }`}
              />
              <span
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-b from-brandblue-500/0 transition-opacity duration-700 ${
                  open ? "to-brandblue-500/50" : "to-brandblue-500/80"
                }`}
              />

              {/* Collapsed content: vertical title (desktop) or row (mobile) */}
              <AnimatePresence initial={false}>
                {!open && (
                  <motion.span
                    key="closed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.15, duration: 0.35 } }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    className="absolute inset-0 flex items-center justify-between gap-3 px-5 lg:flex-col lg:px-0 lg:pt-16 lg:pb-6"
                  >
                    <span className="line-clamp-1 text-[16px] font-semibold text-white lg:line-clamp-2 lg:max-h-[260px] lg:rotate-180 lg:text-[20px] lg:leading-6 lg:[writing-mode:vertical-rl]">
                      {item.title}
                    </span>
                    <IconDot icon={SectorIcon} />
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Open content */}
              <AnimatePresence initial={false}>
                {open && (
                  <motion.span
                    key="open"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: reduce ? 0 : 0.28, duration: 0.6, ease: EASE },
                    }}
                    exit={{ opacity: 0, y: 12, transition: { duration: 0.15 } }}
                    className="absolute inset-x-0 bottom-0 flex items-start gap-4 p-5 sm:p-6 lg:min-w-[520px]"
                  >
                    <IconDot icon={SectorIcon} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[18px] leading-7 font-semibold text-white sm:text-[20px]">
                        {item.title}
                      </span>
                      <span className="mt-2 line-clamp-3 max-w-[460px] text-[14px] leading-5 text-white/85">
                        {item.description}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brandblue-200">
                        {exploreLabel}
                        <ArrowUpRight
                          aria-hidden
                          className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                        />
                      </span>
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Auto-advance timer along the bottom of the open card */}
              {open && !reduce && !paused && inView && items.length > 1 && (
                <motion.span
                  key={`timer-${active}`}
                  aria-hidden
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-white/70 rtl:origin-right"
                />
              )}
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}

function IconDot({ icon: I }: { icon: LucideIcon }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brandblue-600 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.4)]">
      <I aria-hidden className="size-4.5" strokeWidth={1.8} />
    </span>
  );
}
