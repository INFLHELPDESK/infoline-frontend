import { useTranslations } from "next-intl";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow, sectionTitle } from "./shared";
import IndustryCards, { type IndustryCard } from "./industry-cards";

/**
 * Section 4 — "If you think in sectors, start here instead."
 * Header is server-rendered; the expanding card rail is a client island.
 */
export default function Industries({ items }: { items?: IndustryCard[] }) {
  const t = useTranslations("HomeV1.industries");
  const list = items?.length ? items : (t.raw("items") as IndustryCard[]);

  return (
    <section className="bg-white py-20 text-[#1a1a1c] sm:py-24 lg:py-25">
      <div className="mx-auto w-full max-w-360 px-6 md:px-12 lg:px-20">
        <Stagger as="div" className="max-w-[907px]" stagger={0.12}>
          <StaggerItem direction="start" distance={24}>
            <Eyebrow tone="muted">{t("eyebrow")}</Eyebrow>
          </StaggerItem>
          <StaggerItem as="h2" direction="start" className={`mt-5 ${sectionTitle}`}>
            {t("title")}
          </StaggerItem>
          <StaggerItem
            as="p"
            direction="start"
            className="mt-3 max-w-[819px] text-[15px] leading-6 text-slate-700 sm:text-[16px]"
          >
            {t("description")}
          </StaggerItem>
        </Stagger>

        <div className="mt-10 lg:mt-11">
          <IndustryCards items={list} exploreLabel={t("exploreLabel")} />
        </div>
      </div>
    </section>
  );
}
