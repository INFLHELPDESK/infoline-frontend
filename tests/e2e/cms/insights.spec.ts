import { test, expect, waitForHydration } from "../support/fixtures";
import { dehydratedQueries, formatsSection, NON_CARD_FIELDS, payloadHasKey } from "../support/insights";
import { isCmsRequest, trackRequests } from "../support/cms";
import { rendersElementText } from "../support/html";
import { dirFor, locales, messages, type Locale } from "../support/messages";

/**
 * /[locale]/insights is the one route wired to WordPress. It runs against the
 * production build and the shared CMS stub (default `ok` scenario), so this
 * covers the real Next.js path: server prefetch, dehydrate, server-rendered
 * HTML, hydration. Failure and empty paths (which need a different stub
 * scenario per request) are covered in tests/unit/wp/insights-*.test.
 *
 * Server fetches go through the Next data cache (revalidate 300s), so these
 * tests never count CMS requests; they assert on what the page renders.
 */

const SEASONAL = { en: "How to staff a seasonal peak", ar: "كيف تُجهّز فريقك لموسم الذروة" };
const SLUG = { en: "seasonal-peak", ar: "seasonal-peak-ar" };

const sectionOf = (locale: Locale) => messages[locale].InsightsPage.formats.title;

for (const locale of locales) {
  test.describe(`/${locale}/insights (CMS)`, () => {
    test("server-rendered HTML already contains the CMS cards", async ({ request, baseURL }) => {
      const res = await request.get(`/${locale}/insights`);
      expect(res.status()).toBe(200);
      const html = await res.text();

      expect(html).toMatch(new RegExp(`<html[^>]*\\blang="${locale}"`));
      expect(html).toMatch(new RegExp(`<html[^>]*\\bdir="${dirFor(locale)}"`));
      expect(html).toContain('data-content-source="cms"');
      const cards = formatsSection(html);
      expect(cards).toContain(SEASONAL[locale]);
      // The blog detail route renders this CMS post, so the card links to it.
      expect(cards).toContain(`href="/${locale}/blog/${SLUG[locale]}"`);
      expect(cards).not.toContain("data-unlinked");
      // The static cards are replaced, not appended to.
      for (const item of messages[locale].Insights.items) expect(cards).not.toContain(item.title);
      // Everything else on the page is still the locale copy.
      expect(rendersElementText(html, sectionOf(locale))).toBe(true);

      // Hydration payload carries the teaser fields only, not whole CMS list items.
      const payload = dehydratedQueries(html);
      expect(payload).toContain(SEASONAL[locale]); // the card data is there
      expect(payload).toContain(`latest`); // under the bounded, locale-aware key
      for (const dropped of NON_CARD_FIELDS) {
        expect(payloadHasKey(payload, dropped), `payload must not carry ${dropped}`).toBe(false);
      }
      expect(payload.length).toBeLessThan(1_500);

      // SEO is unchanged: metadata still comes from locale copy, never the CMS.
      expect(html).toContain(`<link rel="canonical" href="${baseURL}/${locale}/insights"`);
      for (const l of locales) {
        expect(html).toContain(`hrefLang="${l}" href="${baseURL}/${l}/insights"`);
      }
      expect(html).toContain(`hrefLang="x-default" href="${baseURL}/en/insights"`);
      expect(html).toMatch(/<meta name="robots" content="index, follow"/);
      expect(html).not.toContain(SEASONAL[locale] + " — Infoline"); // no CMS-driven title
    });

    test("hydrates without errors, shows the CMS card and makes no browser CMS request", async ({
      page,
      consoleErrors,
      baseURL,
    }) => {
      const cmsRequests = trackRequests(page, isCmsRequest);
      const assets = trackRequests(page, (url) => url.includes("/_next/static/")); // listener control
      await page.goto(`/${locale}/insights`);
      await waitForHydration(page);

      const section = page.locator("section[data-content-source]");
      await expect(section).toHaveAttribute("data-content-source", "cms");
      await expect(section.getByRole("heading", { name: SEASONAL[locale] })).toBeVisible();
      await expect(section.getByRole("link", { name: new RegExp(SEASONAL[locale]) })).toHaveAttribute(
        "href",
        `/${locale}/blog/${SLUG[locale]}`,
      );
      await expect(section.locator("[data-unlinked]")).toHaveCount(0);

      // Hydration kept the server markup (no swap back to static or to loading).
      await page.waitForLoadState("networkidle");
      await expect(section).toHaveAttribute("data-content-source", "cms");
      expect(consoleErrors).toEqual([]);

      // No browser request to the CMS (the `blockedRequests` fixture also fails on one).
      expect(assets.length, "request listener is wired").toBeGreaterThan(0);
      expect(cmsRequests).toEqual([]);
      expect(page.url()).toBe(`${baseURL}/${locale}/insights`);

      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
      await expect(page.locator("main h1")).toHaveCount(1);
    });
  });
}

test.describe("Insights -> Blog detail navigation", () => {
  for (const locale of locales) {
    test(`/${locale}: the CMS card opens its CMS-backed article`, async ({ page }) => {
      await page.goto(`/${locale}/insights`);
      await waitForHydration(page);
      const card = page
        .locator("section[data-content-source]")
        .getByRole("link", { name: new RegExp(SEASONAL[locale]) });
      await card.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/blog/${SLUG[locale]}$`));
      await expect(page.locator("main h1")).toHaveText(SEASONAL[locale]);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
    });
  }
});

test.describe("only /insights is CMS-backed", () => {
  for (const locale of locales) {
    test(`/${locale} home and /${locale}/blog still render their static content`, async ({ request }) => {
      const home = await (await request.get(`/${locale}`)).text();
      const blog = await (await request.get(`/${locale}/blog`)).text();
      for (const html of [home, blog]) {
        expect(html).not.toContain("data-content-source");
        expect(html).not.toContain(SEASONAL[locale]);
      }
      expect(rendersElementText(blog, messages[locale].Blog.posts[0].title)).toBe(true);
    });
  }
});
