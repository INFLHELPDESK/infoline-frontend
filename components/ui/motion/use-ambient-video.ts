"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Gating for a decorative, muted background clip (the approved Figma footage
 * 4779866-hd_1920_1080_30fps behind the CTA bands).
 *
 * - `enabled` is false on the server and the first client render, so both
 *   render the still only (no hydration mismatch). It turns on after mount
 *   unless the user asks for reduced motion or data saving, and turns off again
 *   if reduced motion is switched on later.
 * - While enabled, the clip loads nothing until `target` nears the viewport,
 *   plays while it is in view and pauses when it scrolls away or the tab is
 *   hidden.
 * - `playing` flips once frames are actually rendering, so the caller can fade
 *   the still (poster / fallback) out only then.
 */
export function useAmbientVideo(target: RefObject<Element | null>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData;
    const sync = () => {
      const on = !reduce.matches && !saveData;
      setEnabled(on);
      if (!on) setPlaying(false);
    };
    sync();
    reduce.addEventListener("change", sync);
    return () => reduce.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = target.current;
    const video = videoRef.current;
    if (!enabled || !el || !video) return;

    let visible = false;
    const update = () => {
      if (visible && !document.hidden) {
        if (video.preload !== "auto") video.preload = "auto";
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      video.pause();
    };
  }, [enabled, target]);

  return { videoRef, enabled, playing, onPlaying: () => setPlaying(true) };
}
