import Image from "next/image";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { useTranslations } from "next-intl";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

/**
 * Contact hero — the light variant from the Figma: headline on the left, route
 * framing copy on the right, then the pale-blue banner that answers "how do I
 * contact Infoline" beside the CX-agent visual.
 */
export default function Hero() {
  const t = useTranslations("ContactPage");

  return (
    <section className="bg-white pt-28 pb-16 lg:pt-[141px] lg:pb-20">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger as="div" stagger={0.12} amount={0.3}>
          <div className="grid gap-8 lg:grid-cols-[1fr_524px] lg:items-end lg:gap-20">
            <div>
              <StaggerItem className="mb-6">
                <Eyebrow className="border border-slate-100">
                  {t("hero.eyebrow")}
                </Eyebrow>
              </StaggerItem>
              <MaskText
                as="h1"
                className="max-w-[495px] text-[32px] font-semibold leading-[1.1] text-slate-900 lg:text-[40px] lg:leading-11"
                segments={[
                  { text: t("hero.titleLead") },
                  { text: t("hero.titleAccent") },
                ]}
                orchestrated
                stagger={0.08}
                duration={0.95}
              />
            </div>
            <StaggerItem
              as="p"
              className="max-w-[524px] text-[16px] leading-6 text-slate-600 lg:text-start"
            >
              {t("hero.description")}
            </StaggerItem>
          </div>

          {/* Banner: agent visual + the routing answer */}
          <StaggerItem className="mt-9" distance={36}>
            <div className="relative overflow-hidden rounded-3xl bg-[#ecf4f9] lg:min-h-[252px]">
              {/* Illustration: two brand-tint discs behind the transparent agent
                  artwork. Stacked above the copy below lg; pinned to the start
                  edge at lg (mirrors under RTL via logical offsets). */}
              <div
                aria-hidden="true"
                className="relative h-[232px] lg:absolute lg:inset-y-0 lg:start-0 lg:h-auto lg:w-[454px]"
              >
                <span className="absolute inset-x-0 top-1/2 mx-auto size-[320px] -translate-y-1/2 rounded-full bg-[#74C0E7]/30 lg:end-auto lg:start-[-92px] lg:mx-0 lg:size-[499px]" />
                <span className="absolute inset-x-0 top-1/2 mx-auto size-[280px] -translate-y-1/2 rounded-full bg-[#74C0E7] lg:end-auto lg:start-[-59px] lg:mx-0 lg:size-[433px]" />
                <Image
                  src="/assets/contact/agent.png"
                  alt=""
                  width={326}
                  height={326}
                  sizes="326px"
                  className="absolute inset-x-0 top-[-19px] mx-auto size-[260px] lg:end-auto lg:start-[21px] lg:mx-0 lg:size-[326px]"
                />
              </div>
              <div className="relative flex flex-col justify-center p-8 pt-6 lg:min-h-[252px] lg:py-[43px] lg:ps-[454px] lg:pe-10">
                <h2 className="max-w-[840px] text-[24px] leading-8 font-bold text-slate-900 lg:text-[32px] lg:leading-10">
                  {t("hero.bannerTitle")}
                </h2>
                <p className="mt-4 max-w-[840px] text-[16px] leading-6 text-slate-600">
                  {t("hero.bannerBody")}
                </p>
              </div>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
