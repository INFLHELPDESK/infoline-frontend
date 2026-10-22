import { useTranslations } from "next-intl";
import Image from "next/image";
import { Eyebrow } from "@/components/sections/home-1/shared";
import {
  Parallax,
  Stagger,
  StaggerItem,
  MaskText,
} from "@/components/ui/motion";

// Three rounded windows from the Figma export, used as a CSS mask source.
// White = visible, transparent = cut away. Kept as a data URI so it ships with
// the component and never triggers an extra request.
const WHO_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='519' height='412' viewBox='0 0 519 412'%3E%3Crect x='0' y='0' width='167' height='352' rx='20' fill='%23fff'/%3E%3Crect x='176' y='60' width='167' height='352' rx='20' fill='%23fff'/%3E%3Crect x='352' y='0' width='167' height='352' rx='20' fill='%23fff'/%3E%3C/svg%3E\")";

// Figma shows the photo's right third in the left window and its left third in
// the right window; the centre stays put. Each slice is one mask column (167 of
// 519) holding the full photo, shifted so the intended region shows through.
const WHO_SLICE_W = `${(167 / 519) * 100}%`;
const WHO_FULL_W = `${(519 / 167) * 100}%`;
const WHO_SLICES = [
  { left: "0%", shift: `${-(352 / 167) * 100}%` },
  { left: `${(176 / 519) * 100}%`, shift: `${-(176 / 167) * 100}%` },
  { left: `${(352 / 519) * 100}%`, shift: "0%" },
];

export default function WhoWeAre() {
  const t = useTranslations("AboutPage");
  const paragraphs = t.raw("whoWeAre.paragraphs") as string[];
  const p = paragraphs[0];
  const titleTail = t("whoWeAre.titleTail").trim();

  return (
    <section className="relative bg-slate-25 pt-20 lg:pt-[90px]">
      <div className="relative mx-auto grid w-full max-w-360 grid-cols-1 items-start gap-14 px-6 lg:grid-cols-[minmax(0,1fr)_519px] lg:gap-20 lg:px-10">
        {/* Copy */}
        <Stagger as="div" stagger={0.12}>
          <StaggerItem direction="start">
            <Eyebrow>{t("whoWeAre.eyebrow")}</Eyebrow>
          </StaggerItem>
          <MaskText
            as="h2"
            className="mt-5 max-w-[622px] text-[32px] leading-[1.1] font-semibold lg:text-[40px] lg:leading-11 text-slate-900"
            segments={[
              { text: t("whoWeAre.titleLead") },
              {
                text: t("whoWeAre.titleAccent"),
                className: "text-brandblue-500",
              },
              // Blank in AR (non-empty only for locale parity): AR keeps its approved
              // lead + accent heading until a verified translation of the new EN
              // heading is supplied.
              ...(titleTail ? [{ text: titleTail }] : []),
            ]}
            amount={0.5}
            duration={0.85}
          />

          <StaggerItem
            as="p"
            direction="start"
            className="mt-6 max-w-[557px] text-[16px] leading-6 text-slate-600"
          >
            {p}
          </StaggerItem>
        </Stagger>

        {/* One photo, divided across three rounded windows by a CSS mask. */}
        <Parallax speed={0.08}>
          <div
            className="group relative w-full overflow-hidden"
            style={{
              aspectRatio: "519 / 412",
              maskImage: WHO_MASK,
              WebkitMaskImage: WHO_MASK,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
              maskMode: "alpha",
            }}
          >
            {WHO_SLICES.map((s) => (
              <div
                key={s.left}
                className="absolute inset-y-0 overflow-hidden"
                style={{ left: s.left, width: WHO_SLICE_W }}
              >
                <div
                  className="absolute inset-y-0"
                  style={{ left: s.shift, width: WHO_FULL_W }}
                >
                  <Image
                    src="/assets/about/who-full.jpg"
                    alt=""
                    aria-hidden
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </Parallax>
      </div>
    </section>
  );
}
