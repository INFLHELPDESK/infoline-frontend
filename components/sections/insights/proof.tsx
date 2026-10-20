import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/motion";

type ProofItem = { title: string; description: string; href: string };

/**
 * Numbered proof list — the pale card with the faint grid wash: big light-blue
 * "01." ordinals, result title + description, and a "Read case study" arrow
 * link per row. Rows reveal with a slight stagger inside the card.
 */
export default function Proof() {
  const t = useTranslations("InsightsPage");
  const items = t.raw("proof.items") as ProofItem[];

  return (
    <section className="pb-12">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-[#0D161B] px-7 py-10 lg:px-[42px] lg:py-[62px]"
          amount={0.25}
          duration={1.1}
        >
          {/* Soft teal glows, per the design */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-1/4 start-0 h-[466px] w-[568px] rounded-full bg-[radial-gradient(circle,rgba(0,188,212,0.13)_0%,transparent_70%)] blur-[13px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[40%] end-0 h-[383px] w-[635px] rounded-full bg-[radial-gradient(circle,rgba(0,188,212,0.13)_0%,transparent_70%)] blur-[13px]"
          />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,526px)_minmax(0,571px)] lg:justify-between">
            <h2 className="max-w-[551px] text-[28px] leading-9 font-semibold text-white lg:text-[36px] lg:leading-11">
              {t("proof.title")}
            </h2>

            <ol>
              {items.map((item, i) => (
                <li
                  key={item.title}
                  className="flex items-start gap-6 border-b border-[rgba(224,224,224,0.12)] py-6 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <span
                    aria-hidden
                    className="w-[98px] flex-none text-[44px] leading-[1.05] font-bold text-lightblue-300 [direction:ltr]"
                  >
                    {String(i + 1).padStart(2, "0")}.
                  </span>
                  <div>
                    <h3 className="mb-2 text-[16px] leading-6 font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="mb-4 max-w-[446px] text-[14px] leading-5 text-slate-400">
                      {item.description}
                    </p>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-2 text-[14px] leading-5 text-brandblue-500 transition-colors hover:text-lightblue-300"
                    >
                      {t("proof.cta")}
                      <ArrowRight className="size-[18px] transition-transform duration-300 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
