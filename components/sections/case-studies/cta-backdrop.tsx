"use client";

import { useRef } from "react";
import Image from "next/image";
import { Parallax, useAmbientVideo } from "@/components/ui/motion";

const VIDEO_SRC = "/videos/4779866-hd_1920_1080_30fps.mp4";

/**
 * Background of the Case Studies contact band (Figma 406:4474), bottom to top:
 * the approved footage at 30%, a #1C97D4 tint at 16%, then a fade to black.
 * The still is the poster and the fallback (server render, reduced motion,
 * data saving); it fades out only once the clip is actually playing. Playback
 * gating is shared with the site-wide CTA (`useAmbientVideo`).
 */
export default function CtaBackdrop({ image }: { image: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { videoRef, enabled, playing, onPlaying } = useAmbientVideo(ref);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      <Parallax className="absolute inset-x-0 -inset-y-[20%]" speed={0.12}>
        <Image
          src={image}
          alt=""
          fill
          sizes="100vw"
          className={`object-cover object-top-right transition-opacity duration-500 ${playing ? "opacity-0" : "opacity-30"}`}
        />
        {enabled && (
          <video
            ref={videoRef}
            data-testid="case-studies-cta-video"
            className="absolute inset-0 size-full object-cover object-top-right opacity-30"
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            onPlaying={onPlaying}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
        )}
      </Parallax>
      {/* Brand-blue tint (Figma: #1C97D4 at 16%) */}
      <div className="absolute inset-0 bg-[#1c97d4]/16" />
      {/* Fade to black (Figma: linear gradient, transparent → #000) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}
