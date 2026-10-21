import type { Locator } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { messages } from "../support/messages";
import { scrollToY, setMotionPreference, type MotionPreference } from "../support/motion";

/**
 * components/ui/motion/stagger.tsx is shared by most sections (and the footer).
 * The server renders every StaggerItem in its hidden state (blur + offset). Once
 * revealed, an item must end with no blur and no offset — in BOTH motion
 * preferences. Regression: under reduced motion the server's
 * blur(10px)/translateY(56px) used to stay in the DOM.
 *
 * MaskText and Reveal share the same inline `will-change`, so consumers are
 * targeted by content rather than by a generic selector.
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

for (const preference of ["reduce", "no-preference"] as MotionPreference[]) {
  test(`${preference}: careers hero description (StaggerItem) settles blur-free and in place`, async ({ page }) => {
    await setMotionPreference(page, preference);
    await page.goto("/en/careers");
    await waitForHydration(page);
    const description = page.getByText(messages.en.CareersPage.hero.description, { exact: true });
    await description.scrollIntoViewIfNeeded();
    await expect.poll(() => settled(description)).toEqual(SETTLED);
  });

  for (const path of ["/en/about", "/ar/about"]) {
    test(`${path} / ${preference}: footer columns (StaggerItem) settle blur-free and in place`, async ({ page }) => {
      await setMotionPreference(page, preference);
      await page.goto(path);
      await waitForHydration(page);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await scrollToY(page, height);

      const items = page.locator('footer [style*="will-change"]');
      const count = await items.count();
      expect(count, "footer has staggered items").toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await expect.poll(() => settled(items.nth(i))).toEqual(SETTLED);
      }
    });
  }
}
