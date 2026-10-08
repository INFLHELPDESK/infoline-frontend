"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";

export type LogoItem = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type LogoMarqueeProps = {
  logos: LogoItem[];
  durationSeconds?: number;
  gap?: string;
  imageHeight?: number;
  imageWidth?: number;
  className?: string;
};

export default function LogoMarquee({
  logos,
  durationSeconds = 30,
  gap = "4rem",
  imageHeight = 88,
  imageWidth = 120,
  className = "",
}: LogoMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  // Width of one (un-duplicated) logo set — the wrap distance.
  const halfWidth = useRef(0);

  // Pause when off-screen so it doesn't run in the background.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Measure half the track (the original set) and keep it fresh on resize.
  useEffect(() => {
    const measure = () => {
      if (trackRef.current)
        halfWidth.current = trackRef.current.scrollWidth / 2;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [logos]);

  useAnimationFrame((_, delta) => {
    if (!inView || hovered || prefersReducedMotion || !halfWidth.current)
      return;
    // px per ms so one full set scrolls by in `durationSeconds`.
    const pxPerMs = halfWidth.current / (durationSeconds * 1000);
    let next = x.get() - pxPerMs * delta;
    // Wrap seamlessly once a full set has passed.
    if (next <= -halfWidth.current) next += halfWidth.current;
    x.set(next);
  });

  if (!logos.length) return null;

  // Duplicate once so the wrap is invisible.
  const track = [...logos, ...logos];

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      dir="ltr"
      style={{ overflow: "hidden", width: "100%", ["--gap" as string]: gap }}
    >
      <motion.ul
        ref={trackRef}
        style={{ x }}
        className="flex w-max items-center gap-(--gap)"
      >
        {track.map((logo, i) => (
          <li key={`${logo.src}-${i}`} className="flex-none">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width ?? imageWidth}
              height={logo.height ?? imageHeight}
              loading="lazy"
              decoding="async"
              // Duplicated set is decorative for screen readers.
              aria-hidden={i >= logos.length}
              className="h-22 w-auto object-contain transition"
            />
          </li>
        ))}
      </motion.ul>
    </div>
  );
}
