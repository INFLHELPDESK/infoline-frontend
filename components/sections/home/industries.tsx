import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MaskText, Stagger, StaggerItem } from "@/components/ui/motion";

type Sector = {
  id: string;
  title: string;
  image: string;
  headline: string;
};

/**
 * Industries — the home page teaser grid. Cards reuse the same sector data
 * (title/image/headline) as the /industries page itself, and each links
 * straight to that sector's slide there (`/industries#sec-<id>`), so the two
 * pages never drift out of sync.
 */
export default function Industries() {
  const t = useTranslations("Industries");
  const tIndustries = useTranslations("IndustriesPage");
  const items = tIndustries.raw("sectors.items") as Sector[];

  return (
    <section className="bg-white py-20 text-[#0a1014] sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        {/* Header */}
        <Stagger
          as="div"
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          stagger={0.15}
        >
          <StaggerItem direction="start">
            <p className="text-[12px] overline-sm-medium uppercase tracking-[0.28em] text-slate-600">
              {t("eyebrow")}
            </p>
            <MaskText
              as="h2"
              className="mt-3 max-w-[20ch] heading-2xl-semibold leading-tight tracking-tight sm:text-[42px]"
              segments={[{ text: t("title") }]}
              amount={0.5}
              duration={0.8}
            />
          </StaggerItem>
          <StaggerItem
            as="p"
            direction="end"
            className="max-w-[55ch] body-lg-regular leading-relaxed text-slate-600"
          >
            {t("description")}
          </StaggerItem>
        </Stagger>

        {/* Grid */}
        <Stagger
          as="ul"
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.11}
        >
          {items.map((item) => (
            <StaggerItem as="li" key={item.id}>
              <Link
                href={`/industries#sec-${item.id}`}
                className="group relative block aspect-[4/3] max-h-[254px] w-full overflow-hidden rounded-2xl"
              >
                {/* 1. Image — bottom layer */}
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
                />

                {/* 2. Gradient — in front of image, behind text.
              Slightly stronger on hover for legibility. */}
                <div className="industries-card_gradient absolute inset-0 opacity-90 transition-opacity duration-500 group-hover:opacity-100" />

                {/* 3. Hover blue wash */}
                <div className="absolute inset-0 bg-brandblue-500/0 transition-colors duration-500 group-hover:bg-brandblue-500/15" />

                {/* 4. Text — top layer */}
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-lg font-semibold leading-snug text-white">
                    {item.title}
                  </h3>

                  {/* Description: revealed on hover */}
                  <div className="grid grid-rows-[0fr] transition-all duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:grid-rows-[1fr] group-hover:mt-2">
                    <p className="line-clamp-2 max-w-[90%] overflow-hidden text-[14px] leading-relaxed text-white/75 opacity-0 -translate-y-1 transition-all duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:opacity-100 group-hover:translate-y-0">
                      {item.headline}
                    </p>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
