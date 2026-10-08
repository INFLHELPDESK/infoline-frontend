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
    <section className="pb-4 lg:pb-6">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-2xl bg-brandblue-50 px-7 py-10 lg:px-12 lg:py-14"
          amount={0.25}
          duration={1.1}
        >
          {/* Faint grid wash, left side per the design */}
          <div
            aria-hidden
            className="grid-pattern absolute inset-y-0 start-0 w-[45%] opacity-60"
          />

          <div className="relative z-10 grid gap-2xl lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
            <h2 className="heading-xl-bold max-w-[30ch] text-slate-900">
              {t("proof.title")}
            </h2>

            <ol>
              {items.map((item, i) => (
                <li
                  key={item.title}
                  className="flex items-start gap-xl border-b border-slate-200 py-7 last:border-b-0 last:pb-0"
                >
                  <span
                    aria-hidden
                    className="text-[44px] font-semibold text-brandblue-300"
                  >
                    {String(i + 1).padStart(2, "0")}.
                  </span>
                  <div>
                    <h3 className="body-lg-semibold mb-1.5 text-slate-900">
                      {item.title}
                    </h3>
                    <p className="body-md-regular mb-3.5 max-w-[56ch] text-slate-600">
                      {item.description}
                    </p>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-2 text-[13px] font-medium text-brandblue-300 transition-colors hover:text-brandblue-800"
                    >
                      {t("proof.cta")}
                      <ArrowRight className="size-4 transition-transform duration-300 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
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
