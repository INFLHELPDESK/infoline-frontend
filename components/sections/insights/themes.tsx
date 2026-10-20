import { useTranslations } from "next-intl";
import { Cpu, Rocket, Users, Zap, type LucideIcon } from "lucide-react";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { Stagger, StaggerItem } from "@/components/ui/motion";

// One glyph per theme slot, in locale order (Figma: culture, speed, AI, growth).
const themeIcons: LucideIcon[] = [Users, Zap, Cpu, Rocket];

type Theme = { value: string; title: string; description: string };

/**
 * Content themes — the four pale cards with the counted-up +26 value, theme
 * name and one-line description (the design repeats +26 as a placeholder
 * figure, so the data drives whatever the editors put in).
 */
export default function Themes() {
  const t = useTranslations("InsightsPage");
  const items = t.raw("themes.items") as Theme[];

  return (
    <section className="pt-6 pb-12">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger as="div" stagger={0.12} amount={0.2}>
          <StaggerItem direction="start" className="mb-10 flex flex-col items-center text-center">
            <Eyebrow className="mb-4 border border-slate-100">
              {t("themes.eyebrow")}
            </Eyebrow>
            <h2 className="text-[28px] leading-9 font-semibold lg:text-[36px] lg:leading-11 text-slate-900">
              {t("themes.title")}
            </h2>
          </StaggerItem>

          <Stagger
            as="div"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.1}
          >
            {items.map((theme, i) => {
              const Icon = themeIcons[i % themeIcons.length];
              return (
              <StaggerItem
                key={theme.title}
                as="div"
                className="rounded-2xl bg-slate-25 p-6"
              >
                <span className="mb-5 flex size-[50px] items-center justify-center rounded-full border border-[#d7eaf4] bg-white text-brandblue-500">
                  <Icon className="size-7" strokeWidth={1.5} />
                </span>
                <h3 className="mb-2 text-[16px] leading-6 font-bold text-slate-900">
                  {theme.title}
                </h3>
                <p className="text-[14px] leading-5 text-slate-600">
                  {theme.description}
                </p>
              </StaggerItem>
              );
            })}
          </Stagger>
        </Stagger>
      </div>
    </section>
  );
}
