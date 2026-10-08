import { useTranslations } from "next-intl";
import {
  MaskText,
  Reveal,
  Stagger,
  StaggerItem,
  CountUp,
} from "@/components/ui/motion";

type Stat = { value: string; label: string };

export default function Scale() {
  const t = useTranslations("AboutPage");
  const stats = t.raw("scale.stats") as Stat[];

  return (
    <section className="bg-ink py-24 text-white lg:py-32">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div>
            <Reveal
              as="p"
              direction="start"
              distance={24}
              duration={0.7}
              className="overline-sm-medium text-slate-300"
            >
              {t("scale.eyebrow")}
            </Reveal>
            <MaskText
              as="h2"
              className="mt-4 heading-2xl-semibold text-white"
              segments={[{ text: t("scale.title") }]}
              amount={0.5}
              duration={0.85}
            />
          </div>
          <Reveal
            as="p"
            direction="start"
            distance={28}
            delay={0.1}
            className="mt-5 body-lg-regular text-slate-400"
          >
            {t("scale.description")}
          </Reveal>
        </div>

        <Stagger
          as="dl"
          className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl scale_border md:grid-cols-3"
          stagger={0.11}
          amount={0.25}
        >
          {stats.map((stat) => (
            <StaggerItem
              key={stat.label}
              className="flex flex-col-reverse px-8 py-9 lg:px-10 lg:py-11"
            >
              <dt className="mt-3 max-w-[26ch] body-sm-regular text-slate-400">
                {stat.label}
              </dt>
              <dd className="text-4xl font-bold tracking-tight text-brandblue-400 sm:text-5xl">
                <CountUp
                  value={stat.value}
                  duration={stat.value.replace(/\D/g, "").length > 2 ? 0.9 : 2}
                />
              </dd>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
