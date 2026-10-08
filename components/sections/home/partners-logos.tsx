"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Stagger, StaggerItem, MaskText } from "@/components/ui/motion";
import LogoMarquee, { LogoItem } from "@/components/ui/logo-marquee";
import { useClients } from "@/lib/wp";

type Props = {
  durationSeconds?: number;
};

const LOGOS: LogoItem[] = [
  { src: "/assets/clients/moh.svg", alt: "Ministry of Health" },
  {
    src: "/assets/clients/tra.svg",
    alt: "Telecommunications Regulatory Authority",
  },
  { src: "/assets/clients/asyad.svg", alt: "ASYAD" },
  {
    src: "/assets/clients/paew.svg",
    alt: "Public Authority for Electricity and Water",
  },
  {
    src: "/assets/clients/ncsi.svg",
    alt: "National Centre for Statistics & Information",
  },
  { src: "/assets/clients/manpower.svg", alt: "Ministry of Manpower" },
  { src: "/assets/clients/oman-post.svg", alt: "Oman Post" },
];

export default function PartnerLogos({ durationSeconds = 30 }: Props) {
  const t = useTranslations("Proof");

  // Client logos from the CMS (WPGraphQL `clients`), locale-aware via the hook.
  // Falls back to the bundled set while loading or if the CMS has none.
  const { data: clients } = useClients();
  const logos: LogoItem[] = useMemo(() => {
    const fromCms = (clients ?? [])
      .filter((c) => c.logo?.src)
      .map((c) => ({ src: c.logo!.src, alt: c.logo!.alt || c.name }));
    return fromCms.length > 0 ? fromCms : LOGOS;
  }, [clients]);

  return (
    <div className="bg-white py-20 sm:py-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-8">
        <Stagger
          as="div"
          className="flex flex-col items-center text-center"
          stagger={0.14}
          amount={0.4}
        >
          <StaggerItem
            as="p"
            className="text-[12px] font-medium uppercase tracking-[0.28em] text-slate-600"
          >
            {t("eyebrow")}
          </StaggerItem>
          <MaskText
            as="h2"
            className="mt-4 text-3xl text-slate-900 font-bold tracking-tight sm:text-4xl"
            segments={[{ text: t("title") }]}
            amount={0.5}
            duration={0.8}
          />
          <StaggerItem
            as="p"
            className="mt-4 text-[15px] max-w-[54ch] leading-relaxed text-slate-700"
          >
            {t("description")}
          </StaggerItem>
        </Stagger>

        <div className="mt-7">
          <LogoMarquee logos={logos} durationSeconds={durationSeconds} />
        </div>

        <div className="mt-7 text-center">
          <Link
            href={t("clientsCta.href")}
            className="group inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-brandblue-500 transition-colors hover:text-brandblue-600"
          >
            {t("clientsCta.label")}
            <ArrowRight
              className="size-4 rtl:rotate-180 transition-transform duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
