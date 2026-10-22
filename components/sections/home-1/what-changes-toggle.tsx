import { useTranslations } from "next-intl";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow, sectionTitle } from "./shared";
import ChangesToggle from "./what-changes-toggle-client";

type Row = { without: string; with: string; impact: string };

const WITH_ORDER = [3, 1, 2, 0];

/**
 * Alternative "What changes with Infoline" design (Figma Home-2, nodes
 * 448:1675 "Without" and 448:1587 "With" — two states of one toggle design).
 * Internal review only: Home selects it with `?homeVariant=new` outside
 * Production. Eyebrow, tabs and pills use `HomeV1.whatChanges`; the heading
 * and description use `HomeV1.whatChangesToggle` (Figma copy, user-confirmed).
 */
export default function WhatChangesToggle() {
  const t = useTranslations("HomeV1.whatChanges");
  const header = useTranslations("HomeV1.whatChangesToggle");
  const rows = t.raw("rows") as Row[];

  return (
    <section
      data-home-variant="new"
      className="bg-[#f2f5fa] py-20 text-[#263238] sm:py-24 lg:py-20"
    >
      <div className="mx-auto w-full max-w-360 px-6 md:px-12 lg:px-20">
        <Stagger
          as="div"
          className="mx-auto flex max-w-[760px] flex-col items-center text-center"
          stagger={0.12}
        >
          <StaggerItem distance={24}>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
          </StaggerItem>
          <StaggerItem as="h2" className={`mt-6 ${sectionTitle}`}>
            {header("title")}
          </StaggerItem>
          <StaggerItem
            as="p"
            className="mt-6 max-w-[536px] text-[15px] leading-6 text-[#455a64] sm:text-[16px]"
          >
            {header("description")}
          </StaggerItem>
        </Stagger>

        <ChangesToggle
          labels={{ without: t("columns.without"), with: t("columns.with") }}
          without={rows.map((r) => r.without)}
          // Figma stacks these beside the dial in the order 4, 2, 3, 1.
          withRight={WITH_ORDER.map((i) => rows[i].with)}
          withLeft={WITH_ORDER.map((i) => rows[i].impact)}
        />
      </div>
    </section>
  );
}
