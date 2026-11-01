"use client";

import { useEffect, useRef } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Decorative looping background video for the Industries hero that respects
 * `prefers-reduced-motion`. There is no `autoPlay` attribute, so the browser
 * never starts the video on its own (not even before hydration); playback is
 * started here only while motion is allowed, and paused as soon as the
 * preference switches to reduce. The markup is static, so server and client
 * render identically (no hydration mismatch). Reduced motion keeps the first
 * frame as a still backdrop.
 */
export default function HeroVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const mql = window.matchMedia(REDUCED_MOTION);

    const sync = () => {
      if (mql.matches) {
        video.pause();
      } else {
        // Muted inline playback is allowed everywhere; ignore a rejected play()
        // (e.g. power-saving modes) and keep the still frame.
        video.play().catch(() => {});
      }
    };

    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return (
    <video
      ref={ref}
      aria-hidden
      className={className}
      muted
      loop
      playsInline
      preload="auto"
    >
      <source src={src} type="video/webm" />
    </video>
  );
}
