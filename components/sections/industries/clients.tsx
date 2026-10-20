import { useTranslations } from "next-intl";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow } from "@/components/sections/home-1/shared";
import LogoMarquee, { LogoItem } from "@/components/ui/logo-marquee";

export default function Clients() {
  const t = useTranslations("IndustriesPage");
  const logos = t.raw("clients.logos") as LogoItem[];

  return (
    <section className="bg-white py-6xl">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <div className="">
          <Stagger
            as="div"
            className="mb-4xl flex flex-col items-start gap-sm pb-6 border-b border-slate-100"
            stagger={0.14}
          >
            <StaggerItem className="flex flex-col items-start">
              <Eyebrow className="mb-4 border border-slate-100">
                {t("clients.eyebrow")}
              </Eyebrow>
              <MaskText
                as="h2"
                className="text-start text-[32px] leading-[1.1] font-semibold text-slate-900 lg:text-[40px] lg:leading-11"
                segments={[{ text: t("clients.title") }]}
                amount={0.5}
                duration={0.8}
              />
            </StaggerItem>
          </Stagger>

          <LogoMarquee
            logos={logos}
            durationSeconds={30}
            gap="4rem"
            imageHeight={48}
            imageWidth={140}
            className="mt-10"
          />
        </div>
      </div>
    </section>
  );
}
