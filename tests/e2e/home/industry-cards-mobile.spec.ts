import { test, expect, waitForHydration } from "../support/fixtures";
import { scrollElementTo } from "../support/motion";

/**
 * Home › Industries rail below `lg` (Designer mobile review, finding #1).
 * The sector icon leads each row in BOTH the collapsed and the open card (the
 * start side: left in EN, right in AR, so the icon never jumps while a card
 * opens), and long sector titles wrap instead of being clipped.
 */
const viewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
];

for (const locale of ["en", "ar"] as const) {
  for (const vp of viewports) {
    test(`${locale} / ${vp.width}px: icon leads every row and titles are not clipped`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto(`/${locale}`);
      await waitForHydration(page);
      const rail = page.locator("ul:has(> li > a[aria-label*='—'])");
      await scrollElementTo(page, rail, 100);

      const measure = () =>
        rail.evaluate((ul) =>
          [...ul.children].map((li) => {
            const icon = li.querySelector<HTMLElement>("span.grid.size-10");
            const title = icon?.parentElement?.querySelector<HTMLElement>(":scope > span.font-black, :scope > span > span.font-black");
            const row = li.getBoundingClientRect();
            const i = icon!.getBoundingClientRect();
            const t = title!.getBoundingClientRect();
            return {
              iconLeading: getComputedStyle(ul).direction === "rtl" ? i.left > t.left : i.left < t.left,
              iconSide: Math.round(getComputedStyle(ul).direction === "rtl" ? row.right - i.right : i.left - row.left),
              // Real clipping = text needing more lines than line-clamp-2 shows (Arabic glyph
              // metrics add ~2px of scroll height, so compare against the line count).
              clipped: Math.round(title!.scrollHeight / parseFloat(getComputedStyle(title!).lineHeight)) > 2,
              inside: row.left <= i.left && i.right <= row.right && t.left >= row.left - 1 && t.right <= row.right + 1,
            };
          }),
        );

      const first = await measure();
      expect(first.every((r) => r.iconLeading && !r.clipped && r.inside)).toBe(true);

      // Open the last card: every row (open and collapsed) keeps the icon on the same side.
      await rail.locator("> li").last().locator("a").click();
      await expect.poll(async () => (await measure()).every((r) => r.iconLeading && !r.clipped && r.inside)).toBe(true);
      const after = await measure();
      expect(new Set(after.map((r) => r.iconSide)).size).toBeLessThanOrEqual(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    });
  }
}
