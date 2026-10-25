import { test, expect, waitForHydration } from "../support/fixtures";
import { INSIGHT_PATH } from "../support/insights";

/**
 * Article routing, canonical/hreflang, sitemap and language switching for CMS
 * Insights, against the production build and the shared CMS stub. In the stub
 * only `lead-article` is translated (both records link to each other); every
 * other Insight exists per language with no translation set.
 */

const hreflang = (html: string, lang: string) =>
  new RegExp(String.raw`<link[^>]*hreflang="${lang}"[^>]*href="([^"]+)"|<link[^>]*href="([^"]+)"[^>]*hreflang="${lang}"`, "i").exec(
    html,
  );
const alternateUrl = (html: string, lang: string) => {
  const m = hreflang(html, lang);
  return m ? (m[1] ?? m[2]) : null;
};

test.describe("hreflang on article detail", () => {
  test("a translated article lists both languages reciprocally, EN is x-default", async ({ request, baseURL }) => {
    const en = await (await request.get(`/en${INSIGHT_PATH.lead}`)).text();
    const ar = await (await request.get(`/ar${INSIGHT_PATH.lead}`)).text();
    for (const html of [en, ar]) {
      expect(alternateUrl(html, "en")).toBe(`${baseURL}/en${INSIGHT_PATH.lead}`);
      expect(alternateUrl(html, "ar")).toBe(`${baseURL}/ar${INSIGHT_PATH.lead}`);
      expect(alternateUrl(html, "x-default")).toBe(`${baseURL}/en${INSIGHT_PATH.lead}`);
      expect(html).not.toContain("/ar/ar/");
      expect(html).not.toContain("/en/en/");
    }
    expect(en).toContain(`rel="canonical" href="${baseURL}/en${INSIGHT_PATH.lead}"`);
    expect(ar).toContain(`rel="canonical" href="${baseURL}/ar${INSIGHT_PATH.lead}"`);
  });

  test("an untranslated article only lists itself; Arabic never claims English or x-default", async ({
    request,
    baseURL,
  }) => {
    const en = await (await request.get(`/en${INSIGHT_PATH.news}`)).text();
    expect(alternateUrl(en, "en")).toBe(`${baseURL}/en${INSIGHT_PATH.news}`);
    expect(alternateUrl(en, "ar")).toBeNull();
    expect(alternateUrl(en, "x-default")).toBe(`${baseURL}/en${INSIGHT_PATH.news}`);

    const ar = await (await request.get(`/ar${INSIGHT_PATH.news}`)).text();
    expect(alternateUrl(ar, "ar")).toBe(`${baseURL}/ar${INSIGHT_PATH.news}`);
    expect(alternateUrl(ar, "en")).toBeNull();
    expect(alternateUrl(ar, "x-default")).toBeNull();
  });
});

test.describe("legacy /blog/[slug] redirects", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`${locale}: a slug that is a published Insight redirects once, without a doubled prefix`, async ({
      request,
    }) => {
      const res = await request.get(`/${locale}/blog/lead-article`, { maxRedirects: 0 });
      expect([307, 308]).toContain(res.status());
      expect(new URL(res.headers()["location"], "http://x").pathname).toBe(`/${locale}${INSIGHT_PATH.lead}`);

      // The target renders; it does not bounce back to /blog (no loop).
      const target = await request.get(`/${locale}${INSIGHT_PATH.lead}`, { maxRedirects: 0 });
      expect(target.status()).toBe(200);
    });

    test(`${locale}: an unknown slug is not redirected`, async ({ request }) => {
      const res = await request.get(`/${locale}/blog/definitely-not-a-post`, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
    });
  }

  test("a static legacy post keeps its URL", async ({ request }) => {
    const { messages } = await import("../support/messages");
    const slug = messages.en.Blog.posts[0].slug;
    const res = await request.get(`/en/blog/${slug}`, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });
});

test("sitemap adds published Insight articles per locale on the frontend origin, once each", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(new Set(locs).size).toBe(locs.length);
  for (const l of ["en", "ar"]) expect(locs.some((u) => u.endsWith(`/${l}${INSIGHT_PATH.lead}`))).toBe(true);
  expect(locs.some((u) => u.endsWith(`/en${INSIGHT_PATH.news}`))).toBe(true);
  // Static routes are preserved.
  expect(locs.some((u) => u.endsWith("/en/about"))).toBe(true);
  expect(locs.some((u) => u.endsWith("/en/blog"))).toBe(true);
  // Only the frontend origin, never the CMS host; no doubled prefix.
  const origins = new Set(locs.map((u) => new URL(u).origin));
  expect(origins.size).toBe(1);
  expect(xml).not.toContain("/ar/ar/");
  // Mutual pair: EN lead lists AR; the untranslated news article lists no AR.
  expect(xml).toMatch(new RegExp(String.raw`hreflang="ar"[^>]*href="[^"]*/ar${INSIGHT_PATH.lead}"`));
  expect(xml).not.toMatch(new RegExp(String.raw`hreflang="ar"[^>]*href="[^"]*/ar${INSIGHT_PATH.news}"[^>]*/>\s*<xhtml:link[^>]*x-default`));
});

test.describe("language switcher on article detail", () => {
  const switcher = (page: import("@playwright/test").Page) =>
    page.locator("header").getByRole("group", { name: /Language|اللغة/ }).first();

  test("EN -> AR -> EN uses the CMS translated URI", async ({ page }) => {
    await page.goto(`/en${INSIGHT_PATH.lead}`);
    await waitForHydration(page, "header");
    await switcher(page).getByRole("button", { name: "العربية" }).click();
    await expect(page).toHaveURL(new RegExp(`/ar${INSIGHT_PATH.lead}$`));
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await waitForHydration(page, "header");
    await switcher(page).getByRole("button", { name: "English" }).click();
    await expect(page).toHaveURL(new RegExp(`/en${INSIGHT_PATH.lead}$`));
  });

  test("an article without a translation disables the other language", async ({ page }) => {
    await page.goto(`/en${INSIGHT_PATH.news}`);
    await waitForHydration(page, "header");
    await expect(switcher(page).getByRole("button", { name: "العربية" })).toBeDisabled();
    await expect(switcher(page).getByRole("button", { name: "English" })).toBeEnabled();
  });

  test("non-article pages keep the same-path behaviour", async ({ page }) => {
    await page.goto("/en/about");
    await waitForHydration(page, "header");
    await switcher(page).getByRole("button", { name: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/about$/);
  });
});
