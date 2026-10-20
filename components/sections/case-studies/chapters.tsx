import { useTranslations } from "next-intl";
import {
  Stagger,
  StaggerItem,
  CountUp,
  MaskText,
} from "@/components/ui/motion";

type ApproachRow = { label: string; text: string };
type Result = { value: string; unit: string; text: string };
type Quote = { text: string; attribution: string };

type Chapter = {
  number: string;
  tag: string;
  client: string;
  scale: string;
  serviceLine: string;
  title: string;
  challenge: string;
  approachRows?: ApproachRow[];
  approachText?: string;
  results: Result[];
  quote?: Quote;
};

/**
 * The three case studies. Each chapter pairs a quiet meta rail (number, client,
 * scale, service line) with the story: challenge → approach → results, closed by
 * the client quote where we have one. Content is fully data-driven from the
 * CaseStudiesPage translations so new chapters are one JSON block.
 */
export default function Chapters() {
  const t = useTranslations("CaseStudiesPage");
  const chapters = t.raw("chapters") as Chapter[];
  const label = (k: string) => t(`labels.${k}`);

  return (
    <section className="bg-white pt-20 pb-24">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <div className="flex flex-col gap-28 lg:gap-44">
          {chapters.map((c) => (
            <article
              key={c.number}
              id={`case-${c.number}`}
              className="grid gap-12 lg:grid-cols-[306px_1fr] lg:gap-[74px]"
            >
              {/* Meta rail */}
              <Stagger
                as="div"
                className="flex flex-col items-start lg:sticky lg:top-32 lg:self-start"
                stagger={0.1}
                delayChildren={0.05}
                amount={0.25}
              >
                <StaggerItem
                  as="span"
                  className="text-[72px] font-bold leading-[1.2] text-lightblue-300 [direction:ltr] lg:text-[100px]"
                  blur={false}
                >
                  {c.number}.
                </StaggerItem>

                <StaggerItem className="mt-2">
                  <span className="text-[13px] leading-4 uppercase tracking-[1.5px] font-medium text-brandblue-600">
                    {label("caseStudy")} · {c.tag}
                  </span>
                </StaggerItem>

                <StaggerItem className="mt-5 flex w-full flex-col gap-2 border-t border-grey-300 pt-5">
                  <div className="text-[13px] leading-4 uppercase tracking-[1.5px] font-medium text-slate-500">
                    {label("client")}
                  </div>
                  <p className="max-w-[34ch] text-[13px] leading-5 text-ink">
                    {c.client}
                  </p>
                </StaggerItem>

                {c.scale ? (
                  <StaggerItem className="mt-5 flex w-full flex-col gap-2 border-t border-grey-300 pt-5">
                    <div className="text-[13px] leading-4 uppercase tracking-[1.5px] font-medium text-slate-500">
                      {label("scale")}
                    </div>
                    <p className="max-w-[34ch] text-[13px] leading-5 text-ink">
                      {c.scale}
                    </p>
                  </StaggerItem>
                ) : null}

                <StaggerItem className="mt-5 flex w-full flex-col gap-2 border-t border-grey-300 pt-5">
                  <div className="text-[13px] leading-4 uppercase tracking-[1.5px] font-medium text-slate-500">
                    {label("serviceLine")}
                  </div>
                  <p className="max-w-[34ch] text-[13px] leading-5 font-medium text-ink">
                    {c.serviceLine}
                  </p>
                </StaggerItem>
              </Stagger>

              {/* Story column */}
              <div>
                <MaskText
                  as="h2"
                  className="max-w-[895px] text-[28px] font-bold leading-9 text-ink lg:text-[36px] lg:leading-11"
                  segments={[{ text: c.title }]}
                  amount={0.3}
                  stagger={0.05}
                />

                {/* Challenge */}
                <Stagger
                  as="div"
                  className="mt-8"
                  stagger={0.08}
                  amount={0.2}
                >
                  <StaggerItem
                    as="h3"
                    className="text-[14px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-900"
                    distance={20}
                  >
                    01 — {label("challenge")}
                  </StaggerItem>
                  <StaggerItem
                    as="p"
                    className="mt-4 text-[14px] leading-5 text-slate-900"
                    distance={28}
                  >
                    {c.challenge}
                  </StaggerItem>
                </Stagger>

                {/* Approach */}
                <Stagger
                  as="div"
                  className="mt-8 border-t border-grey-300 pt-8"
                  stagger={0.08}
                  amount={0.2}
                >
                  <StaggerItem
                    as="h3"
                    className="text-[14px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-900"
                    distance={20}
                  >
                    02 — {label("approach")}
                  </StaggerItem>

                  {c.approachRows ? (
                    <dl className="mt-3 flex flex-col gap-1.5">
                      {c.approachRows.map((row) => (
                        <StaggerItem
                          key={row.label}
                          className="grid grid-cols-[109px_1fr] items-center gap-2.5 py-3"
                          distance={24}
                        >
                          <dt className="text-[13px] leading-4 uppercase tracking-[1.5px] font-medium text-brandblue-500">
                            {row.label}
                          </dt>
                          <dd className="text-[14px] leading-5 text-slate-700">
                            {row.text}
                          </dd>
                        </StaggerItem>
                      ))}
                    </dl>
                  ) : (
                    <StaggerItem
                      as="p"
                      className="mt-4 text-[14px] leading-5 text-slate-700"
                      distance={28}
                    >
                      {c.approachText}
                    </StaggerItem>
                  )}
                </Stagger>

                {/* Results */}
                <Stagger
                  as="div"
                  className="mt-8 border-t border-grey-300 pt-8"
                  stagger={0.08}
                  amount={0.2}
                >
                  <StaggerItem
                    as="h3"
                    className="text-[14px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-900"
                    distance={20}
                  >
                    03 — {label("results")}
                  </StaggerItem>

                  <Stagger
                    as="ul"
                    className={`mt-4 grid gap-3 rounded-2xl bg-[#fafafa] p-4 ${
                      c.results.length >= 4
                        ? "grid-cols-2 lg:grid-cols-4"
                        : "grid-cols-1 sm:grid-cols-3"
                    }`}
                    stagger={0.1}
                    delayChildren={0.1}
                    amount={0.2}
                  >
                    {c.results.map((r) => (
                      <StaggerItem
                        as="li"
                        key={r.value + r.unit}
                        distance={28}
                        blur={false}
                      >
                        <div className="flex h-full flex-col px-6 py-3">
                          <CountUp
                            value={r.value}
                            className="w-fit text-[40px] font-bold leading-[1.17] text-brandblue-500 [direction:ltr] lg:text-[48px] lg:leading-14"
                          />
                          <p className="pt-3 text-[14px] leading-5 text-slate-500">
                            <span className="font-medium text-brandblue-500">
                              {r.unit}
                            </span>{" "}
                            {r.text}
                          </p>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </Stagger>

                {/* Quote */}
                {c.quote ? (
                  <Stagger
                    as="div"
                    className="mt-8 rounded-e-[99px] border-s-4 border-brandblue-500 bg-[#f6f9fb] px-6 py-4"
                    amount={0.25}
                  >
                    <StaggerItem distance={28}>
                      <figure>
                        <blockquote className="">
                          <p className="text-[20px] leading-7 font-bold text-brandblue-600 lg:text-[24px]">
                            {c.quote.text}
                          </p>
                        </blockquote>
                        <figcaption className="pt-5 text-[14px] leading-4 font-medium uppercase tracking-[1.5px] text-slate-700">
                          {c.quote.attribution}
                        </figcaption>
                      </figure>
                    </StaggerItem>
                  </Stagger>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
