import { test, expect, waitForHydration } from "../support/fixtures";
import { messages } from "../support/messages";
import { scrollElementTo, setMotionPreference, type MotionPreference } from "../support/motion";

/**
 * Careers › "Why join" — Scroll Stack cards (sticky pin) + "Ready for your
 * next role?" CTA. The talent-network button is intentionally disabled until
 * its destination is confirmed.
 */
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

for (const locale of ["en", "ar"] as const) {
  const learn = messages[locale].CareersPage.learn;

  for (const vp of viewports) {
    test(`${locale} / ${vp.name}: CTA renders, talent button disabled, no overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/${locale}/careers`);
      await waitForHydration(page);

      const heading = page.getByRole("heading", { name: learn.cta.title });
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();

      const primary = page.getByRole("link", { name: learn.cta.primary.label, exact: true });
      await expect(primary).toHaveAttribute("href", /#vacancies$/);
      const secondary = page.getByRole("button", { name: learn.cta.secondary.label });
      await expect(secondary).toBeDisabled();
      await expect(page.getByRole("link", { name: learn.cta.secondary.label })).toHaveCount(0);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      expect(await page.evaluate(() => document.documentElement.dir)).toBe(locale === "ar" ? "rtl" : "ltr");
    });
  }
}

for (const preference of ["no-preference", "reduce"] as MotionPreference[]) {
  test(`${preference}: cards ${preference === "reduce" ? "stay in normal flow" : "pin while scrolling, release in order, reverse cleanly"}`, async ({ page }) => {
    await setMotionPreference(page, preference);
    await page.goto("/en/careers");
    await waitForHydration(page);

    const cards = page.locator("section ul > li", { hasText: messages.en.CareersPage.learn.chips[0] }).locator("xpath=..").locator("> li");
    await expect(cards).toHaveCount(4);
    const position = (i: number) => cards.nth(i).evaluate((el) => getComputedStyle(el).position);
    const top = (i: number) => cards.nth(i).evaluate((el) => Math.round(el.getBoundingClientRect().top));

    if (preference === "reduce") {
      for (let i = 0; i < 4; i++) expect(await position(i)).toBe("static");
      return;
    }

    for (let i = 0; i < 4; i++) expect(await position(i)).toBe("sticky");
    const pin = 112; // Tailwind top-28, clear of the 85px header

    // Let the panel's own reveal finish first so card positions are stable.
    await scrollElementTo(page, cards.nth(0), 300);
    await expect
      .poll(async () => {
        const a = await top(0);
        await page.evaluate(() => new Promise((r) => setTimeout(r, 150)));
        return Math.abs((await top(0)) - a);
      })
      .toBe(0);

    // Scroll until the 4th card is still 40px below the pin line: cards 1-3
    // are pinned on top of each other, the 4th is about to slide over them.
    await scrollElementTo(page, cards.nth(3), pin + 40);
    // The panel's own reveal may still be settling; poll until the pin holds.
    await expect
      .poll(async () => Math.max(...(await Promise.all([0, 1, 2].map(async (i) => Math.abs((await top(i)) - pin))))))
      .toBeLessThanOrEqual(2);
    expect(await top(3)).toBeGreaterThan(pin + 20);

    // Reverse: scroll back above the stack — cards return to a spaced column.
    await scrollElementTo(page, cards.nth(0).locator("xpath=.."), 500);
    const tops = await Promise.all([0, 1, 2, 3].map(top));
    for (let i = 1; i < 4; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1] + 200);

    // Nothing left transformed/faded.
    for (let i = 0; i < 4; i++) {
      expect(await cards.nth(i).evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    }
  });
}
