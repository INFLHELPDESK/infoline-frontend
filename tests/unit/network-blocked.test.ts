import { describe, expect, it, vi } from "vitest";

describe("unit-test network safety net (tests/unit/setup.ts)", () => {
  it("rejects an unstubbed fetch instead of reaching a real host", async () => {
    await expect(fetch("https://example.invalid/graphql")).rejects.toThrow(
      /must not use the network/,
    );
  });

  it("lets a test opt in explicitly by stubbing fetch", async () => {
    const stub = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", stub);
    await expect(fetch("http://127.0.0.1:1/x").then((r) => r.text())).resolves.toBe("ok");
    expect(stub).toHaveBeenCalledOnce();
  });
});
