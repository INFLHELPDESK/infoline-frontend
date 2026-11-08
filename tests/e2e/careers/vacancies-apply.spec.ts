import { test, expect, waitForHydration } from "../support/fixtures";

/** Designer closure report (7 Nov 2026): the Arabic Apply label must stay on one line in every row. */
test.use({ reducedMotion: "reduce" });

for (const locale of ["en", "ar"] as const) {
  for (const [w, h] of [[1440, 1080], [390, 844]] as const) {
    test(`${locale} @${w}: Apply is a disabled single-line control, no overflow`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`/${locale}/careers`);
      await waitForHydration(page);
      const buttons = page.locator("main ul li button[disabled]");
      expect(await buttons.count()).toBeGreaterThan(0);
      for (const b of await buttons.all()) {
        await b.scrollIntoViewIfNeeded();
        const lh = await b.evaluate((e) => parseFloat(getComputedStyle(e).lineHeight));
        expect((await b.boundingBox())!.height).toBeLessThanOrEqual(lh + 1);
        await expect(b).toBeDisabled();
      }
      await expect(page.locator("main ul li a[href*='apply'], main form")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    });
  }
}
