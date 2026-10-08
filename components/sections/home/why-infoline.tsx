import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/button";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

type Point = { number: string; text: string };

export default function WhyInfoline() {
  const t = useTranslations("WhyInfoline");
  const points = t.raw("points") as Point[];

  return (
    <section className="bg-[#f2f5f7] py-20 text-[#0a1014] sm:py-24 lg:py-28">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <Stagger as="div" stagger={0.12}>
          <StaggerItem
            as="p"
            direction="start"
            className="text-[12px] font-medium uppercase tracking-[0.28em] text-slate-600"
          >
            {t("eyebrow")}
          </StaggerItem>
          <MaskText
            as="h2"
            className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
            segments={[{ text: t("title") }]}
            amount={0.5}
            duration={0.8}
          />
          <StaggerItem
            as="p"
            direction="start"
            className="mt-5 text-[15px] leading-relaxed text-slate-600"
          >
            {t("description")}
          </StaggerItem>
          <StaggerItem direction="start" className="mt-8">
            <Button href={t("cta.href")} icon={ArrowRight} iconPosition="right">
              {t("cta.label")}
            </Button>
          </StaggerItem>
        </Stagger>

        <Stagger
          as="ul"
          className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2"
          stagger={0.1}
        >
          {points.map((point) => (
            <StaggerItem as="li" key={point.number}>
              <span className="block h-[3px] w-10 bg-brandblue-500" />
              <span className="mt-4 block text-[13px] font-medium tabular-nums text-slate-600">
                {point.number}
              </span>
              <p className="mt-3 text-[17px] font-semibold leading-snug">
                {point.text}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
