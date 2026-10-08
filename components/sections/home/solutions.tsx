import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/ui/icon";
import {
  MaskText,
  SpotlightCard,
  Stagger,
  StaggerItem,
} from "@/components/ui/motion";

type SolutionItem = {
  icon: string | null;
  title: string;
  description: string;
  href: string;
};

export default function Solutions() {
  const t = useTranslations("Solutions");
  const items = t.raw("items") as SolutionItem[];

  return (
    <section className="bg-[#0a1014] py-10 text-white sm:py-12 lg:py-28">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          stagger={0.15}
        >
          <StaggerItem direction="start">
            <p className="overline-sm-medium uppercase tracking-[0.28em] text-slate-300">
              {t("eyebrow")}
            </p>
            <MaskText
              as="h2"
              className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
              segments={[{ text: t("title") }]}
              amount={0.5}
              duration={0.8}
            />
          </StaggerItem>
          <StaggerItem
            as="p"
            direction="end"
            className="max-w-[54ch] body-lg-regular leading-relaxed text-slate-300"
          >
            {t("description")}
          </StaggerItem>
        </Stagger>

        <Stagger
          as="ul"
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.1}
        >
          {items.map((item) => {
            //  const Icon = iconMap[item.icon] ?? iconMap.headphones;
            return (
              <StaggerItem as="li" key={item.title}>
                <SpotlightCard tone="dark" className="h-full rounded-2xl">
                  <Link
                    href={item.href}
                    className="group flex h-full flex-col rounded-2xl border p-6 transition-[border-color,background,box-shadow] duration-300 border-slate-600/60 bg-white/[.02] hover:border-brandblue-500/60 hover:bg-brandblue-500/[.06] hover:shadow-[0_16px_40px_-24px_rgba(28,151,212,0.8)]"
                  >
                    <Icon
                      src={item.icon ?? ""}
                      className="size-8 text-brandblue-400 transition-transform duration-500 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] group-hover:-rotate-6 group-hover:scale-110"
                      aria-hidden
                    />
                    <h3 className="mt-8 heading-md-semibold font-semibold transition-colors text-white group-hover:text-brandblue-500">
                      {item.title}
                    </h3>
                    <p className="mt-3 body-md-regular leading-relaxed text-slate-100">
                      {item.description}
                    </p>
                  </Link>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
