import { useTranslations } from "next-intl";
import Image from "next/image";
import { MaskText, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";

/**
 * Vision & mission. Two-column: statement copy on the left, a supporting photo
 * revealed with the cinematic curtain wipe on the right.
 */
export default function Vision() {
  const t = useTranslations("AboutPage");
  const paragraphs = t.raw("vision.paragraphs") as string[];

  return (
    <section className="bg-brandblue-50 py-24 lg:py-32">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <Stagger as="div" stagger={0.12}>
          <StaggerItem
            as="p"
            direction="start"
            className="overline-sm-medium text-slate-400"
          >
            {t("vision.eyebrow")}
          </StaggerItem>
          {/* Blue accent rule to the left of the statement (Figma: 11×170 bar) */}
          <div className="mt-4 flex gap-4">
            <span
              aria-hidden
              className="mt-1.5 w-[11px] flex-none self-stretch bg-brandblue-500"
            />
            <MaskText
              as="h2"
              className="heading-2xl-semibold max-w-[35ch] text-slate-900"
              segments={[{ text: t("vision.title") }]}
              amount={0.5}
              duration={0.85}
            />
          </div>
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="mt-6 max-w-[58ch] body-lg-regular text-slate-600"
              dangerouslySetInnerHTML={{ __html: p }}
            />
          ))}
        </Stagger>

        <Reveal direction="end" distance={48} duration={1}>
          <Image
            src="/assets/about/vision.svg"
            alt=""
            aria-hidden
            width={700}
            height={500}
            className="object-cover"
          />
        </Reveal>
      </div>
    </section>
  );
}
