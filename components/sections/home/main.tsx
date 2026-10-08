import { useTranslations } from "next-intl";
import Button from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Proof from "./proof";
import HeroVisual from "./hero-visual";
import HeroContent from "./hero-content";
import { MainBackground } from "@/components/ui/background";
import { Stagger, StaggerItem } from "@/components/ui/motion";

export default function Main() {
  const t = useTranslations("Main");

  return (
    <>
      <section className="relative overflow-hidden justify-center items-center lg:h-screen lg:min-h-[700px] flex pb-16 lg:pb-0">
        <div className="grid items-center gap-4 h-full lg:grid-cols-[1fr_1fr]">
          <HeroContent>
            <Stagger
              as="div"
              className="flex flex-col ps-6 lg:ps-10 items-start gap-0 py-14 lg:py-[clamp(0px,6vh,100px)]"
              stagger={0.14}
              delayChildren={0.05}
              amount={0.35}
            >
              <StaggerItem
                className="mb-8.5 flex items-center gap-3.5"
                distance={40}
              >
                <span className="block h-px w-8.5 bg-brandblue-500" />
                <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-lightblue-300">
                  {t("eyebrow")}
                </span>
              </StaggerItem>

              {/* Plain, unanimated — this is the page's LCP element. Fading
                  it in via a word-cascade (like every other heading) held
                  the largest contentful paint back by 1.5s+ waiting on the
                  stagger; it renders at full opacity immediately instead. */}
              <h1 className="max-w-[20ch] text-white text-[48px] font-bold leading-[1.06] tracking-[-.033em]">
                {t("titleLead")}{" "}
                <span className="text-lightblue-300">{t("titleAccent")}</span>
              </h1>

              <StaggerItem
                as="p"
                className="mt-7.5 max-w-[60ch] text-[16px] leading-[24px] text-slate-200"
              >
                {t("description")}
              </StaggerItem>

              <StaggerItem className="mt-11 flex max-md:justify-start flex-wrap items-center gap-3.5">
                <Button
                  href={t("primaryCta.href")}
                  icon={ArrowRight}
                  size="large"
                  iconPosition="right"
                >
                  {t("primaryCta.label")}
                </Button>
                <Button
                  variant="secondary"
                  size="large"
                  href={t("secondaryCta.href")}
                >
                  {t("secondaryCta.label")}
                </Button>
              </StaggerItem>

              <StaggerItem
                as="p"
                className="mt-6.5 font-mono text-[13px] leading-[1.6] text-slate-400"
                distance={32}
              >
                {t("responseNote")}
              </StaggerItem>
            </Stagger>
          </HeroContent>

          <HeroVisual />
        </div>
        <MainBackground />
      </section>
      <Proof />
    </>
  );
}
