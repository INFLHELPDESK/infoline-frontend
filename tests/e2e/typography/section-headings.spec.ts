import { test, expect, waitForHydration } from "../support/fixtures";

/**
 * Designer review 2026-11-05, findings #1, #4 and #5.
 * Figma heading/2xl/bold = Avenir Black 36/44 (406:3207, 406:3267, 406:3338,
 * 406:3559); Avenir Black is CSS 800. Arabic 36px headings share one weight
 * (Tajawal 800) and Tajawal 900 is registered. Tajawal has no 600 at all.
 */
test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 1080 } });

const heading = (page: import("@playwright/test").Page, text: RegExp) =>
  page.locator("main h2, main h3").filter({ hasText: text }).first();
const metrics = (l: import("@playwright/test").Locator) =>
  l.evaluate((e) => {
    const s = getComputedStyle(e);
    return { size: s.fontSize, weight: s.fontWeight, family: s.fontFamily.split(",")[0].replace(/"/g, "") };
  });

test.describe("English section headings (Figma Black 36/44)", () => {
  for (const [path, text] of [
    ["/en/industries", /How does CX differ by industry/],
    ["/en/industries", /Questions buyers usually ask/],
    ["/en/industries", /Named across the full catalogue/],
    ["/en/about", /To make customer and business operations/],
  ] as const) {
    test(`${path}: ${text.source}`, async ({ page }) => {
      await page.goto(path);
      await waitForHydration(page);
      const h = heading(page, text);
      await h.scrollIntoViewIfNeeded();
      expect(await metrics(h)).toMatchObject({ size: "36px", weight: "800" });
      await expect(h).toHaveCSS("line-height", "44px");
    });
  }
});

test.describe("Arabic 36px headings share Tajawal 800", () => {
  for (const [path, text] of [
    ["/ar", /وزارات سلطنة عُمان/],
    ["/ar", /إذا كنت تفكر بالقطاعات/],
    ["/ar", /العملاء يشترون خدمتنا/],
    ["/ar/industries", /ست مجموعات قطاعية/],
    ["/ar/industries", /كيف تختلف تجربة العميل/],
    ["/ar/about", /أن نجعل عمليات العملاء/],
    ["/ar/case-studies", /مؤشر لم يتحرك/],
  ] as const) {
    test(`${path}: ${text.source}`, async ({ page }) => {
      await page.goto(path);
      await waitForHydration(page);
      const h = heading(page, text);
      await h.scrollIntoViewIfNeeded();
      expect(await metrics(h)).toMatchObject({ size: "36px", weight: "800", family: expect.stringContaining("Tajawal") });
    });
  }

  test("Tajawal 900 is registered and loads; 600 does not exist in the family", async ({ page }) => {
    await page.goto("/ar");
    await waitForHydration(page);
    await page.evaluate(() => document.fonts.load('900 16px Tajawal', "ع"));
    const weights = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter((f) => /tajawal/i.test(f.family)).map((f) => f.weight);
    });
    for (const w of ["400", "500", "700", "800", "900"]) expect(weights).toContain(w);
    expect(weights).not.toContain("600");
  });
});
