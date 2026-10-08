import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/button";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

/**
 * Careers hero — full-bleed office photo under an ink wash, centred copy and
 * the "View open roles" button dropping the reader to the vacancies table.
 */
export default function Hero() {
  const t = useTranslations("CareersPage");

  return (
    <section className="relative overflow-hidden lg:h-screen">
      {/* Background photo + dark wash */}
      <Image
        src="/assets/careers/hero-bg.svg"
        alt=""
        fill
        priority
        aria-hidden
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-ink/85 bg-[radial-gradient(ellipse_60%_55%_at_50%_18%,rgba(28,151,212,0.28),transparent_70%)]"
      />

      <div className="relative mx-auto flex w-full h-full max-w-360 flex-col items-center px-6 pb-24 pt-40 text-center lg:pb-28 lg:pt-52">
        <Stagger
          as="div"
          className="flex flex-col items-center justify-center h-full"
          stagger={0.14}
          delayChildren={0.05}
          amount={0.3}
        >
          {/* Careers eyebrow — Frame 30 */}
          <StaggerItem className="mb-1" distance={32}>
            <span className="flex items-center gap-4 font-mono text-[13px] font-medium uppercase leading-[16px] tracking-[1.5px] text-[#74C0E7]">
              {t("hero.eyebrow")}
            </span>
          </StaggerItem>

          {/* Title — "Build your career with a trusted team" */}
          <MaskText
            as="h1"
            className="flex max-w-[665px] items-center justify-center text-center text-[48px] font-bold leading-[58px] text-white"
            segments={[{ text: t("hero.title") }]}
            stagger={0.05}
            duration={0.9}
          />

          {/* Description */}
          <StaggerItem
            as="p"
            className="mt-2 flex max-w-[60ch] items-center justify-center text-center body-lg-description text-[#CFD8DC]"
          >
            {t("hero.description")}
          </StaggerItem>

          {/* Button wrapper — div:margin, padding-top 40px */}
          <StaggerItem className="flex flex-col items-start pt-10">
            <Button
              href={t("hero.cta.href")}
              size="large"
              variant="primary"
              className="relative isolate flex w-[209px] items-center gap-3 rounded-lg bg-[#1C97D4] px-[34px] py-[19px] text-[13px] font-semibold uppercase leading-[13px] tracking-[1.43px] text-white shadow-[0px_14px_40px_-16px_rgba(28,151,212,0.95)]"
            >
              {t("hero.cta.label")}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Button>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
