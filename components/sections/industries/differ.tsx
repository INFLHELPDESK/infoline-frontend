import { useTranslations } from "next-intl";
import { Reveal, MaskText } from "@/components/ui/motion";
import { Eyebrow } from "@/components/sections/home-1/shared";

export default function Differ() {
  const t = useTranslations("IndustriesPage");

  return (
    <section className="pt-20 pb-12">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <div className="rounded-2xl bg-ink p-8 ring-1 ring-white/10 lg:px-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_629px] lg:gap-16">
            <div>
              <Eyebrow tone="dark" className="mb-4">
                {t("differ.eyebrow")}
              </Eyebrow>
              <MaskText
                as="h2"
                className="max-w-[16ch] text-[32px] leading-[1.1] font-semibold text-white lg:text-[40px] lg:leading-11"
                segments={[{ text: t("differ.title") }]}
                amount={0.5}
                duration={0.8}
              />
            </div>
            <Reveal
              as="p"
              direction="up"
              distance={32}
              className="self-center text-[16px] leading-6 text-slate-100"
            >
              {t("differ.description")}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
