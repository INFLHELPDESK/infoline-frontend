"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Background media for the partner CTA. The static image is always rendered
 * (it is the fallback and the poster); the video is mounted only after mount
 * when the user has not asked for reduced motion or data saving, loads nothing
 * until the banner nears the viewport, and pauses whenever it scrolls away or
 * the tab is hidden.
 */
export default function PartnerCtaVideo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;
    const sync = () => setEnabled(!reduce.matches && !saveData);
    sync();
    reduce.addEventListener("change", sync);
    return () => reduce.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!enabled || !wrap || !video) return;

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
    io.observe(wrap);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      video.pause();
    };
  }, [enabled]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    >
      <Image
        src="/assets/options/bg.jpg"
        alt=""
        fill
        sizes="(min-width: 1440px) 1360px, 100vw"
        className="object-cover object-top-right"
      />
      {enabled && (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
        >
          <source src="/videos/Solutions-partnership-CTA.mp4" type="video/mp4" />
        </video>
      )}
      {/* Keeps the copy readable over moving footage. */}
      <div className="absolute inset-0 bg-ink/40" />
    </div>
  );
}
