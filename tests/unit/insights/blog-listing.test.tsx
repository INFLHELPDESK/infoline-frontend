// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Empty from "@/components/sections/blog/empty";
import Featured from "@/components/sections/blog/featured";
import Updates from "@/components/sections/blog/updates";
import Formats from "@/components/sections/insights/formats";
import type { BlogPost } from "@/lib/blog";
import { loadMoreArticles } from "@/lib/insights-actions";
import type { Insight } from "@/lib/insights";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

vi.mock("@/lib/insights-actions", () => ({ loadMoreArticles: vi.fn() }));
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
  return { Stagger: Pass, StaggerItem: Pass, Reveal: Pass, SpotlightCard: Pass };
});

beforeEach(() => {
  vi.mocked(loadMoreArticles).mockReset();
});
afterEach(cleanup);

const loadMore = vi.mocked(loadMoreArticles);

const post = (n: number, over: Partial<BlogPost> = {}): BlogPost => ({
  id: n,
  slug: `post-${n}`,
  href: `/insights/post-${n}`,
  category: "Articles",
  date: "2026-10-01",
  dateLabel: "01 Oct 2026",
  title: `Post ${n}`,
  excerpt: `Excerpt ${n}`,
  body: [],
  image: "/assets/insights/i1.svg",
  ...over,
});

const wrap = (ui: React.ReactElement, locale: "en" | "ar" = "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en}>
      {ui}
    </NextIntlClientProvider>,
  );

describe("Updates (CMS articles)", () => {
  it("links every card to its CMS Insight URI, not /blog/<slug>", () => {
    wrap(<Updates posts={[post(1), post(2)]} source="cms" pageInfo={{ hasNextPage: false, endCursor: null }} />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/insights/post-1", "/insights/post-2"]);
  });

  it("hides the type chips (every CMS item is an article) and keeps them for the static list", () => {
    const { unmount } = wrap(<Updates posts={[post(1)]} source="cms" />);
    expect(screen.queryByRole("button", { name: "Events" })).toBeNull();
    unmount();
    wrap(<Updates posts={[post(1, { href: undefined })]} />);
    expect(screen.getByRole("button", { name: "Events" })).toBeTruthy();
  });

  it("shows Load more only while the CMS reports another page", () => {
    const { unmount } = wrap(<Updates posts={[post(1)]} source="cms" pageInfo={{ hasNextPage: true, endCursor: "c1" }} />);
    expect(screen.getByRole("button", { name: "Load more" })).toBeTruthy();
    unmount();
    wrap(<Updates posts={[post(1)]} source="cms" pageInfo={{ hasNextPage: false, endCursor: null }} />);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("Load more appends the next page after the cursor, ignores duplicates and hides the button at the end", async () => {
    loadMore.mockResolvedValueOnce({ ok: true, posts: [post(2), post(3)], hasNextPage: false, endCursor: "c2" });
    wrap(<Updates posts={[post(1), post(2)]} source="cms" pageInfo={{ hasNextPage: true, endCursor: "c1" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(screen.getByText("Post 3")).toBeTruthy());
    expect(loadMore).toHaveBeenCalledWith("en", "c1");
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Post 1", "Post 2", "Post 3"]);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("is busy and ignores a second click while a page is loading", async () => {
    let resolve!: (v: Awaited<ReturnType<typeof loadMoreArticles>>) => void;
    loadMore.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    wrap(<Updates posts={[post(1)]} source="cms" pageInfo={{ hasNextPage: true, endCursor: "c1" }} />);
    const button = screen.getByRole("button", { name: "Load more" });
    fireEvent.click(button);
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBe("true"));
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(loadMore).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ ok: true, posts: [post(2)], hasNextPage: true, endCursor: "c2" }));
    await waitFor(() => expect(screen.getByText("Post 2")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Load more" })).toBeTruthy();
  });

  it("a failed Load more shows an alert, keeps the posts and the same cursor, and can be retried", async () => {
    loadMore.mockResolvedValueOnce({ ok: false });
    wrap(<Updates posts={[post(1)]} source="cms" pageInfo={{ hasNextPage: true, endCursor: "c1" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect((await screen.findByRole("alert")).textContent).toBe(en.Blog.page.loadMoreError);
    expect(screen.getByText("Post 1")).toBeTruthy();

    loadMore.mockResolvedValueOnce({ ok: true, posts: [post(2)], hasNextPage: false, endCursor: "c2" });
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(screen.getByText("Post 2")).toBeTruthy());
    expect(loadMore).toHaveBeenLastCalledWith("en", "c1");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("treats a thrown action (network) like a failure", async () => {
    loadMore.mockRejectedValueOnce(new Error("offline"));
    wrap(<Updates posts={[post(1)]} source="cms" pageInfo={{ hasNextPage: true, endCursor: "c1" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("Arabic: localized controls, locale passed to the action, links without a locale prefix", async () => {
    loadMore.mockResolvedValueOnce({ ok: true, posts: [post(2, { title: "مقال ٢" })], hasNextPage: false, endCursor: null });
    wrap(
      <Updates posts={[post(1, { title: "مقال ١" })]} source="cms" pageInfo={{ hasNextPage: true, endCursor: "c1" }} />,
      "ar",
    );
    fireEvent.click(screen.getByRole("button", { name: ar.Blog.page.loadMore }));
    await waitFor(() => expect(screen.getByText("مقال ٢")).toBeTruthy());
    expect(loadMore).toHaveBeenCalledWith("ar", "c1");
    for (const a of screen.getAllByRole("link")) expect(a.getAttribute("href")).not.toMatch(/^\/ar\b/);
  });
});

describe("Featured", () => {
  it("opens the CMS Insight URI", () => {
    wrap(<Featured post={post(7)} />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/insights/post-7");
  });

  it("keeps /blog/<slug> for a static post", () => {
    wrap(<Featured post={post(7, { href: undefined, slug: "copc-audit" })} />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/blog/copc-audit");
  });
});

describe("Empty state", () => {
  it.each([
    ["en", en.Blog.page.empty],
    ["ar", ar.Blog.page.empty],
  ] as const)("%s renders its own copy", (locale, copy) => {
    const { container } = wrap(<Empty />, locale);
    expect(within(container).getByRole("heading").textContent).toBe(copy.title);
    expect(container.textContent).toContain(copy.description);
    expect(container.querySelector("a, button")).toBeNull();
  });

  it("has no hard left/right alignment classes (RTL-safe)", () => {
    const { container } = wrap(<Empty />, "ar");
    expect(container.innerHTML).not.toMatch(/\b(?:text-left|text-right|ml-|mr-|pl-|pr-)/);
  });
});

describe("Insights Formats", () => {
  const insights: Insight[] = [
    { category: "Articles", title: "Lead", image: "/a.svg", href: "/insights/lead", date: "2026-10-12T09:00:00" },
    { category: "Events", title: "Forum", image: "/b.svg", href: "/insights/forum" },
  ];

  it("renders every type with its CMS link", () => {
    wrap(<Formats insights={insights} contentSource="cms" />);
    expect(screen.getByRole("link", { name: /Lead/ }).getAttribute("href")).toBe("/insights/lead");
    expect(screen.getByRole("link", { name: /Forum/ }).getAttribute("href")).toBe("/insights/forum");
    expect(document.querySelector("[data-empty]")).toBeNull();
  });

  it.each([
    ["en", en],
    ["ar", ar],
  ] as const)("%s empty: shows its empty message and no cards", (locale, messages) => {
    const { container } = wrap(<Formats insights={[]} contentSource="empty" />, locale);
    expect(container.querySelector("section")?.getAttribute("data-content-source")).toBe("empty");
    expect(container.querySelector("[data-empty]")?.textContent).toBe(messages.InsightsPage.formats.empty);
    expect(container.querySelectorAll("h3")).toHaveLength(0);
  });
});
