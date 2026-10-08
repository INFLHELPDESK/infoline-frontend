import { useTranslations } from "next-intl";
import { CountUp, Stagger, StaggerItem } from "@/components/ui/motion";

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
    <section className="py-20 lg:py-26">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger as="div" stagger={0.12} amount={0.2}>
          <StaggerItem direction="start" className="mb-11 text-center">
            <p className="overline-sm-medium mb-sm text-slate-400">
              {t("themes.eyebrow")}
            </p>
            <h2 className="heading-xl-bold text-slate-900">
              {t("themes.title")}
            </h2>
          </StaggerItem>

          <Stagger
            as="div"
            className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.1}
          >
            {items.map((theme) => (
              <StaggerItem
                key={theme.title}
                as="div"
                className="rounded-2xl bg-brandblue-50 p-7 lg:p-8"
              >
                <CountUp
                  value={theme.value}
                  className="mb-6 block text-[38px] font-semibold leading-none tracking-[-.02em] text-brandblue-500"
                />
                <h3 className="body-lg-semibold mb-2 text-slate-900">
                  {theme.title}
                </h3>
                <p className="body-md-regular text-slate-600">
                  {theme.description}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </Stagger>
      </div>
    </section>
  );
}
