import { useTranslations } from "next-intl";
import Image from "next/image";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { Reveal, MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

/**
 * "Why join" — dark panel with a centred header and the four proof points as a
 * column of alternating light / brand cards (Figma Careers › section#partners).
 */
export default function Learn() {
  const t = useTranslations("CareersPage");
  const chips = t.raw("learn.chips") as string[];

  return (
    <section className="bg-white pt-20 pb-28">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          className="relative overflow-hidden rounded-2xl bg-[#0D161B]"
          amount={0.25}
          duration={1.1}
        >
          {/* Background glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 z-0 h-[632px] w-[635px] -translate-x-1/2 rounded-[172px] bg-[radial-gradient(70.71%_70.71%_at_50%_50%,rgba(0,188,212,0.13)_0%,rgba(0,188,212,0)_70%)] blur-[13px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-[10%] left-[-6.32%] z-0 h-[883px] w-[640px] rounded-[172px] bg-[radial-gradient(70.71%_70.71%_at_50%_50%,rgba(0,188,212,0.13)_0%,rgba(0,188,212,0)_70%)] blur-[13px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-[10%] right-0 z-0 h-[730px] w-[640px] rounded-[172px] bg-[radial-gradient(70.71%_70.71%_at_50%_50%,rgba(0,188,212,0.13)_0%,rgba(0,188,212,0)_70%)] blur-[13px]"
          />

          <div className="relative z-10 flex flex-col items-center px-6 py-10 text-center lg:px-11 lg:pb-16">
            <Eyebrow tone="dark">{t("learn.eyebrow")}</Eyebrow>

            <MaskText
              as="h2"
              className="mt-6 max-w-[551px] text-[32px] leading-[1.1] font-semibold text-white lg:text-[40px] lg:leading-11"
              segments={[{ text: t("learn.title") }]}
              stagger={0.05}
              duration={0.85}
            />

            <p className="mt-6 max-w-[643px] text-[16px] leading-6 text-[#CFD8DC]">
              {t("learn.body")}
            </p>

            <Stagger
              as="ul"
              className="mt-9 flex w-full max-w-[265px] flex-col gap-9"
              stagger={0.12}
              delayChildren={0.1}
              amount={0.15}
            >
              {chips.map((chip, i) => {
                const brand = i % 2 === 1;
                return (
                  <StaggerItem
                    as="li"
                    key={chip}
                    distance={28}
                    className={`flex min-h-[210px] flex-col gap-6 rounded-[20px] px-6 pt-5 pb-8 text-start ${
                      brand
                        ? "bg-brandblue-500 text-white"
                        : "bg-[#d7eaf4] text-brandblue-600"
                    }`}
                  >
                    <Image
                      src={`/assets/careers/learn/${i + 1}.svg`}
                      alt=""
                      aria-hidden
                      width={36}
                      height={36}
                      className="size-9 flex-none"
                    />
                    <p className="text-[28px] leading-8 font-medium">{chip}</p>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
