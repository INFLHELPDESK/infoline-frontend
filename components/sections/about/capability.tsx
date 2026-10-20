import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/sections/home-1/shared";
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
          className="rounded-3xl bg-slate-25 p-8 lg:p-11"
          amount={0.25}
          duration={1}
        >
          <div className="grid grid-cols-1 items-center justify-between gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
            <div>
              <Eyebrow>{t("capability.eyebrow")}</Eyebrow>
              <MaskText
                as="h2"
                className="mt-5 max-w-[530px] text-[32px] leading-[1.1] font-semibold lg:text-[40px] lg:leading-11 text-slate-900"
                segments={[{ text: t("capability.title") }]}
                amount={0.5}
                duration={0.85}
              />
              <p className="mt-6 max-w-[530px] text-[16px] leading-6 text-slate-600">
                {t("capability.description")}
              </p>
            </div>

            <Stagger
              as="dl"
              className="grid grid-cols-3 gap-3"
              stagger={0.12}
              amount={0.4}
            >
              {stats.map((stat) => (
                <StaggerItem
                  key={stat.label}
                  className="flex flex-col-reverse justify-end border-s-2 border-brandblue-500 px-4 py-3"
                >
                  <dt className="mt-3 text-[13px] leading-5 text-slate-400">
                    {stat.label}
                  </dt>
                  <dd className="text-4xl font-medium text-brandblue-500 lg:text-[48px] lg:leading-[56px]">
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
