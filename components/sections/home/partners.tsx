import Image from "next/image";
import { useTranslations } from "next-intl";
import { Reveal, MaskText, Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow } from "@/components/sections/home-1/shared";

type Partner = { name: string; src: string };

// Order and row split follow the Figma `section#partners` frame.
const ROW_ONE: Partner[] = [
  { name: "Dubai Technologies", src: "/assets/partners/dubai-technologies.png" },
  { name: "Salesforce", src: "/assets/partners/salesforce.png" },
  { name: "Konnect Insights", src: "/assets/partners/konnect-insights.png" },
  { name: "Elevatus", src: "/assets/partners/elevatus.png" },
  { name: "Locuz", src: "/assets/partners/locuz.png" },
  { name: "Microsoft", src: "/assets/partners/microsoft.png" },
  { name: "NCircle", src: "/assets/partners/ncircle.png" },
  { name: "CX Republic", src: "/assets/partners/cx-republic.png" },
];

const ROW_TWO: Partner[] = [
  { name: "aspect", src: "/assets/partners/aspect.png" },
  { name: "Dion", src: "/assets/partners/dion.png" },
  { name: "In10s", src: "/assets/partners/in10s.png" },
  { name: "Fluentgrid", src: "/assets/partners/fluentgrid.png" },
  { name: "EMC", src: "/assets/partners/emc.png" },
  { name: "SAP", src: "/assets/partners/sap.png" },
  { name: "Tech Mahindra", src: "/assets/partners/tech-mahindra.png" },
  { name: "Symantec", src: "/assets/partners/symantec.png" },
  { name: "Avaya", src: "/assets/partners/avaya.png" },
];

function LogoPill({ name, src, hidden }: Partner & { hidden?: boolean }) {
  return (
    <li
      className="mx-2 flex h-15 w-[165px] shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/90 px-[22px]"
      aria-hidden={hidden || undefined}
    >
      <Image
        src={src}
        alt={hidden ? "" : name}
        width={86}
        height={44}
        loading="lazy"
        decoding="async"
        className="h-11 w-[86px] object-contain opacity-[0.72]"
      />
    </li>
  );
}

function MarqueeRow({
  partners,
  direction,
}: {
  partners: Partner[];
  direction: "left" | "right";
}) {
  return (
    <div className="partners-marquee" dir="ltr">
      <ul className={`partners-track partners-track--${direction}`}>
        {[...partners, ...partners].map((p, i) => (
          <LogoPill key={`${p.name}-${i}`} {...p} hidden={i >= partners.length} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Section 8 — "Clients buy our service. Partners build the platform
 * underneath it." Dark band with two opposing logo rows (Figma
 * `section#partners`). Rows pause on hover and stop under reduced motion.
 */
export default function Partners() {
  const t = useTranslations("Partners");

  return (
    <section className="relative overflow-hidden bg-ink py-16 text-white lg:py-[90px]">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-[300px] w-[635px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(0,188,212,0.13)_0%,rgba(0,188,212,0)_70%)] blur-[13px]"
      />
      <Stagger
        as="div"
        className="relative mx-auto flex w-full max-w-[1127px] flex-col items-center px-6 text-center"
        stagger={0.12}
        amount={0.4}
      >
        <StaggerItem distance={24}>
          <Eyebrow tone="dark">{t("eyebrow")}</Eyebrow>
        </StaggerItem>
        <MaskText
          as="h2"
          className="mt-5 max-w-[867px] text-[28px] leading-9 font-bold text-white sm:text-[36px] sm:leading-11"
          segments={[{ text: t("title") }]}
          amount={0.5}
          duration={0.8}
        />
        <StaggerItem
          as="p"
          className="mt-6 max-w-[929px] text-[16px] leading-6 text-slate-400"
        >
          {t("description")}
        </StaggerItem>
      </Stagger>

      <Reveal
        className="relative mt-10 flex flex-col gap-9 lg:mt-[48px]"
        distance={48}
        blur={false}
        amount={0.2}
      >
        <MarqueeRow partners={ROW_ONE} direction="left" />
        <MarqueeRow partners={ROW_TWO} direction="right" />
      </Reveal>

      <style>{`
        .partners-marquee {
          overflow: hidden;
          width: 100%;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
        }
        .partners-track { display: flex; width: max-content; margin: 0; padding: 0; list-style: none; }
        .partners-track--left { animation: partners-left 40s linear infinite; }
        .partners-track--right { animation: partners-right 40s linear infinite; }
        .partners-marquee:hover .partners-track { animation-play-state: paused; }
        @keyframes partners-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes partners-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          .partners-track--left, .partners-track--right { animation: none; }
        }
      `}</style>
    </section>
  );
}
