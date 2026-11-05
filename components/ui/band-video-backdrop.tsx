"use client";

import { useRef } from "react";
import Image from "next/image";
import { Parallax, useAmbientVideo } from "@/components/ui/motion";

const VIDEO_SRC = "/videos/4779866-hd_1920_1080_30fps.mp4";

/**
 * Footage background of the About and Insights closing bands (Figma 406:3713 /
 * 406:4970, designer review 2026-11-05 finding #2). Same layer stack as the
 * shared pre-footer CTA (Figma 559:1589), bottom to top: the approved clip at
 * 30% (still `image` is the poster and the fallback for the server render,
 * reduced motion and data saving), a #1C97D4 tint at 16% in Normal blend, and
 * a top-to-bottom fade from transparent to black. Playback gating (lazy load
 * near the viewport, pause offscreen/hidden) is `useAmbientVideo`.
 */
export default function BandVideoBackdrop({ image }: { image: string }) {
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
            data-testid="band-video"
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
      <div className="absolute inset-0 bg-[#1c97d4]/16" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}
