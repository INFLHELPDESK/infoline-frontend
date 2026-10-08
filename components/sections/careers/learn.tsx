import { useTranslations } from "next-intl";
import Image from "next/image";

import { Reveal, MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

export default function Learn() {
  const t = useTranslations("CareersPage");
  const chips = t.raw("learn.chips") as string[];

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          className="relative lg:h-[612px] h-full overflow-hidden rounded-2xl bg-[#0D161B]"
          amount={0.25}
          duration={1.1}
        >
          {/* =========================
              Background glow
          ========================== */}

          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-36.83%] z-0 lg:h-[635px] h-full w-[635px] -translate-x-1/2 rounded-[172px] bg-[radial-gradient(70.71%_70.71%_at_50%_50%,rgba(0,188,212,0.13)_0%,rgba(0,188,212,0)_70%)] blur-[13px]"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-[32.53%] left-[-6.32%] z-0  w-[640px] rounded-[172px] bg-[radial-gradient(70.71%_70.71%_at_50%_50%,rgba(0,188,212,0.13)_0%,rgba(0,188,212,0)_70%)] blur-[13px]"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-[32.53%] right-0 z-0 h-[450px] w-[640px] rounded-[172px] bg-[radial-gradient(70.71%_70.71%_at_50%_50%,rgba(0,188,212,0.13)_0%,rgba(0,188,212,0)_70%)] blur-[13px]"
          />

          {/* =========================
              Team image - BACKGROUND
          ========================== */}

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[52px] z-0 h-[756px]"
          >
            <Image
              src="/assets/careers/team.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1354px"
              className="object-cover object-[center_top]"
            />
          </div>

          {/* Optional dark overlay to keep the top content readable */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#0D161B]/45 via-transparent to-[#0D161B]/10"
          />

          {/* =========================
              Content
          ========================== */}

          <div className="relative z-10 px-7 py-10 lg:px-11">
            <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
              {/* Left */}
              <div>
                <span className="font-mono text-[13px] font-medium uppercase tracking-[1.5px] text-[#90A4AE]">
                  {t("learn.eyebrow")}
                </span>

                <MaskText
                  as="h2"
                  className="mt-[18px] max-w-[22ch] text-[30px] font-bold leading-[1.22] tracking-[-0.025em] text-white lg:text-[36px] lg:leading-[44px]"
                  segments={[{ text: t("learn.title") }]}
                  stagger={0.05}
                  duration={0.85}
                />
              </div>

              {/* Right */}
              <p className="text-base font-normal leading-6 text-[#CFD8DC]">
                {t("learn.body")}
              </p>
            </div>

            {/* =========================
                Chips
            ========================== */}

            <Stagger
              as="ul"
              className="mt-[22px] flex flex-wrap items-center gap-4"
              stagger={0.08}
              delayChildren={0.1}
              amount={0.2}
            >
              {chips.map((chip) => (
                <StaggerItem
                  as="li"
                  key={chip}
                  distance={20}
                  className="
                    box-border
                    lg:h-[38px]
                    items-center
                    justify-center
                    flex-wrap
                    rounded-full
                    border
                    border-[rgba(171,215,237,0.2)]
                    bg-[rgba(229,229,229,0.1)]
                    px-4
                    py-[10px]
                    text-center
                    text-xs
                    font-medium
                    leading-4
                    text-white
                    backdrop-blur-[12px]
                  "
                >
                  {chip}
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
