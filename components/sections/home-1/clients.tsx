import Image from "next/image";
import { useTranslations } from "next-intl";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Eyebrow } from "./shared";

/**
 * Section 2 — "Trusted by Oman's ministries, authorities and national
 * institutions". Centred heading over a static, centred row of client logos
 * (Figma `clients`); one row from lg, wraps below.
 */
export default function Clients() {
  const t = useTranslations("HomeV1.clients");
  const logos = t.raw("logos") as { src: string; alt: string }[];

  return (
    <section className="bg-white py-12 text-[#1a1a1c] lg:py-[60px]">
      <div className="mx-auto w-full max-w-360 px-6 md:px-12 lg:px-20">
        <Stagger
          as="div"
          className="mx-auto flex max-w-[762px] flex-col items-center text-center"
          stagger={0.12}
        >
          <StaggerItem distance={24}>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
          </StaggerItem>
          <StaggerItem
            as="h2"
            className="mt-[17px] text-[28px] leading-9 font-bold text-slate-900 sm:text-[36px] sm:leading-11"
          >
            {t("title")}
          </StaggerItem>
          <StaggerItem
            as="p"
            className="mt-[17px] text-[16px] leading-6 text-slate-700"
          >
            {t("description")}
          </StaggerItem>
        </Stagger>
      </div>

      <Stagger
        as="ul"
        className="mx-auto mt-7 flex w-full max-w-360 flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 lg:flex-nowrap lg:gap-x-0"
        stagger={0.06}
        amount={0.2}
      >
        {logos.map((logo) => (
          <StaggerItem as="li" key={logo.src} distance={16} className="flex-none lg:min-w-0 lg:flex-1">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={135}
              height={88}
              loading="lazy"
              className="h-16 w-auto object-contain sm:h-22 lg:w-full"
            />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
