import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({ headers: headersMock }));

type SiteModule = typeof import("@/lib/site");

/** Fresh module per test: SITE_URL is resolved from env at import time. */
async function loadSite(env: Record<string, string | undefined> = {}): Promise<SiteModule> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", env.NEXT_PUBLIC_SITE_URL);
  vi.stubEnv("VERCEL_URL", env.VERCEL_URL);
  return import("@/lib/site");
}

function requestHeaders(values: Record<string, string>) {
  headersMock.mockResolvedValue(new Headers(values));
}

describe("localeAlternates", () => {
  beforeEach(() => {
    headersMock.mockReset();
  });

  it("builds canonical + hreflang for every locale from the request host", async () => {
    const { localeAlternates } = await loadSite();
    requestHeaders({ host: "localhost:3000" });

    await expect(localeAlternates("ar", "/about")).resolves.toEqual({
      canonical: "http://localhost:3000/ar/about",
      languages: {
        en: "http://localhost:3000/en/about",
        ar: "http://localhost:3000/ar/about",
        "x-default": "http://localhost:3000/en/about",
      },
    });
  });

  it("uses the locale root for the homepage (empty path)", async () => {
    const { localeAlternates } = await loadSite();
    requestHeaders({ host: "127.0.0.1:3100" });

    const result = await localeAlternates("en");

    expect(result.canonical).toBe("http://127.0.0.1:3100/en");
    expect(result.languages["x-default"]).toBe("http://127.0.0.1:3100/en");
  });

  it("adds a leading slash to bare paths", async () => {
    const { localeAlternates } = await loadSite();
    requestHeaders({ host: "localhost:3000" });

    const result = await localeAlternates("en", "contact");

    expect(result.canonical).toBe("http://localhost:3000/en/contact");
  });

  it("prefers x-forwarded-host/proto and defaults non-local hosts to https", async () => {
    const { localeAlternates } = await loadSite();
    requestHeaders({ host: "internal:8080", "x-forwarded-host": "preview.example.com" });

    const forwarded = await localeAlternates("en", "/blog");
    expect(forwarded.canonical).toBe("https://preview.example.com/en/blog");

    requestHeaders({
      host: "internal:8080",
      "x-forwarded-host": "preview.example.com",
      "x-forwarded-proto": "http",
    });
    const explicitProto = await localeAlternates("en", "/blog");
    expect(explicitProto.canonical).toBe("http://preview.example.com/en/blog");
  });

  it.each<[string, Record<string, string | undefined>, string]>([
    ["the production default", {}, "https://infoline.om"],
    ["VERCEL_URL", { VERCEL_URL: "infoline-git-x.vercel.app" }, "https://infoline-git-x.vercel.app"],
    [
      "NEXT_PUBLIC_SITE_URL over VERCEL_URL",
      { NEXT_PUBLIC_SITE_URL: "https://staging.infoline.om", VERCEL_URL: "ignored.vercel.app" },
      "https://staging.infoline.om",
    ],
  ])("falls back to %s when no request is in scope", async (_label, env, origin) => {
    const { localeAlternates } = await loadSite(env);
    headersMock.mockRejectedValue(new Error("headers() called outside a request scope"));

    const result = await localeAlternates("en", "/about");

    expect(result.canonical).toBe(`${origin}/en/about`);
  });

  it("falls back to SITE_URL when the request carries no host", async () => {
    const { localeAlternates } = await loadSite();
    requestHeaders({});

    const result = await localeAlternates("ar");

    expect(result.canonical).toBe("https://infoline.om/ar");
  });
});
