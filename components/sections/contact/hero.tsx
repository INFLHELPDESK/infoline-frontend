import Image from "next/image";
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
    <section className="bg-white pt-20 pb-16 lg:pt-40 lg:pb-20">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger as="div" stagger={0.12} amount={0.3}>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-20">
            <div>
              <StaggerItem className="mb-6">
                <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-brandblue-500">
                  {t("hero.eyebrow")}
                </span>
              </StaggerItem>
              <MaskText
                as="h1"
                className="max-w-[16ch] text-[40px] font-bold leading-[1.08] tracking-[-.03em] text-slate-900 lg:text-[52px]"
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
              className="max-w-[52ch] pb-2 text-[15px] leading-[1.65] text-slate-500 lg:text-start"
            >
              {t("hero.description")}
            </StaggerItem>
          </div>

          {/* Banner: agent visual + the routing answer */}
          <StaggerItem className="mt-12" distance={36}>
            <div className="grid overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#EAF5FC_0%,#DCEEF9_58%,#CFE9F7_100%)] md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]">
              <div className="relative h-64 md:h-auto">
                <Image
                  src="/assets/contact/agent.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-cover object-top"
                />
              </div>
              <div className="flex flex-col justify-center p-8 lg:p-12">
                <h2 className="heading-lg-semibold max-w-[30ch] text-slate-900">
                  {t("hero.bannerTitle")}
                </h2>
                <p className="body-lg-regular mt-4 max-w-[75ch] text-slate-600">
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
