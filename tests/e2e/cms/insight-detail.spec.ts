import { test, expect, waitForHydration } from "../support/fixtures";
import { INSIGHT_PATH, INSIGHT_TITLES } from "../support/insights";
import { isCmsRequest, trackRequests } from "../support/cms";
import { h1Text, robotsMeta } from "../support/html";
import { dirFor, locales, messages, type Locale } from "../support/messages";

/**
 * /[locale]/insights/[slug], the canonical detail route of the Insight content
 * model, against the production build and the shared CMS stub (default `ok`
 * scenario). Locale mismatch (Arabic record unpublished) and CMS failure need
 * their own cold server: see cms-scenarios.spec.ts.
 */

const OTHER: Record<Locale, Locale> = { en: "ar", ar: "en" };
const single = (locale: Locale) => messages[locale].Blog.page.single;

for (const locale of locales) {
  test.describe(`/${locale}/insights/[slug]`, () => {
    test("article: server HTML carries the CMS body, sanitized, with SEO from the CMS", async ({ request, baseURL }) => {
      const res = await request.get(`/${locale}${INSIGHT_PATH.lead}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      const title = INSIGHT_TITLES.lead[locale];

      expect(html).toMatch(new RegExp(String.raw`<html[^>]*\blang="${locale}"`));
      expect(html).toMatch(new RegExp(String.raw`<html[^>]*\bdir="${dirFor(locale)}"`));
      expect(h1Text(html)).toBe(title);
      expect(html).toContain('data-content-source="cms"');
      expect(html).toContain("Body."); // CMS-only text
      expect(html).toContain("What changed");

      // Links: internal stays in-tab (locale added once), external is hardened, hostile ones lose the link.
      const internal = locale === "ar" ? "/ar/services" : "/services";
      expect(html).toContain(`<a href="${internal}">our services</a>`);
      expect(html).toContain(
        '<a href="https://example.test/report" target="_blank" rel="noopener noreferrer">the report</a>',
      );
      expect(html).not.toContain("javascript:alert");
      expect(html).not.toContain("/ar/ar/");
      // Hostile markup from the CMS body never reaches the page.
      expect(html).not.toContain("__cmsXss");
      expect(html).not.toMatch(/onclick="x\(\)"/);
      expect(html).not.toMatch(/onerror="y\(\)"/);

      expect(html).toContain(`<title>${title} - Infoline</title>`);
      expect(robotsMeta(html)).toBe("index, follow");
      expect(html).toContain(`<link rel="canonical" href="${baseURL}/${locale}${INSIGHT_PATH.lead}"`);

      // Never the other language's record.
      expect(html).not.toContain(INSIGHT_TITLES.lead[OTHER[locale]]);
      // Reading time comes from the body.
      expect(html).toMatch(locale === "ar" ? /د/ : /min/);
    });

    test("article: hydrates cleanly, one h1, back to Blog, no browser CMS request", async ({
      page,
      consoleErrors,
      baseURL,
    }) => {
      const cmsRequests = trackRequests(page, isCmsRequest);
      const assets = trackRequests(page, (url) => url.includes("/_next/static/")); // listener control
      await page.goto(`/${locale}${INSIGHT_PATH.lead}`);
      await waitForHydration(page);

      await expect(page.locator("main h1")).toHaveText(INSIGHT_TITLES.lead[locale]);
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.getByRole("link", { name: single(locale).backLabel })).toHaveAttribute(
        "href",
        `/${locale}/blog`,
      );
      await page.waitForLoadState("networkidle");
      expect(consoleErrors).toEqual([]);
      expect(assets.length, "request listener is wired").toBeGreaterThan(0);
      expect(cmsRequests).toEqual([]);
      expect(page.url()).toBe(`${baseURL}/${locale}${INSIGHT_PATH.lead}`);
      await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
    });

    test("event: date, location and registration link; goes back to Insights", async ({ page }) => {
      await page.goto(`/${locale}${INSIGHT_PATH.event}`);
      await waitForHydration(page);
      await expect(page.locator("main h1")).toHaveText(INSIGHT_TITLES.event[locale]);

      const details = page.locator("[data-event-details]");
      await expect(details).toContainText("Example Convention Centre, Muscat");
      await expect(details).toContainText(locale === "ar" ? "نوفمبر 2026" : "Nov 2026");
      const register = details.getByRole("link", { name: single(locale).eventRegister });
      await expect(register).toHaveAttribute("href", "https://example.test/register");
      await expect(register).toHaveAttribute("rel", "noopener noreferrer");
      await expect(register).toHaveAttribute("target", "_blank");
      await expect(page.getByRole("link", { name: single(locale).backLabel })).toHaveAttribute(
        "href",
        `/${locale}/insights`,
      );
    });

    test("news: renders without event metadata", async ({ page }) => {
      await page.goto(`/${locale}${INSIGHT_PATH.news}`);
      await expect(page.locator("main h1")).toHaveText(INSIGHT_TITLES.news[locale]);
      await expect(page.locator("[data-event-details]")).toHaveCount(0);
      await expect(page.locator("main").first()).toHaveAttribute("data-insight-type", "news");
    });

    test("missing slug, junk slug and an incomplete record are the themed soft 404 (noindex)", async ({ request }) => {
      for (const path of [
        "/insights/does-not-exist",
        "/insights/a%20b",
        "/insights/..%2Fsecret",
        INSIGHT_PATH.minimal, // exists, but has no body and no excerpt
      ]) {
        const res = await request.get(`/${locale}${path}`);
        expect(res.status(), path).toBe(200);
        const html = await res.text();
        expect(h1Text(html), path).toBe(single(locale).notFoundTitle);
        expect(robotsMeta(html), path).toMatch(/^noindex/);
        expect(html).not.toContain('data-content-source="cms"');
      }
    });

    test("a card on /insights opens its detail page (no duplicated locale prefix)", async ({ page }) => {
      await page.goto(`/${locale}/insights`);
      await waitForHydration(page);
      const card = page
        .locator("section[data-content-source]")
        .getByRole("link", { name: new RegExp(INSIGHT_TITLES.lead[locale]) });
      await card.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}${INSIGHT_PATH.lead}$`));
      await expect(page.locator("main h1")).toHaveText(INSIGHT_TITLES.lead[locale]);
      expect(page.url()).not.toContain("/ar/ar");
    });

    test("an event card on /insights opens the event", async ({ page }) => {
      await page.goto(`/${locale}/insights`);
      await waitForHydration(page);
      await page
        .locator("section[data-content-source]")
        .getByRole("link", { name: new RegExp(INSIGHT_TITLES.event[locale]) })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${locale}${INSIGHT_PATH.event}$`));
      await expect(page.locator("[data-event-details]")).toBeVisible();
    });

    test("a card on /blog opens its detail page", async ({ page }) => {
      await page.goto(`/${locale}/blog`);
      await waitForHydration(page);
      await page.getByRole("link", { name: new RegExp(INSIGHT_TITLES.lead[locale]) }).first().click();
      await expect(page).toHaveURL(new RegExp(`/${locale}${INSIGHT_PATH.lead}$`));
      await expect(page.locator("main h1")).toHaveText(INSIGHT_TITLES.lead[locale]);
      expect(page.url()).not.toContain("/ar/ar");
    });
  });

  test.describe(`/${locale}/insights/[slug], mobile and reduced motion`, () => {
    test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

    test("no horizontal overflow and the article is visible immediately", async ({ page }) => {
      await page.goto(`/${locale}${INSIGHT_PATH.lead}`);
      await waitForHydration(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const opacity = await page.locator("main h1").evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe("1");
      await expect(page.locator("[data-cms-body]")).toBeVisible();
    });
  });
}

test("RTL: the Arabic article reads right-to-left and the back arrow is mirrored", async ({ page }) => {
  await page.goto(`/ar${INSIGHT_PATH.lead}`);
  await waitForHydration(page);
  for (const selector of ["main h1", "[data-cms-body]"]) {
    const direction = await page.locator(selector).first().evaluate((el) => getComputedStyle(el).direction);
    expect(direction, selector).toBe("rtl");
  }
  const back = page.getByRole("link", { name: messages.ar.Blog.page.single.backLabel });
  // Tailwind 4 `rtl:rotate-180` sets the individual `rotate` property.
  const rotate = await back.locator("svg").evaluate((el) => getComputedStyle(el).rotate);
  expect(rotate).toBe("180deg");
});
