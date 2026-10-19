import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { wpFetch, WP_REVALIDATE } from "@/lib/wp/client";

/**
 * Next's data cache stores any 2xx response, and WPGraphQL reports GraphQL
 * errors with HTTP 200, so an error body can sit in the cache as if it were
 * content. wpFetch must never return such a body as data, must recover as soon
 * as the CMS does, and must keep normal caching for successes. Fetch is a
 * recording stub here; the real cache behavior is covered by
 * tests/e2e/cms/cms-scenarios.spec.ts.
 */

const ok = { data: { clients: { nodes: [{ id: "1" }] } } };
const json = (body: unknown) => new Response(JSON.stringify(body));

type Call = { cache?: string; revalidate?: number };
let calls: Call[];

function respondWith(...responses: Array<() => Response | Promise<Response>>) {
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit & { next?: { revalidate?: number } }) => {
      calls.push({ cache: init?.cache, revalidate: init?.next?.revalidate });
      return responses[Math.min(i++, responses.length - 1)]();
    }),
  );
}

const run = (options = {}) =>
  wpFetch<typeof ok.data>("query Clients { clients { nodes { id } } }", {}, undefined, {
    roots: ["clients"],
    ...options,
  });

beforeEach(() => {
  calls = [];
  vi.stubEnv("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT", "http://127.0.0.1:3199/graphql");
  vi.stubEnv("CMS_ISOLATED", "1");
});
afterEach(() => vi.unstubAllGlobals());

describe("successful responses keep the data cache", () => {
  it("one cached request, no second ask", async () => {
    respondWith(() => json(ok));
    await expect(run()).resolves.toEqual(ok.data);
    expect(calls).toEqual([{ cache: "force-cache", revalidate: WP_REVALIDATE }]);
  });
});

describe("a 200 whose body is unusable is not served, and the CMS is asked again fresh", () => {
  it.each([
    ["GraphQL errors", () => json({ errors: [{ message: "boom" }], data: null })],
    ["partial errors", () => json({ data: ok.data, errors: [{ message: "partial" }] })],
    ["malformed JSON", () => new Response('{"data": {"clients": {"nodes": [')],
    ["no data", () => json({ data: null })],
    ["a missing root", () => json({ data: {} })],
  ])("%s -> recovers from the fresh request when the CMS is back", async (_name, bad) => {
    respondWith(bad, () => json(ok));
    await expect(run()).resolves.toEqual(ok.data);
    expect(calls).toEqual([
      { cache: "force-cache", revalidate: WP_REVALIDATE },
      { cache: "no-store", revalidate: undefined }, // bypasses (and never writes) the cache
    ]);
  });

  it("still fails with the fresh failure when the CMS is still broken", async () => {
    respondWith(() => json({ errors: [{ message: "first" }] }), () => json({ errors: [{ message: "second" }] }));
    await expect(run()).rejects.toMatchObject({ kind: "graphql", message: expect.stringContaining("second") });
    expect(calls).toHaveLength(2);
  });

  it("asks at most once more (no retry loop)", async () => {
    respondWith(() => json({ errors: [{ message: "x" }] }));
    await expect(run()).rejects.toMatchObject({ kind: "graphql" });
    expect(calls).toHaveLength(2);
  });

  it("the two asks share one timeout budget", async () => {
    const spy = vi.spyOn(AbortSignal, "timeout");
    respondWith(() => json({ errors: [{ message: "x" }] }));
    await expect(run({ timeoutMs: 5_000 })).rejects.toBeDefined();
    const [first, second] = spy.mock.calls.map(([ms]) => ms);
    expect(first).toBe(5_000);
    expect(second).toBeLessThanOrEqual(5_000);
  });
});

describe("failures Next never caches are not asked twice", () => {
  it.each([
    ["an HTTP error", () => new Response("no", { status: 500 }), "http"],
    ["a network failure", () => Promise.reject(new TypeError("fetch failed")), "network"],
  ])("%s costs one request", async (_name, fail, kind) => {
    respondWith(fail as () => Response);
    await expect(run()).rejects.toMatchObject({ kind });
    expect(calls).toHaveLength(1);
  });

  it("a timeout costs one request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            calls.push({});
            init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
          }),
      ),
    );
    await expect(run({ timeoutMs: 50 })).rejects.toMatchObject({ kind: "timeout" });
    expect(calls).toHaveLength(1);
  });

  it("a caller's cancellation is not retried", async () => {
    const controller = new AbortController();
    respondWith(() => {
      controller.abort(new DOMException("stop", "AbortError"));
      return json({ errors: [{ message: "x" }] });
    });
    await expect(run({ signal: controller.signal })).rejects.toBeDefined();
    expect(calls).toHaveLength(1);
  });
});

describe("the browser has no data cache and never re-asks", () => {
  it("one plain request, no cache options", async () => {
    vi.stubGlobal("window", {});
    respondWith(() => json({ errors: [{ message: "x" }] }));
    await expect(run()).rejects.toMatchObject({ kind: "graphql" });
    expect(calls).toEqual([{ cache: undefined, revalidate: undefined }]);
  });
});
