"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";
import LogoMarquee, { LogoItem } from "@/components/ui/logo-marquee";
import { useClients } from "@/lib/wp";

export default function Clients() {
  const t = useTranslations("IndustriesPage");
  const fallback = t.raw("clients.logos") as LogoItem[];

  const { data: clients } = useClients();
  const logos: LogoItem[] = useMemo(() => {
    const fromCms = (clients ?? [])
      .filter((c) => c.logo?.src)
      .map((c) => ({ src: c.logo!.src, alt: c.logo!.alt || c.name }));
    return fromCms.length > 0 ? fromCms : fallback;
  }, [clients, fallback]);

  return (
    <section className="bg-white py-6xl">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <div className="">
          <Stagger
            as="div"
            className="mb-4xl flex flex-col items-start gap-sm pb-6 border-b border-slate-100"
            stagger={0.14}
          >
            <StaggerItem className="flex flex-col items-start">
              <p className="overline-sm-medium mb-sm text-slate-500">
                {t("clients.eyebrow")}
              </p>
              <MaskText
                as="h2"
                className="heading-xl-bold text-center text-slate-900"
                segments={[{ text: t("clients.title") }]}
                amount={0.5}
                duration={0.8}
              />
            </StaggerItem>
          </Stagger>

          <LogoMarquee
            logos={logos}
            durationSeconds={30}
            gap="4rem"
            imageHeight={48}
            imageWidth={140}
            className="mt-10"
          />
        </div>
      </div>
    </section>
  );
}
