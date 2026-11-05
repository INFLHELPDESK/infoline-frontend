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
    ["/ar/solutions", /تسع خدمات، نموذج تشغيل واحد/],
    ["/ar/solutions", /أسئلة يطرحها المشترون/],
    ["/ar/solutions", /ابنِ حلولاً موثوقة/],
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

// Follow-up: every remaining 36px heading was classified against its own Figma
// node. Black = heading/2xl/bold (800); Heavy = heading/2xl/semibold (600).
test.describe("Remaining section headings follow their own Figma style", () => {
  const black = [
    ["/en/about", /Accountability for outcomes/, "406:3364"],
    ["/en/about", /Building capability in Oman/, "406:3542"],
    ["/en/about", /^Leadership$/, "406:3556"],
    ["/en/about", /Want to know how we can support/, "406:3719"],
    ["/en/careers", /Capability built locally/, "406:4653"],
    ["/en/careers", /Learn customer operations/, "406:4611"],
    ["/en/careers", /Don't see your fit/, "406:4585"],
    ["/en/insights", /Three operations, three numbers/, "406:4909"],
    ["/en/insights", /Want the detail behind the result/, "406:4976"],
    ["/en/contact", /Talk to a trusted partner/, "406:5040"],
    ["/en/solutions", /Nine services, one operating model/, "406:2676"],
    ["/en/solutions", /Questions buyers usually ask/, "406:2805"],
    ["/en/solutions", /Named across the full catalogue/, "406:2840"],
    ["/en/solutions", /Build trusted solutions with Infoline/, "406:2795"],
  ] as const;
  const heavy = [
    ["/en/careers", /Roles we're hiring for now/, "406:4542"],
    ["/en/careers", /Service mindset, and the ability/, "406:4670"],
    ["/en/insights", /What results has Infoline delivered/, "406:4766"],
    ["/en/insights", /Four territories we write from/, "406:4808"],
    ["/en/insights", /Featured proof/, "406:4946"],
  ] as const;

  for (const [path, text, node] of black) {
    test(`Black 36/44 · ${node} · ${path}`, async ({ page }) => {
      await page.goto(path);
      await waitForHydration(page);
      const h = page.locator("main h1, main h2, main h3").filter({ hasText: text }).first();
      await h.scrollIntoViewIfNeeded();
      expect(await metrics(h)).toMatchObject({ size: "36px", weight: "800" });
      await expect(h).toHaveCSS("line-height", "44px");
    });
  }
  for (const [path, text, node] of heavy) {
    test(`Heavy 36/44 (kept at 600) · ${node} · ${path}`, async ({ page }) => {
      await page.goto(path);
      await waitForHydration(page);
      const h = page.locator("main h1, main h2, main h3").filter({ hasText: text }).first();
      await h.scrollIntoViewIfNeeded();
      expect(await metrics(h)).toMatchObject({ size: "36px", weight: "600" });
    });
  }
});
