// @vitest-environment jsdom
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  HydrationBoundary,
  QueryClientProvider,
  QueryClient,
  dehydrate,
  environmentManager,
  type DehydratedState,
} from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getQueryClient } from "@/providers/query-client/get-query-client";
import { getServices } from "@/lib/wp/api";
import { wpKeys } from "@/lib/wp/keys";
import { useServices } from "@/lib/wp/hooks";
import { prefetchServices } from "@/lib/wp/server";
import { startCmsStub } from "../../support/cms-stub/harness";

/**
 * Server prefetch -> dehydrate -> server markup -> client hydration, using the
 * real query-client factory, real prefetch helpers and real hooks, against the
 * CMS stub. No app route is involved (none is wired to WordPress yet), so this
 * proves the lib/wp + provider contract, not a Next.js render; the first
 * wired page still needs its own E2E.
 */

const stub = startCmsStub();

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function ServiceTitles() {
  const { data, error, isPending } = useServices({ retry: false });
  if (isPending) return <p data-state="loading">loading</p>;
  if (error) return <p data-state="error">unavailable</p>;
  if (!data.items.length) return <p data-state="empty">no services</p>;
  return (
    <ul data-state="ready">
      {data.items.map((s) => (
        <li key={s.uri}>{s.title}</li>
      ))}
    </ul>
  );
}

function Tree({ client, state, locale }: { client: QueryClient; state: DehydratedState; locale: string }) {
  return (
    <NextIntlClientProvider locale={locale} messages={{}}>
      <QueryClientProvider client={client}>
        <HydrationBoundary state={state}>
          <ServiceTitles />
        </HydrationBoundary>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

/** What an RSC page does: fresh server client, prefetch, dehydrate. */
async function serverPrefetch(prefetch: (qc: QueryClient) => Promise<unknown>) {
  environmentManager.setIsServer(() => true);
  try {
    const qc = getQueryClient();
    expect(getQueryClient()).not.toBe(qc); // server: a new client per call
    await prefetch(qc);
    return dehydrate(qc);
  } finally {
    environmentManager.setIsServer(() => false);
  }
}

const recoverable: unknown[] = [];
let root: Root | undefined;
let container: HTMLElement;

/** Server-render the tree, then hydrate that markup with the real browser client. */
async function renderAndHydrate(state: DehydratedState, locale: string) {
  const serverClient = new QueryClient();
  const html = renderToString(<Tree client={serverClient} state={state} locale={locale} />);
  container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  await act(async () => {
    root = hydrateRoot(container, <Tree client={getQueryClient()} state={state} locale={locale} />, {
      onRecoverableError: (e) => recoverable.push(e),
    });
  });
  return html;
}

/** Flush effects and in-flight stub requests: wait until the query client is idle (bounded). */
const settle = () =>
  act(async () => {
    const qc = getQueryClient();
    for (let i = 0; i < 100 && (qc.isFetching() > 0 || i < 2); i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
  });
const requests = () => stub.graphqlRequests().map((r) => [r.operation, r.variables]);

beforeEach(() => {
  recoverable.length = 0;
  getQueryClient().clear();
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  container?.remove();
  getQueryClient().clear();
});

describe("server prefetch -> hydration", () => {
  it.each([
    ["en", "Contact Centre Outsourcing"],
    ["ar", "الاستعانة بمصادر خارجية لمراكز الاتصال"],
  ])("renders %s content on the server and hydrates without refetching", async (locale, title) => {
    const state = await serverPrefetch((qc) => prefetchServices(qc, locale as "en" | "ar"));
    expect(stub.graphqlRequests()).toHaveLength(1); // the prefetch itself

    const html = await renderAndHydrate(state, locale);
    expect(html).toContain(title); // present in the server markup, before any client JS
    expect(html).toContain('data-state="ready"');

    await settle();
    expect(container.textContent).toBe(title);
    expect(recoverable).toEqual([]); // no hydration mismatch
    expect(stub.graphqlRequests()).toHaveLength(1); // no refetch after hydration
    expect(requests()[0]).toEqual([
      "Services",
      expect.objectContaining({ language: locale === "ar" ? "AR" : "EN" }),
    ]);
  });

  it("does not reuse EN cache entries for an AR render (locale is part of the key)", async () => {
    const state = await serverPrefetch((qc) => prefetchServices(qc, "en"));

    const html = await renderAndHydrate(state, "ar");
    expect(html).toContain('data-state="loading"'); // nothing hydrated under the AR key
    expect(html).not.toContain("Contact Centre Outsourcing");

    await settle();
    expect(container.textContent).toMatch(/[؀-ۿ]/);
    expect(recoverable).toEqual([]);
    expect(requests().map(([, v]) => (v as { language: string }).language)).toEqual(["EN", "AR"]);
  });

  it("hydrates an empty CMS as the empty state, without refetching", async () => {
    stub.setScenario("empty");
    const state = await serverPrefetch((qc) => prefetchServices(qc, "en"));
    const html = await renderAndHydrate(state, "en");
    expect(html).toContain('data-state="empty"');
    await settle();
    expect(container.querySelector("[data-state]")?.getAttribute("data-state")).toBe("empty");
    expect(stub.graphqlRequests()).toHaveLength(1);
    expect(recoverable).toEqual([]);
  });

  it("dehydrates the query under the documented key", async () => {
    const state = await serverPrefetch((qc) => prefetchServices(qc, "ar"));
    expect(state.queries.map((q) => q.queryKey)).toEqual([wpKeys.services("ar")]);
  });
});

describe("failure and fallback", () => {
  it("[pinned] prefetchServices rejects when the CMS fails, so a page must catch it", async () => {
    stub.setScenario("graphql-error");
    await expect(serverPrefetch((qc) => prefetchServices(qc, "en"))).rejects.toThrow(/WPGraphQL error/);
  });

  it("a failed non-throwing prefetch is not dehydrated; the client recovers on its own", async () => {
    stub.setScenario("http-error");
    const state = await serverPrefetch((qc) =>
      qc.prefetchQuery({ queryKey: wpKeys.services("en"), queryFn: () => getServices("en") }),
    );
    expect(state.queries).toEqual([]);
    expect(stub.graphqlRequests()).toHaveLength(1);

    stub.setScenario("ok"); // CMS is back by the time the browser asks
    const html = await renderAndHydrate(state, "en");
    expect(html).toContain('data-state="loading"');
    await settle();
    expect(container.textContent).toBe("Contact Centre Outsourcing");
    expect(stub.graphqlRequests()).toHaveLength(2);
    expect(recoverable).toEqual([]);
  });

  it("shows the error fallback (no throw) when the browser fetch fails", async () => {
    stub.setScenario("graphql-error");
    const html = await renderAndHydrate({ mutations: [], queries: [] }, "en");
    expect(html).toContain('data-state="loading"');
    await settle();
    expect(container.querySelector("[data-state]")?.getAttribute("data-state")).toBe("error");
    expect(recoverable).toEqual([]);
  });

  it("malformed responses surface as the error fallback too", async () => {
    stub.setScenario("malformed-json");
    await renderAndHydrate({ mutations: [], queries: [] }, "ar");
    await settle();
    expect(container.querySelector("[data-state]")?.getAttribute("data-state")).toBe("error");
  });
});
