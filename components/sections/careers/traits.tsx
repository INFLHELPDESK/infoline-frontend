import { useTranslations } from "next-intl";
import Image from "next/image";
import { Eyebrow } from "@/components/sections/home-1/shared";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

/**
 * "What we look for" — six outlined trait pills with icons, wrapping freely
 * exactly like the design's loose pill cloud.
 */
export default function Traits() {
  const t = useTranslations("CareersPage");
  const items = t.raw("traits.items") as {
    icon: string;
    height?: number;
    width?: number;
    label: string;
  }[];

  return (
    <section className="bg-white pb-20 lg:pb-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="flex flex-col items-start"
          stagger={0.1}
          delayChildren={0.05}
          amount={0.3}
        >
          <StaggerItem className="mb-5" distance={24}>
            <Eyebrow className="border border-slate-100">
              {t("traits.eyebrow")}
            </Eyebrow>
          </StaggerItem>

          <MaskText
            as="h2"
            className="max-w-[766px] text-[32px] leading-[1.1] font-semibold lg:text-[40px] lg:leading-11 text-ink"
            segments={[{ text: t("traits.title") }]}
            stagger={0.05}
            duration={0.85}
          />

          <Stagger
            as="ul"
            className="mt-10 flex max-w-[1278px] flex-wrap gap-6"
            stagger={0.07}
            delayChildren={0.1}
            amount={0.2}
          >
            {items.map((item) => {
              return (
                <StaggerItem
                  as="li"
                  key={item.label}
                  distance={24}
                  className="group box-border flex flex-none cursor-default items-center gap-4 rounded-full border border-[#cfd8dc] py-5 ps-6 pe-7 transition-colors duration-200 hover:border-brandblue-200 hover:bg-[#F3FAFD]"
                >
                  <span className="relative flex size-7 flex-none items-center justify-center">
                    <Image
                      src={item.icon}
                      height={item.height || 20}
                      width={item.width || 20}
                      className="object-contain transition-transform duration-200 [&_path]:fill-brandblue-500"
                      alt=""
                      aria-hidden
                    />
                  </span>
                  <h3 className="items-center text-wrap text-[20px] leading-6 font-medium text-slate-700">
                    {item.label}
                  </h3>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Stagger>
      </div>
    </section>
  );
}
