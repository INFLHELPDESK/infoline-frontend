import { test, expect, waitForHydration } from "../support/fixtures";
import { dirFor, locales } from "../support/messages";
import { setMotionPreference, type MotionPreference } from "../support/motion";

/**
 * app/[locale]/template.tsx fades/slides every page in. The server always
 * renders its initial state (translateY(14px)); the client must clear that
 * transform in BOTH motion preferences. Regression: under reduced motion the
 * server's translateY(14px) used to stay in the DOM, shifting all page content
 * (CTA included) 14px down over the footer.
 */
for (const preference of ["reduce", "no-preference"] as MotionPreference[]) {
  for (const locale of locales) {
    test(`${locale} / ${preference}: page content settles in its final position`, async ({ page }) => {
      await setMotionPreference(page, preference);
      await page.goto(`/${locale}/about`);
      await waitForHydration(page);
      await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));

      const template = page.locator("footer").locator("xpath=preceding-sibling::*[1]");
      await expect
        .poll(() => template.evaluate((el) => getComputedStyle(el).transform))
        .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      await expect.poll(() => template.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");

      // Geometry: the last page content ends exactly where the footer starts.
      const gap = await template.evaluate(
        (el) => Math.round(document.querySelector("footer")!.getBoundingClientRect().top - el.getBoundingClientRect().bottom),
      );
      expect(gap).toBe(0);
    });
  }
}
