import { test, expect, waitForHydration } from "../support/fixtures";
import { messages, dirFor } from "../support/messages";

/**
 * About › "Built on trust" — eyebrow copy, heading wrap and the four statement
 * pills (one row on desktop, wrapping without overflow below that).
 */
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

for (const locale of ["en", "ar"] as const) {
  const copy = messages[locale].AboutPage.accountability;

  for (const vp of viewports) {
    test(`${locale} / ${vp.name}: Built on trust composition, no overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/${locale}/about`);
      await waitForHydration(page);
      expect(await page.evaluate(() => document.documentElement.dir)).toBe(dirFor(locale));

      const h2 = page.getByRole("heading", { level: 2, name: copy.title });
      await h2.scrollIntoViewIfNeeded();
      await expect(h2).toBeVisible();
      const section = page.locator("section", { has: h2 });
      await expect(section.getByText(copy.eyebrow, { exact: true })).toBeVisible();
      if (locale === "en") expect(copy.eyebrow).toBe("Built on trust");

      const chips = section.locator("ul > li");
      await expect(chips).toHaveCount(copy.points.length);
      const boxes = await chips.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect(); // offsetTop ignores the stagger transform
          return { top: (el as HTMLElement).offsetTop, left: r.left, right: r.right };
        }),
      );
      if (vp.name === "desktop") {
        expect(new Set(boxes.map((b) => b.top)).size).toBe(1);
        if (locale === "en") {
          const lines = await h2.evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
          expect(lines).toBe(2);
        }
      }
      for (const b of boxes) {
        expect(b.left).toBeGreaterThanOrEqual(0);
        expect(b.right).toBeLessThanOrEqual(vp.width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width);
    });
  }
}
