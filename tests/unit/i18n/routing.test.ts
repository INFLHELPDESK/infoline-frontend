import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const middleware = createMiddleware(routing);

function run(path: string, headers: Record<string, string> = {}) {
  return middleware(new NextRequest(`http://localhost:3000${path}`, { headers }));
}

/** Redirect target path, or null when the request is served as-is. */
function redirectPath(res: Response): string | null {
  const location = res.headers.get("location");
  return location ? new URL(location).pathname : null;
}

describe("default locale routing", () => {
  it("defaults to English", () => {
    expect(routing.defaultLocale).toBe("en");
  });

  it("redirects / to /en with no Accept-Language", () => {
    expect(redirectPath(run("/"))).toBe("/en");
  });

  it("redirects / to /en even when the browser prefers Arabic", () => {
    const res = run("/", { "accept-language": "ar-OM,ar;q=0.9,en;q=0.8" });
    expect(redirectPath(res)).toBe("/en");
  });

  it("redirects / to /en even with an NEXT_LOCALE=ar cookie", () => {
    const res = run("/", { cookie: "NEXT_LOCALE=ar", "accept-language": "ar" });
    expect(redirectPath(res)).toBe("/en");
  });

  it("serves /en and /ar explicitly without redirecting", () => {
    expect(redirectPath(run("/en"))).toBeNull();
    expect(redirectPath(run("/ar"))).toBeNull();
    expect(run("/ar").headers.get("x-middleware-request-x-next-intl-locale")).toBe("ar");
    expect(run("/en").headers.get("x-middleware-request-x-next-intl-locale")).toBe("en");
  });

  it("keeps an explicit locale on nested pages, so switching language works", () => {
    for (const path of ["/en/about", "/ar/about", "/ar/blog/copc-audit"]) {
      expect(redirectPath(run(path, { cookie: "NEXT_LOCALE=en" }))).toBeNull();
    }
  });

  it("still emits hreflang alternates for a nested page", () => {
    const link = run("/en/about").headers.get("link") ?? "";
    expect(link).toContain('hreflang="en"');
    expect(link).toContain('hreflang="ar"');
    expect(link).toContain('hreflang="x-default"');
  });
});
