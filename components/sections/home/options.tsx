import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/button";
import {
  Reveal,
  MaskText,
  Parallax,
  SpotlightCard,
  Stagger,
  StaggerItem,
} from "@/components/ui/motion";

type Pillar = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
};

export default function Options() {
  const t = useTranslations("Options");
  const pillars = t.raw("pillars") as Pillar[];

  return (
    <section className="bg-white py-6xl">
      <div className="max-w-360 px-6 lg:px-10 mx-auto w-full">
        <Stagger
          as="div"
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-lg mb-4xl"
          stagger={0.15}
        >
          <StaggerItem direction="start">
            <p className="overline-sm-medium text-slate-600 mb-sm">
              {t("eyebrow")}
            </p>
            <MaskText
              as="h2"
              className="heading-2xl-semibold text-slate-900 max-w-[23ch]"
              segments={[{ text: t("title") }]}
              amount={0.5}
              duration={0.8}
            />
          </StaggerItem>
          <StaggerItem
            as="p"
            direction="end"
            className="body-lg-regular text-slate-600 max-w-[54ch]"
          >
            {t("description")}
          </StaggerItem>
        </Stagger>

        <Stagger
          as="div"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          stagger={0.12}
        >
          {pillars.map((pillar) => (
            <StaggerItem as="div" key={pillar.title} className="h-full">
              <SpotlightCard className="rounded-xl max-h-67 h-full py-10 px-6.5 bg-white flex flex-col solutions-card-shadow">
                <p className="overline-sm-medium text-slate-300 mb-5">
                  {pillar.eyebrow}
                </p>
                <h3 className="heading-lg-semibold text-slate-900 mb-4">
                  {pillar.title}
                </h3>
                <p className="body-md-regular text-slate-700 mb-2xl">
                  {pillar.description}
                </p>
                <Link
                  href={pillar.href}
                  className="group mt-auto overline-sm-medium text-brandblue-500 hover:text-brandblue-700 transition-colors inline-flex items-center gap-xs"
                >
                  {pillar.cta}
                  <ArrowRight className="size-4 rtl:rotate-180 transition-transform duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Link>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-brandblue-900 my-20 lg:py-15 lg:px-11 p-10"
          amount={0.25}
          duration={1.15}
        >
          {/* Layer 1: background image — drifts on scroll (desktop only). The
              parallax layer is oversized so the translation never exposes an edge. */}
          <Parallax
            className="pointer-events-none absolute -inset-y-[20%] inset-x-0"
            speed={0.12}
          >
            <Image
              src="/assets/options/bg.jpg"
              alt=""
              fill
              aria-hidden="true"
              className="object-cover object-top-right"
              priority={false}
            />
          </Parallax>

          {/* Layer 3: content */}
          <div className="relative z-10 flex flex-col lg:flex-row md:items-center justify-between gap-xl">
            <div>
              <h3 className="heading-xl-bold lg:text-[36px] mb-4 text-white">
                {t("banner.title")}
              </h3>
              <p className="body-lg-regular text-brandblue-100">
                {t("banner.description")}
              </p>
            </div>
            <Button
              href={t("banner.cta.href")}
              size="large"
              className="shrink-0 rounded-lg bg-white !text-ink px-2xl py-md overline-xs-semibold hover:bg-white transition-colors"
            >
              {t("banner.cta.label")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
