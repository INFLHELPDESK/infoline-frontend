import { useTranslations } from "next-intl";
import Image from "next/image";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { MaskText, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";

type Badge = { src: string; alt: string; label: string; caption: string };

export default function Credentials() {
  const t = useTranslations("AboutPage");
  const badges = t.raw("credentials.badges") as Badge[];

  return (
    <section className="bg-white py-24 text-ink lg:py-32">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[1.15fr_.85fr] lg:gap-20 lg:px-10">
        <div>
          <Reveal direction="start" distance={24} duration={0.7}>
            <Eyebrow className="border border-slate-100">
              {t("credentials.eyebrow")}
            </Eyebrow>
          </Reveal>
          <MaskText
            as="h2"
            className="mt-5 max-w-[708px] text-[32px] leading-[1.1] font-semibold lg:text-[40px] lg:leading-11 text-slate-900"
            segments={[
              {
                text: t("credentials.titleLead"),
                className: "text-brandblue-500",
              },
              { text: t("credentials.titleMid") },
              {
                text: t("credentials.titleAccent"),
                className: "text-brandblue-500",
              },
              { text: t("credentials.titleTail") },
            ]}
            amount={0.5}
            duration={0.85}
          />
          <Reveal
            as="p"
            direction="start"
            distance={28}
            delay={0.1}
            className="mt-6 max-w-[637px] text-[16px] leading-6 text-slate-600"
          >
            {t("credentials.description")}
          </Reveal>
        </div>

        <Stagger as="div" className="grid grid-cols-2 gap-4" stagger={0.12}>
          {badges.map((badge) => (
            <StaggerItem key={badge.label}>
              <Image
                src={badge.src}
                alt={badge.alt}
                width={230}
                height={260}
                className="h-full w-auto object-contain"
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
