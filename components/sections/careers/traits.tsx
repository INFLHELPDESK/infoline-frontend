import { useTranslations } from "next-intl";
import Image from "next/image";
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
    <section className="bg-white pb-24 lg:pb-32">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="flex flex-col items-start"
          stagger={0.1}
          delayChildren={0.05}
          amount={0.3}
        >
          <StaggerItem className="mb-5" distance={24}>
            <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-brandblue-600">
              {t("traits.eyebrow")}
            </span>
          </StaggerItem>

          <MaskText
            as="h2"
            className="max-w-[26ch] text-[30px] font-bold leading-[1.15] tracking-[-.025em] text-ink lg:text-[40px]"
            segments={[{ text: t("traits.title") }]}
            stagger={0.05}
            duration={0.85}
          />

          <Stagger
            as="ul"
            className="mt-12 flex flex-wrap gap-3.5"
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
                  className="group box-border flex flex-none cursor-default items-center gap-4 rounded-full border border-slate-100  py-4 ps-6 pe-7 shadow-[0px_24px_40px_-34px_rgba(38,50,56,0.1)] transition-colors duration-200 hover:border-brandblue-200 hover:bg-[#F3FAFD]"
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
                  <h3 className="items-center text-wrap body-xl-medium text-slate-700">
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
