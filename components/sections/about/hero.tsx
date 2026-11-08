import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Stagger,
  StaggerItem,
  MaskText,
  Parallax,
} from "@/components/ui/motion";
import HeroVideo from "./hero-video";

export default function Hero() {
  const t = useTranslations("AboutPage");

  return (
    <section
      // Figma 406:3444 "Hero section": 1440×755, #0d161b, clips its children.
      // `--u` is one Figma px at this width (1440 → 1px); the skyline scales
      // with the Hero so it keeps the design's proportions. The 0.55px floor
      // is not from Figma (no tablet/mobile frames): it only keeps the skyline
      // from shrinking to a sliver on phones.
      style={{ "--u": "max(calc(100cqw / 1440), 0.55px)" } as React.CSSProperties}
      className="relative isolate flex min-h-[640px] overflow-hidden bg-ink [container-type:inline-size] lg:min-h-[755px]"
    >
      {/* Layer 1+2 — Video-BG 406:3445: footage at 100% under ONE rgba(13,22,27,.9)
          Color Burn overlay (no other gradient). See hero-video.tsx. */}
      <HeroVideo />

      {/* Layer 3 — Glow 406:3446: 618px, blur 12px, top -103, centred;
          radial rgba(28,151,212,.3) → 0 at 68% of the 437px gradient radius. */}
      <div
        aria-hidden
        data-testid="about-hero-glow"
        className="pointer-events-none absolute left-1/2 top-[-103px] size-[618px] -translate-x-1/2 rounded-full blur-[12px] bg-[radial-gradient(circle_at_50%_50%,rgba(28,151,212,0.3)_0px,rgba(28,151,212,0)_297.2px)]"
      />

      {/* Layer 4 — PNG-parallax 406:3452: the skyline photo (image 6, 406:3454,
          1440×1013 at +10,-86 inside the mask box) clipped by the Figma mask
          (Vector 13, 1447.5×692.5 at -9,123). The box hangs 60.5px below the
          Hero (815.5 − 755) so the section edge, not the mask, is the only cut. */}
      <div
        aria-hidden
        data-testid="about-hero-skyline"
        className="pointer-events-none absolute left-[calc(50%-729*var(--u))] bottom-[calc(-60.5*var(--u))] h-[calc(692.5*var(--u))] w-[calc(1447.5*var(--u))] [mask-image:url('/assets/about/hero-mask.svg')] [mask-repeat:no-repeat] [mask-size:100%_100%] [-webkit-mask-image:url('/assets/about/hero-mask.svg')] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:100%_100%]"
      >
        {/* Drifts a few % on scroll (desktop, motion allowed). The photo is
            taller than the mask box on both sides, so no edge is exposed. */}
        <Parallax
          className="absolute left-[calc(10*var(--u))] top-[calc(-86*var(--u))] h-[calc(1013*var(--u))] w-[calc(1440*var(--u))]"
          speed={0.04}
        >
          <Image
            src="/assets/about/hero-muscat.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </Parallax>
      </div>

      {/* Foreground copy */}
      <div className="relative mx-auto w-full max-w-360 px-6 py-28 lg:px-10 lg:pt-[139px] lg:pb-24">
        <Stagger
          as="div"
          className="flex flex-col items-center"
          stagger={0.14}
          delayChildren={0.05}
          amount={0.3}
        >
          <StaggerItem
            className="mb-5 flex items-start gap-3.5"
            distance={40}
          >
            <span className="text-[13px] uppercase leading-4 tracking-[1.5px] text-lightblue-300">
              {t("hero.eyebrow")}
            </span>
          </StaggerItem>

          <MaskText
            as="h1"
            className="max-w-[808px] text-center text-[40px] font-black leading-[1.17] text-white lg:text-[48px] lg:leading-14"
            segments={[
              { text: t("hero.titleLead") },
              { text: t("hero.titleAccent") },
            ]}
            orchestrated
            stagger={0.08}
            duration={0.95}
          />

          <StaggerItem
            as="p"
            className="mt-5 max-w-[641px] text-center text-[16px] leading-6 text-slate-200"
          >
            {t("hero.description")}
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
