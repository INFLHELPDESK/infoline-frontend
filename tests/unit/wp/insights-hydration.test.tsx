// @vitest-environment jsdom
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  environmentManager,
  focusManager,
  type DehydratedState,
} from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FormatsLive from "@/components/sections/insights/formats-live";
import { INSIGHTS_LIMIT } from "@/lib/content-adapters";
import type { Insight, InsightsSource } from "@/lib/insights";
import { loadInsightsFeed } from "@/lib/insights-feed";
import { wpKeys } from "@/lib/wp/keys";
import { getQueryClient } from "@/providers/query-client/get-query-client";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import { startCmsStub } from "../../support/cms-stub/harness";

// Presentation-only seams: motion needs IntersectionObserver, the i18n Link and
// next/image need the Next runtime. The data flow under test is untouched.
vi.mock("@/components/ui/motion", () => ({
  Stagger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  StaggerItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

/**
 * Server prefetch -> dehydrate -> server markup -> client hydration for the
 * Insights section, with the real loader, hooks, query-client factory and
 * Formats markup, against the CMS stub. The Next.js render itself is covered
 * by tests/e2e/cms/insights.spec.ts.
 */

const stub = startCmsStub();
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const messages = { en, ar } as const;
type Locale = keyof typeof messages;
const staticItems = (locale: Locale) => messages[locale].Insights.items as Insight[];

const SEASONAL = { en: "How to staff a seasonal peak", ar: "كيف تُجهّز فريقك لموسم الذروة" };
// Slugs the static blog detail route can render (page.tsx derives the same list).
let LINKABLE: string[] = [];
const SEASONAL_SLUG = { en: "seasonal-peak", ar: "seasonal-peak-ar" };

function Tree({
  client,
  state,
  locale,
  source,
}: {
  client: QueryClient;
  state: DehydratedState;
  locale: Locale;
  source: InsightsSource;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <QueryClientProvider client={client}>
        <HydrationBoundary state={state}>
          <FormatsLive
            fallback={staticItems(locale)}
            source={source}
            linkableSlugs={LINKABLE}
          />
        </HydrationBoundary>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

/** What the page does: fresh server client, prefetch, dehydrate. */
async function serverSide(locale: Locale) {
  environmentManager.setIsServer(() => true);
  try {
    const qc = getQueryClient();
    expect(getQueryClient()).not.toBe(qc); // server: a new client per request
    vi.spyOn(console, "error").mockImplementation(() => {});
    const feed = await loadInsightsFeed(qc, locale);
    return { feed, state: dehydrate(qc) };
  } finally {
    environmentManager.setIsServer(() => false);
  }
}

const recoverable: unknown[] = [];
let root: Root | undefined;
let container: HTMLElement;

async function renderAndHydrate(state: DehydratedState, locale: Locale, source: InsightsSource) {
  const html = renderToString(<Tree client={new QueryClient()} state={state} locale={locale} source={source} />);
  container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  await act(async () => {
    root = hydrateRoot(container, <Tree client={getQueryClient()} state={state} locale={locale} source={source} />, {
      onRecoverableError: (e) => recoverable.push(e),
    });
  });
  return html;
}

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 50))));
const sourceOf = (html: string) => /data-content-source="([^"]+)"/.exec(html)?.[1];

beforeEach(() => {
  LINKABLE = [];
  recoverable.length = 0;
  getQueryClient().clear();
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  container?.remove();
  getQueryClient().clear();
});

describe("CMS content: server markup and hydration", () => {
  it.each(["en", "ar"] as const)("renders %s CMS cards on the server and hydrates without a request", async (locale) => {
    const { feed, state } = await serverSide(locale);
    expect(feed.source).toBe("cms");
    expect(stub.graphqlRequests()).toHaveLength(1); // the prefetch itself

    const html = await renderAndHydrate(state, locale, feed.source);
    expect(sourceOf(html)).toBe("cms");
    expect(html).toContain(SEASONAL[locale]); // in the markup before any client JS
    // The static blog detail route cannot render this slug, so no link to a soft 404.
    expect(html).not.toMatch(new RegExp(`href="[^"]*/blog/${SEASONAL_SLUG[locale]}`));
    expect(html).toContain("data-unlinked");
    for (const item of staticItems(locale)) expect(html).not.toContain(item.title);

    await settle();
    expect(container.textContent).toContain(SEASONAL[locale]);
    expect(recoverable).toEqual([]); // no hydration mismatch
    expect(stub.graphqlRequests()).toHaveLength(1); // no duplicate request
    expect(stub.graphqlRequests()[0].variables).toMatchObject({ language: locale === "ar" ? "AR" : "EN" });
  });

  it("links a CMS card only when the blog detail route has its slug", async () => {
    LINKABLE = [SEASONAL_SLUG.en];
    const { feed, state } = await serverSide("en");
    const html = await renderAndHydrate(state, "en", feed.source);
    expect(html).toContain(`href="/blog/${SEASONAL_SLUG.en}"`);
    expect(html).not.toContain("data-unlinked");
  });

  it("does not reuse EN cache entries for an AR render", async () => {
    const { state } = await serverSide("en");
    const html = await renderAndHydrate(state, "ar", "cms");
    expect(html).not.toContain(SEASONAL.en);
    expect(sourceOf(html)).toBe("fallback-empty"); // nothing hydrated under the AR key
    for (const item of staticItems("ar")) expect(html).toContain(item.title);
  });

  it("dehydrates only the posts query, under the locale-aware key", async () => {
    const { state } = await serverSide("ar");
    expect(state.queries.map((q) => q.queryKey)).toEqual([wpKeys.latestPosts("ar", INSIGHTS_LIMIT)]);
  });

  it("does not refetch on window focus or reconnect (no browser CMS traffic)", async () => {
    const { feed, state } = await serverSide("en");
    await renderAndHydrate(state, "en", feed.source);
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      window.dispatchEvent(new Event("online"));
    });
    await settle();
    expect(stub.graphqlRequests()).toHaveLength(1);
  });
});

describe("client refetch", () => {
  it("an explicit refetch uses the locale's key, updates the cards, and keeps data if it then fails", async () => {
    const { feed, state } = await serverSide("en");
    await renderAndHydrate(state, "en", feed.source);
    const client = getQueryClient();

    await act(async () => {
      await client.refetchQueries({ queryKey: wpKeys.latestPosts("en", INSIGHTS_LIMIT) });
    });
    expect(stub.graphqlRequests()).toHaveLength(2);
    expect(stub.graphqlRequests()[1].variables).toMatchObject({ language: "EN" });
    expect(container.textContent).toContain(SEASONAL.en);

    stub.setScenario("graphql-error");
    await act(async () => {
      await client.refetchQueries({ queryKey: wpKeys.latestPosts("en", INSIGHTS_LIMIT) });
    });
    expect(container.textContent).toContain(SEASONAL.en); // data survives a failed refetch
    expect(client.getQueryState(wpKeys.latestPosts("en", INSIGHTS_LIMIT))?.fetchStatus).toBe("idle");
    expect(client.getQueryState(wpKeys.latestPosts("en", INSIGHTS_LIMIT))?.data).toBeDefined();
  });

  it("a refetch that finds the CMS emptied falls back to the static cards, labelled as empty", async () => {
    const { feed, state } = await serverSide("en");
    await renderAndHydrate(state, "en", feed.source);
    stub.setScenario("empty");
    await act(async () => {
      await getQueryClient().refetchQueries({ queryKey: wpKeys.latestPosts("en", INSIGHTS_LIMIT) });
    });
    await settle(); // observers notify on a later tick
    expect(container.querySelector("section")?.getAttribute("data-content-source")).toBe("fallback-empty");
    for (const item of staticItems("en")) expect(container.textContent).toContain(item.title);
  });
});

describe("static fallback", () => {
  it.each([
    ["empty", "fallback-empty"],
    ["graphql-error", "fallback-error"],
    ["http-error", "fallback-error"],
    ["malformed-json", "fallback-error"],
  ] as const)("%s -> static %s cards, server-rendered, with no browser request", async (scenario, expected) => {
    stub.setScenario(scenario);
    const { feed, state } = await serverSide("en");
    expect(feed.source).toBe(expected);

    const html = await renderAndHydrate(state, "en", feed.source);
    expect(sourceOf(html)).toBe(expected);
    for (const item of staticItems("en")) expect(html).toContain(item.title);
    expect(html).not.toContain(SEASONAL.en);

    stub.setScenario("ok"); // the CMS recovers; a fallback render must not go and look
    await settle();
    expect(stub.graphqlRequests()).toHaveLength(1);
    expect(recoverable).toEqual([]);
  });

  it("the static cards keep the original items and links (AR)", async () => {
    stub.setScenario("http-error");
    const { feed, state } = await serverSide("ar");
    const html = await renderAndHydrate(state, "ar", feed.source);
    const links = [...html.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
    // The header "View all" button is not a card; cards are the article links.
    const cardLinks = links.filter((href) => href !== "/blog");
    expect(cardLinks).toEqual(staticItems("ar").map((i) => i.href));
  });
});
