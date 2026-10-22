import { test, expect, waitForHydration } from "../support/fixtures";
import { messages, dirFor } from "../support/messages";

/**
 * About › "Who we are" — copy plus the three-window photo composition
 * (outer windows high, middle window offset down; right third of the photo in
 * the left window, left third in the right window, per Figma).
 */
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

for (const locale of ["en", "ar"] as const) {
  const copy = messages[locale].AboutPage.whoWeAre;
  const heading =
    locale === "en"
      ? "About Infoline, Journey and Commitment"
      : [copy.titleLead, copy.titleAccent].join(" ");

  for (const vp of viewports) {
    test(`${locale} / ${vp.name}: Who we are copy, photo composition, no overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/${locale}/about`);
      await waitForHydration(page);
      expect(await page.evaluate(() => window.innerWidth)).toBe(vp.width);
      expect(await page.evaluate(() => document.documentElement.dir)).toBe(dirFor(locale));

      const h2 = page.getByRole("heading", { level: 2, name: heading });
      await h2.scrollIntoViewIfNeeded();
      await expect(h2).toBeVisible();
      const section = page.locator("section", { has: h2 });
      await expect(section.getByText(copy.eyebrow, { exact: true })).toBeVisible();
      await expect(section.getByText(copy.paragraphs[0], { exact: true })).toBeVisible();

      // Three slices of one photo, left to right in physical order.
      const imgs = section.locator('img[src*="who-full"]');
      await expect(imgs).toHaveCount(3);
      await imgs.last().scrollIntoViewIfNeeded();
      const slices = await imgs.evaluateAll((els) =>
        els.map((el) => {
          const img = el.getBoundingClientRect();
          const win = el.parentElement!.parentElement!.getBoundingClientRect();
          return { imgLeft: img.left, winW: win.width, winH: win.height, loaded: (el as HTMLImageElement).naturalWidth > 0 };
        }),
      );
      const [left, mid, right] = slices;
      expect(slices.every((s) => s.loaded)).toBe(true);
      // Photo offsets: the left window shows the photo's right third (image
      // shifted left), the right window its left third, the middle the centre.
      const step = (352 / 167) * left.winW;
      expect(Math.abs(mid.imgLeft - left.imgLeft - step)).toBeLessThan(2);
      expect(Math.abs(right.imgLeft - mid.imgLeft - step)).toBeLessThan(2);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
