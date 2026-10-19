import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { createCmsStub } from "./server.mjs";

// Captured at import, before tests/unit/setup.ts swaps in the blocking fetch
// (that happens in a beforeEach, i.e. after every import has run).
const realFetch = globalThis.fetch;

export type CmsStub = Awaited<ReturnType<typeof createCmsStub>>;

/**
 * A fetch that only reaches the given stub origin. Anything else rejects, so
 * a contract test cannot talk to a real host even if env is misconfigured.
 */
export function loopbackOnlyFetch(origin: string): typeof fetch {
  return ((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const target = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (new URL(target).origin !== origin) {
      return Promise.reject(
        new Error(`Contract tests may only reach the CMS stub (${origin}); got ${target}`),
      );
    }
    return realFetch(input, init);
  }) as typeof fetch;
}

/**
 * Starts a CMS stub on an ephemeral loopback port for the file, points the
 * endpoint env at it, and gives each test a clean request log with the real
 * (loopback-only) fetch installed. Returns the live stub.
 */
export function startCmsStub(): CmsStub {
  const holder: { stub?: CmsStub } = {};
  const stub = new Proxy({} as CmsStub, {
    get: (_target, key) => Reflect.get(holder.stub as CmsStub, key),
  });

  beforeAll(async () => {
    holder.stub = await createCmsStub();
  });
  afterAll(async () => {
    await holder.stub?.close();
  });
  beforeEach(() => {
    holder.stub!.reset();
    vi.stubEnv("CMS_ISOLATED", "1");
    vi.stubEnv("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT", holder.stub!.url);
    vi.stubGlobal("fetch", loopbackOnlyFetch(holder.stub!.origin));
  });

  return stub;
}
