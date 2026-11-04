import { useTranslations } from "next-intl";
import Image from "next/image";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { Reveal, MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

export default function Accountability() {
  const t = useTranslations("AboutPage");
  const points = t.raw("accountability.points") as string[];
  const descriptions = t.raw("accountability.descriptions") as string[];

  return (
    <section
      // `--u` is one Figma px (1440 → 1px). The ring field keeps its Figma size
      // there; below 1440 it scales down with the section, floored at 0.55px
      // (no tablet/mobile frames exist, so the floor is not from Figma).
      style={{ "--u": "min(1px, max(calc(100cqw / 1440), 0.55px))" } as React.CSSProperties}
      className="relative overflow-hidden bg-slate-25 [container-type:inline-size]"
    >
      {/* Ring field (Figma 406:3368/3369/3370 + 9 dots): three concentric rings,
          radii 408/566/692, centred on the section. Its centre sits 233 Figma px
          below the eyebrow top (Figma 933 − 700): `top` = the content wrapper's
          top padding (pt-12, lg:pt-16 below) + 233u, but never above 45% of
          the section, so on tall narrow layouts it follows the content. The box has the asset's own
          1439×1384 ratio (height auto), so the rings stay circular, and the
          section's overflow clips them. */}
      <Image
        src="/assets/about/acc-rings.svg"
        alt=""
        aria-hidden
        width={1439}
        height={1384}
        className="pointer-events-none absolute left-1/2 top-[max(calc(48px+233*var(--u)),45%)] h-auto w-[calc(1439*var(--u))] max-w-[none] -translate-x-1/2 -translate-y-1/2 lg:top-[max(calc(64px+233*var(--u)),45%)]"
      />
      <div className="pt-12 pb-24 text-ink lg:pt-16 lg:pb-32">
        <div className="relative mx-auto w-full px-6 text-center lg:px-10">
          <Reveal direction="up" distance={24} duration={0.7}>
            <Eyebrow>{t("accountability.eyebrow")}</Eyebrow>
          </Reveal>
          <MaskText
            as="h2"
            className="mx-auto mt-5 max-w-[619px] text-[32px] leading-[1.1] font-semibold lg:text-[40px] lg:leading-11 text-slate-900"
            segments={[{ text: t("accountability.title") }]}
            amount={0.5}
            duration={0.85}
          />

          {descriptions.map((description, i) => (
            <Reveal
              as="p"
              key={i}
              direction="up"
              distance={28}
              delay={0.1}
              className="mx-auto mt-6 max-w-[655px] text-[16px] leading-6 text-slate-600"
            >
              {description}
            </Reveal>
          ))}

          <Stagger
            as="ul"
            className="mt-11 flex flex-wrap justify-center gap-x-7 gap-y-3.5"
            stagger={0.1}
            amount={0.3}
          >
            {points.map((point) => (
              <StaggerItem
                as="li"
                key={point}
                className="inline-flex about_chips_border items-center gap-2.5 rounded-full bg-white px-5 py-3"
              >
                <span className="text-[13px] leading-5 text-slate-700">{point}</span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
