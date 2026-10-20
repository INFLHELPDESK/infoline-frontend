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
            <div className="grid overflow-hidden rounded-2xl bg-[#eef5fa] md:grid-cols-[300px_1fr] lg:grid-cols-[326px_1fr]">
              <div className="relative h-64 md:h-auto">
                <Image
                  src="/assets/contact/agent.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-cover object-top"
                />
              </div>
              <div className="flex flex-col justify-center p-8 lg:py-[43px] lg:ps-[128px] lg:pe-10">
                <h2 className="max-w-[840px] text-[24px] leading-8 font-semibold text-slate-900 lg:text-[32px] lg:leading-10">
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
