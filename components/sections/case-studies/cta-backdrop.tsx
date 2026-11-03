"use client";

import { useRef } from "react";
import Image from "next/image";
import { Parallax, useAmbientVideo } from "@/components/ui/motion";

const VIDEO_SRC = "/videos/4779866-hd_1920_1080_30fps.mp4";

/**
 * Background of the Case Studies contact band, from the Designer's pre-footer
 * assets (Figma 559:1589), bottom to top: the approved footage at 30%, centred
 * cover (557:1586: video fill 0.30, Normal, Fill), then the overlay (557:1587):
 * #1C97D4 at 16% in Linear Burn, and a top-to-bottom fade to black.
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
          className={`object-cover object-center transition-opacity duration-500 ${playing ? "opacity-0" : "opacity-30"}`}
        />
        {enabled && (
          <video
            ref={videoRef}
            data-testid="case-studies-cta-video"
            className="absolute inset-0 size-full object-cover object-center opacity-30"
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
      {/* Figma: #1C97D4 at 16%, Linear Burn. CSS has no cross-browser linear
          burn (plus-darker is WebKit-only). Over this dark base, burning with
          #1C97D4 clamps almost every channel to 0, so it reduces to black at
          16%: measured on the clip and poster, mean 0.7/255 and max 8.4/255
          from an exact linear burn (a normal-blend blue tint was 20/255 off). */}
      <div className="absolute inset-0 bg-black/16" />
      {/* Fade to black (Figma: linear gradient, transparent → #000) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}
