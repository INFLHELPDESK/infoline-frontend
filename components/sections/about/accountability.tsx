import { useTranslations } from "next-intl";
import Image from "next/image";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { Reveal, MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

export default function Accountability() {
  const t = useTranslations("AboutPage");
  const points = t.raw("accountability.points") as string[];
  const descriptions = t.raw("accountability.descriptions") as string[];

  return (
    <section className="relative overflow-hidden bg-slate-25">
      {/* Faint radial backdrop */}
      <Image
        src="/assets/about/acc-bg.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute w-full h-full top-0 inset-0"
        fill
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
