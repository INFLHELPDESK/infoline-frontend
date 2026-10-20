import { useTranslations } from "next-intl";
import Image from "next/image";
import { PillButton } from "@/components/sections/home-1/shared";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

/**
 * Careers hero — full-bleed office photo under an ink wash, centred copy and
 * the "View open roles" button dropping the reader to the vacancies table.
 */
export default function Hero() {
  const t = useTranslations("CareersPage");

  return (
    <section className="relative overflow-hidden lg:h-[640px]">
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

      <div className="relative mx-auto flex h-full min-h-160 w-full max-w-360 flex-col items-center px-6 pb-20 pt-32 text-center lg:min-h-0 lg:pb-16 lg:pt-20">
        <Stagger
          as="div"
          className="flex flex-col items-center justify-center h-full"
          stagger={0.14}
          delayChildren={0.05}
          amount={0.3}
        >
          {/* Careers eyebrow — Frame 30 */}
          <StaggerItem className="mb-5" distance={32}>
            <span className="flex items-center gap-4 text-[13px] uppercase leading-4 tracking-[1.5px] text-[#74C0E7]">
              {t("hero.eyebrow")}
            </span>
          </StaggerItem>

          {/* Title — "Build your career with a trusted team" */}
          <MaskText
            as="h1"
            className="flex max-w-[665px] items-center justify-center text-center text-[40px] font-bold leading-[1.17] text-white lg:text-[48px] lg:leading-14"
            segments={[{ text: t("hero.title") }]}
            stagger={0.05}
            duration={0.9}
          />

          {/* Description */}
          <StaggerItem
            as="p"
            className="mt-6 max-w-[641px] text-center text-[16px] leading-7 text-[#CFD8DC] lg:text-[18px]"
          >
            {t("hero.description")}
          </StaggerItem>

          {/* Button wrapper — div:margin, padding-top 40px */}
          <StaggerItem className="flex flex-col items-start pt-10">
            <PillButton href={t("hero.cta.href")} size="lg">
              {t("hero.cta.label")}
            </PillButton>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
