import { useTranslations } from "next-intl";
import {
  MaskText,
  Reveal,
  Stagger,
  StaggerItem,
  CountUp,
} from "@/components/ui/motion";

type Stat = { value: string; label: string };

export default function Capability() {
  const t = useTranslations("AboutPage");
  const stats = t.raw("capability.stats") as Stat[];

  return (
    <section className="py-24 text-ink lg:py-32">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="rounded-3xl ring-1 ring-slate-900/5"
          amount={0.25}
          duration={1}
        >
          <div className="grid grid-cols-1 items-center justify-between gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
            <div>
              <p className="overline-sm-medium text-slate-400">
                {t("capability.eyebrow")}
              </p>
              <MaskText
                as="h2"
                className="mt-4 heading-2xl-semibold max-w-[20ch] text-slate-900"
                segments={[{ text: t("capability.title") }]}
                amount={0.5}
                duration={0.85}
              />
              <p className="mt-6 max-w-[52ch] body-lg-regular text-slate-600">
                {t("capability.description")}
              </p>
            </div>

            <Stagger
              as="dl"
              className="grid grid-cols-3 gap-6"
              stagger={0.12}
              amount={0.4}
            >
              {stats.map((stat) => (
                <StaggerItem
                  key={stat.label}
                  className="flex flex-col-reverse border-s-2 border-brandblue-500 ps-4"
                >
                  <dt className="mt-2 body-sm-regular text-slate-500">
                    {stat.label}
                  </dt>
                  <dd className="text-3xl font-bold tracking-tight text-brandblue-500 sm:text-4xl">
                    <CountUp value={stat.value} duration={1.4} />
                  </dd>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
