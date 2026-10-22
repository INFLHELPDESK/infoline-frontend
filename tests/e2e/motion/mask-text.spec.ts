import type { Locator } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { scrollElementTo, setMotionPreference, type MotionPreference } from "../support/motion";

/**
 * components/ui/motion/mask-text.tsx: headings reveal word by word. Once
 * revealed, every word must be fully visible, in place and unblurred in BOTH
 * motion preferences — under reduced motion the words used to stay at
 * opacity 0 because the server always renders the split, hidden state.
 *
 * Consumers: About (Who we are, hero…) and Careers headings.
 */
const WORDS = 'span[style*="overflow"] > span';

const settled = (words: Locator) =>
  words.evaluateAll((els) =>
    els.map((el) => {
      const cs = getComputedStyle(el);
      return {
        opacity: cs.opacity,
        inPlace: /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/.test(cs.transform),
        sharp: /^(none|blur\(0px\))$/.test(cs.filter),
      };
    }),
  );

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

for (const path of ["about", "careers"]) {
  for (const preference of ["no-preference", "reduce"] as MotionPreference[]) {
    for (const locale of ["en", "ar"]) {
      for (const vp of viewports) {
        test(`${locale} / ${vp.name} / ${preference}: /${path} MaskText headings settle visible`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await setMotionPreference(page, preference);
          await page.goto(`/${locale}/${path}`);
          await waitForHydration(page);

          const headings = page.locator("h1, h2").filter({ has: page.locator(WORDS) });
          const count = Math.min(await headings.count(), 3);
          expect(count).toBeGreaterThan(0);

          for (let i = 0; i < count; i++) {
            const heading = headings.nth(i);
            await scrollElementTo(page, heading, 200);
            const words = heading.locator(WORDS);
            expect(await words.count()).toBeGreaterThan(0);
            await expect
              .poll(async () => (await settled(words)).every((w) => w.opacity === "1" && w.inPlace && w.sharp))
              .toBe(true);
          }
        });
      }
    }
  }
}
