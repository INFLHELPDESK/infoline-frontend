import Image from "next/image";
import { useTranslations } from "next-intl";
import { Briefcase, Handshake, HardHat, type LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow, PillButton, sectionTitleXl } from "./shared";

type Pillar = {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
  imageAlt: string;
};

/** Per-card tint from Figma: blue / indigo / amber fading to white at 78%. */
const tones: Record<string, { bg: string; tile: string; icon: LucideIcon }> = {
  clients: { bg: "from-[#98d4eb]", tile: "to-[#c5e7f3]", icon: Briefcase },
  vendors: { bg: "from-[#c5cae9]", tile: "to-[#c7ccea]", icon: HardHat },
  partners: { bg: "from-[#ffecb3]", tile: "to-[#ffedb5]", icon: Handshake },
};

/**
 * Section 7 — "Three ways we take work off your operation".
 * Tinted cards with a cut-out portrait on the reading-end side that fades
 * into the card, and a full-width outlined CTA at the foot.
 */
export default function ThreeWays() {
  const t = useTranslations("HomeV1.threeWays");
  const pillars = t.raw("pillars") as Pillar[];

  return (
    <section className="bg-white py-20 text-[#1a1a1c] sm:py-24 lg:pt-19 lg:pb-20">
      <div className="mx-auto w-full max-w-360 px-6 md:px-12 lg:px-20">
        <Stagger as="div" className="mx-auto flex max-w-[800px] flex-col items-center text-center" stagger={0.12}>
          <StaggerItem distance={24}>
            <Eyebrow tone="muted">{t("eyebrow")}</Eyebrow>
          </StaggerItem>
          <StaggerItem as="h2" className={`mt-6 ${sectionTitleXl}`}>
            {t("title")}
          </StaggerItem>
          <StaggerItem as="p" className="mt-6 max-w-[574px] text-[15px] leading-6 text-slate-700 sm:text-[16px]">
            {t("description")}
          </StaggerItem>
        </Stagger>

        <Stagger
          as="ul"
          className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-20 lg:grid-cols-3"
          stagger={0.14}
          amount={0.2}
        >
          {pillars.map((p) => {
            const tone = tones[p.id] ?? tones.clients;
            const PillarIcon = tone.icon;
            return (
              <StaggerItem as="li" key={p.id} className="h-full">
                <article
                  className={`group relative flex h-full min-h-[440px] flex-col overflow-hidden rounded-2xl border border-[#e6ebee] bg-gradient-to-b ${tone.bg} to-white to-78% transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:-translate-y-1.5 hover:shadow-[0_40px_70px_-40px_rgba(13,22,27,0.35)] lg:min-h-[492px]`}
                >
                  {/* Portrait (does not flip — it is a photo), fades at the bottom */}
                  <div className="pointer-events-none absolute end-0 top-6 h-[82%] w-[56%] [mask-image:linear-gradient(to_bottom,#000_12%,transparent_88%)]">
                    <Image
                      src={p.image}
                      alt={p.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 240px, 50vw"
                      className="object-contain object-top transition-transform duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="relative flex flex-1 flex-col p-6 sm:p-8">
                    <span
                      className={`grid size-10 place-items-center rounded-full border-[1.7px] border-[#f7f7f7] bg-gradient-to-b from-[#f7f7f8] ${tone.tile} shadow-[1.7px_3.3px_3.3px_rgba(0,0,0,0.06),1.7px_6.7px_3.3px_rgba(0,0,0,0.04)]`}
                    >
                      <PillarIcon aria-hidden className="size-5 text-black" strokeWidth={1.7} />
                    </span>
                    <h3 className="mt-7 text-[28px] leading-10 font-semibold sm:text-[32px]">
                      {p.title}
                    </h3>
                    <p className="mt-1 max-w-[18ch] text-[14px] leading-5 text-slate-700">
                      {p.description}
                    </p>
                  </div>

                  <div className="relative p-4 sm:p-5">
                    <PillButton href={p.href} variant="outline" className="w-full bg-white/90 backdrop-blur">
                      {p.cta}
                    </PillButton>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
