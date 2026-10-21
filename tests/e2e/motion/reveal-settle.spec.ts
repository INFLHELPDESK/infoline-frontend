import type { Locator } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { scrollElementTo, setMotionPreference, type MotionPreference } from "../support/motion";

/**
 * components/ui/motion/reveal.tsx: the server always renders the hidden state
 * (opacity 0, blur(14px), offset). Once revealed, the element must end with no
 * blur and no offset in BOTH motion preferences — under reduced motion the
 * server's blur used to stay in the DOM at opacity 1.
 *
 * Consumers: the Careers "Why join" panel (tall, Reveal) and a vacancy row.
 */
const settled = (locator: Locator) =>
  locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      opacity: cs.opacity,
      transform: /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/.test(cs.transform) ? "in place" : cs.transform,
      filter: /^(none|blur\(0px\))$/.test(cs.filter) ? "sharp" : cs.filter,
    };
  });

const SETTLED = { opacity: "1", transform: "in place", filter: "sharp" };

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

for (const preference of ["no-preference", "reduce"] as MotionPreference[]) {
  for (const locale of ["en", "ar"]) {
    for (const vp of viewports) {
      test(`${locale} / ${vp.name} / ${preference}: Reveal consumers settle blur-free and in place`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await setMotionPreference(page, preference);
        await page.goto(`/${locale}/careers`);
        await waitForHydration(page);

        const panel = page.locator("section div.overflow-clip.rounded-2xl").first();
        await scrollElementTo(page, panel, 120);
        await expect.poll(() => settled(panel)).toEqual(SETTLED);

        const row = page.locator("#vacancies ul > li > div").first();
        await scrollElementTo(page, row, 200);
        await expect.poll(() => settled(row)).toEqual(SETTLED);
      });
    }
  }
}
