// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import Article from "@/components/sections/blog/article";
import SingleHero from "@/components/sections/blog/single-hero";
import { toInsightDetail } from "@/lib/insights-detail";
import type { Insight } from "@/lib/wp/types";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock("@/components/ui/motion", () => {
  const Pass = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  );
  return {
    Stagger: Pass,
    StaggerItem: Pass,
    Reveal: Pass,
    SpotlightCard: Pass,
    MaskText: ({ segments }: { segments: { text: string }[] }) => <h1>{segments.map((s) => s.text).join("")}</h1>,
  };
});

afterEach(cleanup);

const insight = (over: Partial<Insight> = {}): Insight => ({
  databaseId: 1,
  title: "A title",
  slug: "a-title",
  uri: "/insights/a-title/",
  date: "2026-10-12T09:00:00",
  excerpt: "<p>Short excerpt</p>",
  image: null,
  locale: "en",
  translations: [],
  types: [{ name: "Article", slug: "article" }],
  topics: [],
  isFeatured: false,
  eventDetails: null,
  content:
    '<p>Lead paragraph.</p><h2>Section</h2><p>Read <a href="/services">services</a> or <a href="https://example.test/r">the report</a>.</p>' +
    '<script>window.x=1</script><p onclick="x()">Tail</p>',
  seo: { title: null, description: null, openGraphTitle: null, openGraphDescription: null },
  ...over,
});

function view(locale: "en" | "ar", over: Partial<Insight> = {}) {
  const detail = toInsightDetail(insight({ locale, ...over }), locale, {
    article: "Articles",
    event: "Events",
    news: "News",
  });
  if (!detail) throw new Error("detail expected");
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en}>
      <SingleHero post={detail.post} backHref={detail.backHref} readMinutes={detail.readMinutes} event={detail.event} />
      <Article post={detail.post} morePosts={[]} bodyHtml={detail.bodyHtml} />
    </NextIntlClientProvider>,
  );
}

describe("Insight detail view", () => {
  it("renders title, excerpt, category, date and reading time in the approved hero", () => {
    view("en");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("A title");
    expect(screen.getByText("Short excerpt")).toBeTruthy();
    expect(screen.getByText("Articles")).toBeTruthy();
    expect(screen.getByText(/1\s*min/)).toBeTruthy();
  });

  it("renders sanitized body HTML: lead, heading, links; no script or handlers", () => {
    const { container } = view("en");
    expect(screen.getByText("Lead paragraph.")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onclick]")).toBeNull();

    const internal = screen.getByRole("link", { name: "services" });
    expect(internal.getAttribute("href")).toBe("/services");
    expect(internal.getAttribute("target")).toBeNull();
    const external = screen.getByRole("link", { name: "the report" });
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("falls back to the default image when the record has none", () => {
    const { container } = view("en");
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/assets/insights/i1.svg");
  });

  it("Arabic: Arabic copy, internal body links get /ar once, back arrow is RTL-flipped", () => {
    const { container } = view("ar", { title: "عنوان", excerpt: "<p>ملخص</p>" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("عنوان");
    expect(screen.getByRole("link", { name: "services" }).getAttribute("href")).toBe("/ar/services");
    expect(screen.getByRole("link", { name: ar.Blog.page.single.backLabel }).getAttribute("href")).toBe("/blog");
    expect(container.querySelector("svg.rtl\\:rotate-180")).not.toBeNull();
    expect(container.innerHTML).not.toContain("/ar/ar");
  });

  it("Event: shows date range, location and a safe registration link", () => {
    const { container } = view("en", {
      types: [{ name: "Event", slug: "event" }],
      eventDetails: {
        start: "2026-11-17T00:00:00+00:00",
        end: "2026-11-18T00:00:00+00:00",
        location: "Muscat",
        url: "https://example.test/register",
      },
    });
    const details = container.querySelector("[data-event-details]");
    expect(details?.textContent).toContain("17 Nov 2026 – 18 Nov 2026");
    expect(details?.textContent).toContain("Muscat");
    const link = screen.getByRole("link", { name: en.Blog.page.single.eventRegister });
    expect(link.getAttribute("href")).toBe("https://example.test/register");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByRole("link", { name: en.Blog.page.single.backLabel }).getAttribute("href")).toBe("/insights");
  });

  it("Event with no fields, and Article/News, render no event block", () => {
    const empty = { start: null, end: null, location: null, url: null };
    expect(view("en", { types: [{ name: "Event", slug: "event" }], eventDetails: empty }).container.querySelector("[data-event-details]")).toBeNull();
    cleanup();
    expect(view("en", { types: [{ name: "News", slug: "news" }] }).container.querySelector("[data-event-details]")).toBeNull();
  });

  it("an excerpt-only record still renders as the article", () => {
    view("en", { content: null });
    expect(screen.getAllByText("Short excerpt").length).toBeGreaterThan(0);
  });
});
