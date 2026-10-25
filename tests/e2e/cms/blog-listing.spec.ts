import { test, expect, waitForHydration } from "../support/fixtures";
import { INSIGHT_PATH, INSIGHT_TITLES } from "../support/insights";
import { isCmsRequest, trackRequests } from "../support/cms";
import { h1Text, rendersElementText } from "../support/html";
import { dirFor, locales, messages, type Locale } from "../support/messages";

/**
 * /[locale]/blog is the `article` view of the Insights content model, read from
 * the term side. Production build + shared CMS stub (default `ok` scenario: two
 * articles per language, one flagged featured, plus an event and a news item
 * that must not appear). Empty, unpublished-Arabic, failing and multi-page
 * scenarios need a cold server each and live in cms-scenarios.spec.ts.
 *
 * Article cards link to the authoritative CMS URI (/insights/<slug>); that
 * detail route is a later phase, so only the links are asserted here.
 */

for (const locale of locales) {
  const other: Locale = locale === "en" ? "ar" : "en";
  const page = messages[locale].Blog.page;

  test.describe(`/${locale}/blog (CMS articles)`, () => {
    test("server HTML lists only this language's articles, with the flagged one featured", async ({ request, baseURL }) => {
      const res = await request.get(`/${locale}/blog`);
      expect(res.status()).toBe(200);
      const html = await res.text();

      expect(html).toMatch(new RegExp(`<html[^>]*\\blang="${locale}"`));
      expect(html).toMatch(new RegExp(`<html[^>]*\\bdir="${dirFor(locale)}"`));
      expect(html).toContain('data-content-source="cms"');

      for (const key of ["lead", "minimal"] as const) {
        expect(rendersElementText(html, INSIGHT_TITLES[key][locale]), key).toBe(true);
        expect(html).toContain(`href="/${locale}${INSIGHT_PATH[key]}"`);
        expect(html).not.toContain(INSIGHT_TITLES[key][other]);
      }
      // Events and news are Insights too, but not articles.
      for (const key of ["event", "news"] as const) {
        expect(html).not.toContain(INSIGHT_TITLES[key][locale]);
        expect(html).not.toContain(`href="/${locale}${INSIGHT_PATH[key]}"`);
      }
      // Not the static posts, not the old /blog/<slug> destinations.
      for (const post of messages[locale].Blog.posts) {
        expect(rendersElementText(html, post.title), post.slug).toBe(false);
        expect(html).not.toContain(`href="/${locale}/blog/${post.slug}"`);
      }
      expect(html).not.toContain("/ar/ar/");
      expect(rendersElementText(html, page.featuredLabel)).toBe(true);

      // SEO is unchanged: metadata comes from locale copy.
      expect(html).toContain(`<link rel="canonical" href="${baseURL}/${locale}/blog"`);
      expect(html).toMatch(/<meta name="robots" content="index, follow"/);
    });

    test("hydrates cleanly: featured card, grid in newest-first order, no browser CMS request", async ({
      page: browser,
      consoleErrors,
    }) => {
      const cmsRequests = trackRequests(browser, isCmsRequest);
      const assets = trackRequests(browser, (url) => url.includes("/_next/static/"));
      await browser.goto(`/${locale}/blog`);
      await waitForHydration(browser);

      const main = browser.locator("main");
      await expect(main).toHaveAttribute("data-content-source", "cms");
      // Featured: the CMS-flagged article.
      await expect(main.getByRole("heading", { level: 2, name: INSIGHT_TITLES.lead[locale] })).toBeVisible();
      await expect(main.getByRole("link", { name: new RegExp(INSIGHT_TITLES.lead[locale]) }).first()).toHaveAttribute(
        "href",
        `/${locale}${INSIGHT_PATH.lead}`,
      );
      // Grid: articles only, newest first.
      await expect(main.getByRole("heading", { level: 3 })).toHaveText([
        INSIGHT_TITLES.lead[locale],
        INSIGHT_TITLES.minimal[locale],
      ]);
      await expect(main.getByRole("link", { name: new RegExp(INSIGHT_TITLES.minimal[locale]) })).toHaveAttribute(
        "href",
        `/${locale}${INSIGHT_PATH.minimal}`,
      );
      // Every CMS item is an article: no type chips, nothing to load.
      await expect(main.getByRole("button")).toHaveCount(0);
      await expect(main.locator("[data-empty]")).toHaveCount(0);

      await browser.waitForLoadState("networkidle");
      expect(consoleErrors).toEqual([]);
      expect(assets.length, "request listener is wired").toBeGreaterThan(0);
      expect(cmsRequests).toEqual([]);
      await expect(browser.locator("main h1")).toHaveCount(1);
    });

    test("desktop RTL/LTR: the grid starts at the reading edge", async ({ page: browser }) => {
      await browser.goto(`/${locale}/blog`);
      await waitForHydration(browser);
      const cards = browser.locator("main h3");
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();
      expect(first && second).toBeTruthy();
      if (locale === "ar") expect(first!.x).toBeGreaterThan(second!.x);
      else expect(first!.x).toBeLessThan(second!.x);
    });
  });

  test.describe(`/${locale}/blog (CMS articles), mobile and reduced motion`, () => {
    test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

    test("no horizontal overflow; featured and cards are visible without animation", async ({ page: browser }) => {
      await browser.goto(`/${locale}/blog`);
      await waitForHydration(browser);
      const overflow = await browser.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const grid = browser.locator("main h3");
      await expect(grid.first()).toBeVisible();
      const boxes = [await grid.nth(0).boundingBox(), await grid.nth(1).boundingBox()];
      expect(boxes[1]!.y).toBeGreaterThan(boxes[0]!.y);
      expect(await grid.first().evaluate((el) => getComputedStyle(el.closest("a") ?? el).opacity)).toBe("1");
    });
  });
}

test.describe("existing blog routes are untouched", () => {
  for (const locale of locales) {
    test(`/${locale}/blog/<static slug> still renders the static post`, async ({ request }) => {
      const post = messages[locale].Blog.posts[0];
      const res = await request.get(`/${locale}/blog/${post.slug}`);
      expect(res.status()).toBe(200);
      expect(h1Text(await res.text())).toBe(post.title);
    });
  }
});
