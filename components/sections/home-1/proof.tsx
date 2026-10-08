import { useTranslations } from "next-intl";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow, PillButton, sectionTitleXl } from "./shared";
import LogoConstellation, { type ClientLogo } from "./logo-constellation";

/**
 * Section 6 — "Established in 2004. Part of Omantel Group".
 * Client logos float around a central Infoline tile (Figma Groups 16/17).
 */
export default function Proof({ logos }: { logos?: ClientLogo[] }) {
  const t = useTranslations("HomeV1.proof");
  const list = logos?.length ? logos : (t.raw("logos") as ClientLogo[]);

  return (
    <section className="overflow-hidden bg-white py-20 text-[#1a1a1c] sm:py-24 lg:pt-16 lg:pb-20">
      <div className="mx-auto w-full max-w-360 px-6 md:px-12 lg:px-20">
        <Stagger as="div" className="mx-auto flex max-w-[800px] flex-col items-center text-center" stagger={0.12}>
          <StaggerItem distance={24}>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
          </StaggerItem>
          <StaggerItem as="h2" className={`mt-6 ${sectionTitleXl}`}>
            {t("title")}
          </StaggerItem>
          <StaggerItem as="p" className="mt-6 max-w-[574px] text-[15px] leading-6 text-slate-700 sm:text-[16px]">
            {t("description")}
          </StaggerItem>
        </Stagger>

        <div className="mt-10 lg:mt-10">
          <LogoConstellation logos={list} centerAlt={t("centerLogoAlt")} />
        </div>

        <div className="mt-10 flex justify-center">
          <PillButton href={t("cta.href")} variant="outline" className="text-brandblue-500">
            {t("cta.label")}
          </PillButton>
        </div>
      </div>
    </section>
  );
}
