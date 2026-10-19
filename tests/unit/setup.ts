import { beforeEach } from "vitest";

/**
 * Safety net: unit tests must never touch the network. Any test that needs
 * `fetch` stubs it explicitly (`vi.stubGlobal("fetch", …)`); an unstubbed call
 * fails loudly instead of reaching a real host. Reinstalled before every test
 * because `unstubGlobals` restores the original global afterwards.
 */
function blockedFetch(input: unknown): Promise<Response> {
  const target = typeof input === "string" ? input : String((input as { url?: string })?.url ?? input);
  return Promise.reject(new Error(`Unit tests must not use the network (fetch ${target})`));
}

beforeEach(() => {
  globalThis.fetch = blockedFetch as typeof fetch;
});
