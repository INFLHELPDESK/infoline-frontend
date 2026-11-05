import { useTranslations } from "next-intl";
import Image from "next/image";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { MaskText, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";

/**
 * Vision & mission (Figma 406:3558). Two-column: statement copy on the left,
 * the layered composition on the right (pattern, capsule, cut-out photo,
 * crosses, gradient), revealed with the cinematic curtain wipe.
 *
 * `--u` is one Figma px: 1px from 1440 up. Below 1440 the composition scales
 * with the section so it keeps its proportions (two columns from lg; stacked
 * and fitted to the column below, where no Figma frame exists).
 */
export default function Vision() {
  const t = useTranslations("AboutPage");
  const paragraphs = t.raw("vision.paragraphs") as string[];

  return (
    <section className="relative overflow-hidden bg-brandblue-50 py-24 [container-type:inline-size] [--u:min(1px,calc((100cqw_-_48px)/593.461))] lg:py-32 lg:[--u:min(1px,max(calc(100cqw/1440),0.5px))]">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 lg:items-start lg:gap-20 lg:px-10">
        <Stagger as="div" stagger={0.12}>
          <StaggerItem direction="start">
            <Eyebrow>{t("vision.eyebrow")}</Eyebrow>
          </StaggerItem>
          {/* Accent rule beside the statement. Figma 406:3577: 11×129, top
              aligned with the heading, 18px gap. Below lg it spans the (longer)
              wrapped heading instead. */}
          <div className="mt-5 flex gap-4 lg:gap-[18px]">
            <span
              aria-hidden
              className="mt-1.5 w-[11px] flex-none self-stretch bg-brandblue-500 lg:mt-0 lg:h-[129px] lg:self-start"
            />
            <MaskText
              as="h2"
              className="max-w-[611px] text-[32px] leading-[1.1] font-extrabold lg:text-[36px] lg:leading-11 text-slate-900"
              segments={[{ text: t("vision.title") }]}
              amount={0.5}
              duration={0.85}
            />
          </div>
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="mt-6 max-w-[557px] text-[16px] leading-6 text-slate-600"
              dangerouslySetInnerHTML={{ __html: p }}
            />
          ))}
        </Stagger>

        <Reveal direction="end" distance={48} duration={1} className="lg:self-start">
          {/* Composition box = capsule ∪ photo (593.461 × 376.003). Every layer
              below uses its Figma offset from the capsule's top-left, bottom to
              top: BG-pattern 406:3562, capsule 406:3564, photo 406:3565 (a
              transparent cut-out), crosses 406:3566/3569/3572, gradient
              406:3575. The photo is never mirrored, in either direction. At
              1440 the capsule starts 3.64 right of the column and the photo
              8.21 below the eyebrow top, as in Figma; the pattern overflows the
              right edge and the section clips it. */}
          <div
            aria-hidden
            className="relative mx-auto h-[calc(376.003*var(--u))] w-[calc(593.461*var(--u))] lg:mx-0 lg:ms-[calc(3.64*var(--u))] lg:mt-[calc(8.21*var(--u))]"
          >
            <Image
              src="/assets/about/vision-pattern.svg"
              alt=""
              width={848}
              height={592}
              data-testid="about-vision-pattern"
              className="absolute left-[calc(-107.64*var(--u))] top-[calc(-146.21*var(--u))] h-[calc(592*var(--u))] w-[calc(847.636*var(--u))] max-w-[none]"
            />
            <div
              data-testid="about-vision-capsule"
              className="absolute left-0 top-[calc(199.92*var(--u))] h-[calc(175.903*var(--u))] w-full rounded-full bg-brandblue-500"
            />
            <Image
              src="/assets/about/vision-people.png"
              alt=""
              width={4096}
              height={2731}
              sizes="(min-width: 1024px) 564px, 90vw"
              data-testid="about-vision-photo"
              className="absolute left-[calc(15.25*var(--u))] top-0 h-[calc(376.003*var(--u))] w-[calc(563.935*var(--u))] max-w-[none] rounded-[calc(81*var(--u))] object-cover"
            />
            {[
              ["402.73", "27.8"],
              ["311.24", "73.55"],
              ["219.75", "27.8"],
            ].map(([x, y]) => (
              <Image
                key={x}
                src="/assets/about/vision-cross.svg"
                alt=""
                width={24}
                height={27}
                data-testid="about-vision-cross"
                style={{ left: `calc(${x} * var(--u))`, top: `calc(${y} * var(--u))` }}
                className="absolute h-[calc(26.909*var(--u))] w-[calc(23.321*var(--u))] max-w-[none]"
              />
            ))}
            <div
              data-testid="about-vision-overlay"
              className="absolute left-0 top-[calc(199.92*var(--u))] h-[calc(175.903*var(--u))] w-full rounded-full bg-[linear-gradient(to_bottom,rgba(15,78,110,0),rgba(15,78,110,0.3))]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
