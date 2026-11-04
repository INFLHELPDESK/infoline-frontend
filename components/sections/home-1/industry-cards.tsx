"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Building2 } from "lucide-react";
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

const SPRING = { type: "spring", stiffness: 170, damping: 26, mass: 0.9 } as const;

/**
 * Approved Figma sector icons (exported as-is from the Infoline Handoff,
 * node 406:3983) — picked from the sector id / slug (works for CMS slugs too).
 * Unknown sectors fall back to a neutral building glyph.
 */
const ICON_BASE = "/assets/home-1/industries";
function iconFor(id: string): string | null {
  const s = id.toLowerCase();
  if (/(gov|public|citizen)/.test(s)) return `${ICON_BASE}/government.svg`;
  if (/(telecom|tech)/.test(s)) return `${ICON_BASE}/telecom.svg`;
  if (/(logistic|transport|touris)/.test(s)) return `${ICON_BASE}/logistics.svg`;
  if (/(utilit|energy|environment)/.test(s)) return `${ICON_BASE}/utilities.svg`;
  if (/(bank|bfsi|financ|insur|fintech)/.test(s)) return `${ICON_BASE}/bfsi.svg`;
  if (/(real|commercial|consumer|retail)/.test(s)) return `${ICON_BASE}/realestate.svg`;
  return null;
}

/**
 * Expanding industry rail (reference: the "Blonkisoaz" card GIF).
 *
 * Desktop: a row where the open card grows to fill the space and the others
 * collapse into tall pills with a vertical title and an icon at the foot.
 * Mobile: the same idea stacked vertically (open card tall, others short bars).
 *
 * Static: the first card is open and the rail never moves on its own. A
 * click or tap on a closed card opens it; keyboard focus (focus-visible) also
 * opens it. A click or tap on the open card follows its link. RTL is free: the row follows `dir`, and vertical titles
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduce = useReducedMotion();

  const transition = reduce ? { duration: 0 } : SPRING;

  return (
    <ul
      className="flex flex-col gap-3 lg:h-[394px] lg:flex-row lg:gap-6"
    >
      {items.map((item, i) => {
        const open = i === active;
        const iconSrc = iconFor(item.id);

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
          >
            <Link
              href={item.href}
              aria-label={`${item.title} — ${exploreLabel}`}
              onFocus={(e) => {
                // Keyboard focus opens the card; a pointer press also focuses
                // the link, and must not navigate on that same click.
                if (e.currentTarget.matches(":focus-visible")) setActive(i);
              }}
              onClick={(e) => {
                if (!open) {
                  e.preventDefault();
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
                    {/* Mobile: icon leads the row (Designer: icon on the left);
                        desktop keeps title on top, icon at the foot. */}
                    <IconDot src={iconSrc} className="order-first lg:order-last" />
                    <span className="min-w-0 flex-1 line-clamp-2 text-[16px] leading-5 font-black text-white lg:line-clamp-2 lg:max-h-[260px] lg:flex-none lg:rotate-180 lg:text-[20px] lg:leading-6 lg:[writing-mode:vertical-rl]">
                      {item.title}
                    </span>
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
                    <IconDot src={iconSrc} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[18px] leading-6 font-black text-white sm:text-[20px]">
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

            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}

function IconDot({ src, className = "" }: { src: string | null; className?: string }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.4)] ${className}`}>
      {src ? (
        <Image src={src} alt="" width={20} height={20} aria-hidden unoptimized />
      ) : (
        <Building2 aria-hidden className="size-5 text-brandblue-600" strokeWidth={1.8} />
      )}
    </span>
  );
}
