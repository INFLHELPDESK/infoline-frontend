// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Formats from "@/components/sections/insights/formats";
import Proof from "@/components/sections/insights/proof";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const wrap = (locale: "en" | "ar", messages: typeof en, ui: React.ReactElement) =>
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );

describe("Insights case studies copy", () => {
  it("renders the approved English eyebrow, heading and description", () => {
    const { container } = wrap("en", en, <Proof />);
    expect(container.querySelector("span.text-brandblue-300")?.textContent).toBe("Case studies");
    expect(container.querySelector("h2")?.textContent).toBe(
      "Three operations, three numbers that moved",
    );
    expect(container.querySelector("h2 + p")?.textContent).toBe(
      "Real results from real partnerships. See how our collaborations have driven measurable improvements in customer experience and operational performance.",
    );
  });

  it("keeps the three case-study links", () => {
    const { container } = wrap("en", en, <Proof />);
    const links = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/case-studies", "/case-studies", "/case-studies"]);
  });

  it("has Arabic eyebrow and heading reusing the approved Case Studies page copy", () => {
    expect(ar.InsightsPage.proof.eyebrow).toBe(ar.CaseStudiesPage.hero.eyebrow);
    expect(ar.InsightsPage.proof.title).toBe(
      `${ar.CaseStudiesPage.hero.titleLead} ${ar.CaseStudiesPage.hero.titleAccent}`,
    );
  });
});

describe("Insights formats actions", () => {
  const insights = [{ category: "C", title: "Card", image: "/x.png", href: "/blog/x" }];

  it.each([
    ["en", en],
    ["ar", ar],
  ] as const)("shows one View all link to the blog list and no Browse All link (%s)", (locale, m) => {
    const { container } = wrap(locale, m as typeof en, <Formats insights={insights} />);
    const all = container.querySelectorAll('a[href="/blog"]');
    expect(all).toHaveLength(1);
    expect(container.querySelector("h2")?.parentElement?.parentElement?.contains(all[0])).toBe(true);
    expect(all[0].querySelector("svg[class*=\"rtl:rotate-180\"]")).not.toBeNull();
    expect(container.textContent?.toLowerCase()).not.toContain("browse all");
  });

  it("labels the English button View all", () => {
    const { container } = wrap("en", en, <Formats insights={insights} />);
    expect(container.querySelector('a[href="/blog"]')?.textContent).toBe("View all");
  });
});

describe("Insights article cards", () => {
  const full = {
    category: "Customer Experience",
    title: "Full card",
    image: "/x.png",
    href: "/blog/full",
    date: "2026-09-26",
    excerpt: "A short plain-text teaser.",
    readMinutes: 6,
  };
  const bare = { category: "Cat", title: "Bare card", image: "/y.png", href: "/blog/bare" };
  const plain = { ...bare, title: "Plain card", href: "" };

  it("renders category, localized date, reading time, excerpt and Read more (en)", () => {
    const { container } = wrap("en", en, <Formats insights={[full]} />);
    const card = container.querySelector('a[href="/blog/full"]')!;
    const meta = card.querySelector("p")!.textContent!;
    expect(meta).toContain("Customer Experience");
    expect(meta).toContain("26 Sept 2026");
    expect(meta).toMatch(/6\s?min/);
    expect(card.querySelector("p.line-clamp-2")?.textContent).toBe(full.excerpt);
    expect(card.textContent).toContain("Read more");
    expect(card.querySelector("a")).toBeNull(); // one link per card, nothing nested
    expect(card.querySelector('svg[class*="rtl:rotate-180"]')).not.toBeNull();
  });

  it("localizes the date and label in Arabic", () => {
    const { container } = wrap("ar", ar as typeof en, <Formats insights={[full]} />);
    const card = container.querySelector('a[href="/blog/full"]')!;
    expect(card.querySelector("p")!.textContent).toContain("سبتمبر");
    expect(card.textContent).toContain(ar.Blog.page.readMore);
  });

  it("omits missing optional fields without leaving empty chrome", () => {
    const { container } = wrap("en", en, <Formats insights={[bare, plain]} />);
    const cards = container.querySelectorAll("h3");
    expect(cards).toHaveLength(2);
    expect(container.querySelector("p.line-clamp-2")).toBeNull();
    expect(container.querySelectorAll("span.w-px")).toHaveLength(0);
    const metaOf = (title: string) =>
      [...container.querySelectorAll("h3")].find((h) => h.textContent === title)!.previousElementSibling!;
    expect(metaOf("Bare card").textContent).toBe("Cat");
    // The unlinked card has no destination, so no Read more affordance.
    const unlinked = container.querySelector("[data-unlinked]")!;
    expect(unlinked.textContent).not.toContain("Read more");
  });

});
