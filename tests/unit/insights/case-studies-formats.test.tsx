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
