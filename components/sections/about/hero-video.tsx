"use client";

import { useRef } from "react";
import { useAmbientVideo } from "@/components/ui/motion";

/**
 * About Hero "Video-BG" (Figma 406:3445, 1453×817 at -6,-115 on the 1440
 * frame): the flying-birds footage at full opacity, covered by ONE overlay,
 * rgba(13,22,27,0.9) in Color Burn. Nothing else tints it (no vertical fade).
 *
 * The CSS `mix-blend-mode: color-burn` is the same operator Figma uses, so no
 * approximation is needed. It blends against the video and the section's
 * `bg-ink`, because neither this box nor the Hero `section` adds a transform or
 * filter between them (the section's `isolate` is the blend group).
 *
 * Playback gating is shared with the other approved backdrops
 * (`useAmbientVideo`): the server render and first client render never play;
 * playback starts only when motion is allowed and the box is near the viewport;
 * it pauses off-screen and in a hidden tab. Under reduced motion / data saving
 * it never plays and the first frame stays as the still (`preload="metadata"`
 * loads just that frame), the same fallback the Industries hero uses.
 */
export default function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const { videoRef } = useAmbientVideo(ref);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute -right-[7px] -left-[6px] top-[-115px] h-[817px]"
    >
      <video
        ref={videoRef}
        data-testid="about-hero-video"
        className="absolute inset-0 size-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
      >
        <source src="/assets/flying-birds.webm" type="video/webm" />
      </video>
      <div
        data-testid="about-hero-overlay"
        className="absolute inset-0 bg-[rgba(13,22,27,0.9)] mix-blend-color-burn"
      />
    </div>
  );
}
