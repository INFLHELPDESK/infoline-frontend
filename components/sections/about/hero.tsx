import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Stagger,
  StaggerItem,
  MaskText,
  Parallax,
} from "@/components/ui/motion";

export default function Hero() {
  const t = useTranslations("AboutPage");

  return (
    <section className="relative isolate flex min-h-[640px] overflow-hidden bg-ink lg:min-h-[755px]">
      {/* Layer 1 — flying-birds video fills the sky. Muted/looped/playsInline
          so it autoplays everywhere; aria-hidden because it is decorative. */}
      <video
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-2 h-full w-full object-cover opacity-50"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/assets/flying-birds.webm" type="video/webm" />
      </video>

      {/* Layer 2 — melt the video into the ink at the edges and darken behind
          the copy, so type contrast holds over the moving sky. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-2 bg-gradient-to-b from-ink via-ink/55 to-ink"
      />

      {/* Layer 3 — the Hero-section.svg centred radial glow. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[-35%] -z-2 size-[120vmin] max-h-[1100px] max-w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(15,94,133,0.42)_0%,rgba(15,94,133,0.16)_38%,transparent_68%)]"
      />

      {/* Layer 4 — photo clipped to the Figma torn-skyline mask shape */}
      <div
        aria-hidden
        className="hero-mask pointer-events-none absolute inset-x-0 bottom-0 -z-1 h-[max(320px,min(50.5vw,82vh))]"
      >
        {/* Drifting layer — oversized so parallax never exposes an edge.
            The washes above are intentionally disabled (design uses the
            unfiltered photo). */}
        <Parallax
          className="absolute inset-x-0 lg:-inset-y-[50%] -inset-y-[5%]"
          speed={0.15}
        >
          <Image
            src="/assets/about/hero-muscat.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-contain object-bottom"
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
            className="max-w-[808px] text-center text-[40px] font-bold leading-[1.17] text-white lg:text-[48px] lg:leading-14"
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
