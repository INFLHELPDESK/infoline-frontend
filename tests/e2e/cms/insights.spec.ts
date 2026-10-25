import { test, expect, waitForHydration } from "../support/fixtures";
import { formatsSection, INSIGHT_PATH, INSIGHT_TITLES } from "../support/insights";
import { isCmsRequest, trackRequests } from "../support/cms";
import { rendersElementText } from "../support/html";
import { dirFor, locales, messages, type Locale } from "../support/messages";

/**
 * /[locale]/insights lists the Insight content model (article, event and news
 * together) from WordPress. It runs against the production build and the shared
 * CMS stub (default `ok` scenario): server fetch, server-rendered HTML,
 * hydration. Other stub scenarios (empty, unpublished Arabic, failures) are
 * covered in cms-scenarios.spec.ts, which needs a cold server per scenario.
 *
 * Cards link to the authoritative CMS URI (/insights/<slug>); opening them is
 * covered in insight-detail.spec.ts.
 */

const sectionOf = (locale: Locale) => messages[locale].InsightsPage.formats.title;
const SHOWN = ["lead", "event", "news"] as const; // the three newest, one of each type

for (const locale of locales) {
  const labels = Object.fromEntries(
    messages[locale].Blog.page.filters.map((f) => [f.id, f.label]),
  );

  test.describe(`/${locale}/insights (CMS)`, () => {
    test("server-rendered HTML already contains the CMS Insights of every type", async ({ request, baseURL }) => {
      const res = await request.get(`/${locale}/insights`);
      expect(res.status()).toBe(200);
      const html = await res.text();

      expect(html).toMatch(new RegExp(`<html[^>]*\\blang="${locale}"`));
      expect(html).toMatch(new RegExp(`<html[^>]*\\bdir="${dirFor(locale)}"`));
      expect(html).toContain('data-content-source="cms"');
      const cards = formatsSection(html);

      // Articles, events and news together, newest first.
      const positions = SHOWN.map((key) => cards.indexOf(INSIGHT_TITLES[key][locale]));
      expect(positions.every((p) => p >= 0)).toBe(true);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
      expect(cards).not.toContain(INSIGHT_TITLES.minimal[locale]); // beyond the three cards shown

      // Authoritative CMS URIs, with the locale prefix added once (never /ar/ar).
      for (const key of SHOWN) {
        expect(cards).toContain(`href="/${locale}${INSIGHT_PATH[key]}"`);
      }
      expect(cards).not.toContain("/ar/ar/");
      expect(cards).not.toContain("data-unlinked");
      expect(cards).not.toContain("/blog/");

      // Localized type labels (the CMS terms are English-only).
      for (const id of ["articles", "events", "news"]) {
        expect(rendersElementText(cards, labels[id]), id).toBe(true);
      }

      // Never another language, never the static items.
      const other: Locale = locale === "en" ? "ar" : "en";
      for (const key of SHOWN) expect(cards).not.toContain(INSIGHT_TITLES[key][other]);
      for (const item of messages[locale].Insights.items) expect(cards).not.toContain(item.title);
      // Everything else on the page is still the locale copy.
      expect(rendersElementText(html, sectionOf(locale))).toBe(true);

      // SEO is unchanged: metadata still comes from locale copy, never the CMS.
      expect(html).toContain(`<link rel="canonical" href="${baseURL}/${locale}/insights"`);
      for (const l of locales) {
        expect(html).toContain(`hrefLang="${l}" href="${baseURL}/${l}/insights"`);
      }
      expect(html).toContain(`hrefLang="x-default" href="${baseURL}/en/insights"`);
      expect(html).toMatch(/<meta name="robots" content="index, follow"/);
    });

    test("hydrates without errors, keeps the CMS cards and makes no browser CMS request", async ({
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
      const headings = section.getByRole("heading", { level: 3 });
      await expect(headings).toHaveText(SHOWN.map((key) => INSIGHT_TITLES[key][locale]));
      for (const key of SHOWN) {
        await expect(
          section.getByRole("link", { name: new RegExp(INSIGHT_TITLES[key][locale]) }),
        ).toHaveAttribute("href", `/${locale}${INSIGHT_PATH[key]}`);
      }
      await expect(section.locator("[data-unlinked], [data-empty]")).toHaveCount(0);

      // Date and Read more come from the CMS item; reading time needs the body, which the list lacks.
      const lead = section.getByRole("link", { name: new RegExp(INSIGHT_TITLES.lead[locale]) });
      await expect(lead).toContainText(locale === "ar" ? "أكتوبر" : "Oct 2026");
      await expect(lead).toContainText(messages[locale].Blog.page.readMore);
      await expect(lead).not.toContainText(/\d\s?(min|د)(\s|$)/);

      await page.waitForLoadState("networkidle");
      await expect(section).toHaveAttribute("data-content-source", "cms");
      expect(consoleErrors).toEqual([]);

      expect(assets.length, "request listener is wired").toBeGreaterThan(0);
      expect(cmsRequests).toEqual([]);
      expect(page.url()).toBe(`${baseURL}/${locale}/insights`);

      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
      await expect(page.locator("main h1")).toHaveCount(1);
    });

    test("desktop: cards start at the reading edge (RTL mirrors LTR)", async ({ page }) => {
      await page.goto(`/${locale}/insights`);
      await waitForHydration(page);
      const cards = page.locator("section[data-content-source] h3");
      const first = await cards.nth(0).boundingBox();
      const last = await cards.nth(2).boundingBox();
      expect(first && last).toBeTruthy();
      if (locale === "ar") expect(first!.x).toBeGreaterThan(last!.x);
      else expect(first!.x).toBeLessThan(last!.x);
    });
  });

  test.describe(`/${locale}/insights (CMS), mobile and reduced motion`, () => {
    test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

    test("no horizontal overflow, cards stack and are visible immediately", async ({ page }) => {
      await page.goto(`/${locale}/insights`);
      await waitForHydration(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);

      const headings = page.locator("section[data-content-source] h3");
      const boxes = [await headings.nth(0).boundingBox(), await headings.nth(1).boundingBox()];
      expect(boxes[1]!.y).toBeGreaterThan(boxes[0]!.y); // stacked
      // Reduced motion: nothing waits on an entrance animation to appear.
      const opacity = await headings
        .first()
        .evaluate((el) => getComputedStyle(el.closest("a") ?? el).opacity);
      expect(opacity).toBe("1");
    });
  });
}

test.describe("only /insights and /blog are CMS-backed Insight views", () => {
  for (const locale of locales) {
    test(`/${locale} home still renders its static content`, async ({ request }) => {
      const home = await (await request.get(`/${locale}`)).text();
      expect(home).not.toContain("data-content-source");
      // (The home page's own static copy may reuse the lead title's words; events and news never appear.)
      for (const key of ["event", "news"] as const) {
        expect(home).not.toContain(INSIGHT_TITLES[key][locale]);
      }
    });
  }
});
