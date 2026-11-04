import { test, expect, waitForHydration } from "../support/fixtures";
import { dirFor, locales, messages } from "../support/messages";

/**
 * Solutions catalogue below `lg` (Designer mobile review, finding #3): the
 * horizontal tab strip is a stacked accordion. Rows are the same buttons the
 * desktop rail uses; the single detail panel is placed under the open row.
 */
const MOBILE = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
];

for (const locale of locales) {
  const s = messages[locale].SolutionsPage;
  const rows = (page: import("@playwright/test").Page) => page.locator("#catalogue button[aria-controls='cat-panel']");
  const panel = (page: import("@playwright/test").Page) => page.locator("#cat-panel");
  const box = async (l: import("@playwright/test").Locator) => (await l.boundingBox())!;

  for (const vp of MOBILE) {
    test.describe(`${locale} ${vp.width}px`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(vp);
        await page.goto(`/${locale}/solutions`);
        await waitForHydration(page);
        await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
        await page.locator("#catalogue").scrollIntoViewIfNeeded();
      });

      test("lists all services stacked, first open, no horizontal strip or overflow", async ({ page }) => {
        await expect(rows(page)).toHaveCount(s.catalogue.services.length);
        await expect(page.locator(`#catalogue a[href="/${locale}/solutions/managed-branch-retail"]`)).toBeVisible();
        const list = rows(page).first().locator("xpath=..");
        expect(await list.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
        const xs = await rows(page).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
        expect(new Set(xs).size).toBe(1); // one column, not a strip
        await expect(rows(page).first()).toHaveAttribute("aria-expanded", "true");
        await expect(panel(page)).toHaveAttribute("aria-labelledby", "cat-btn-" + s.catalogue.services[0].id);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
      });

      test("opens a distant row under itself, one at a time, and toggles closed", async ({ page }) => {
        const last = rows(page).nth(s.catalogue.services.length - 1);
        await last.click();
        await expect(last).toHaveAttribute("aria-expanded", "true");
        await expect(rows(page).first()).toHaveAttribute("aria-expanded", "false");
        expect(await rows(page).evaluateAll((els) => els.filter((e) => e.getAttribute("aria-expanded") === "true").length)).toBe(1);
        await expect(panel(page)).toBeVisible();
        const b = await box(last);
        const p = await box(panel(page));
        expect(Math.abs(p.y - (b.y + b.height))).toBeLessThanOrEqual(2); // directly beneath its row
        await expect(page.locator("#cat-panel h2")).toHaveText(s.catalogue.services.at(-1)!.title);

        await last.click(); // tap the open row again
        await expect(last).toHaveAttribute("aria-expanded", "false");
        await expect(panel(page)).toBeHidden();
      });

      test("keyboard: Tab focus ring, Enter and Space switch rows", async ({ page }) => {
        const third = rows(page).nth(2);
        await third.focus();
        await expect(third).toBeFocused();
        expect(await third.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
        await page.keyboard.press("Enter");
        await expect(third).toHaveAttribute("aria-expanded", "true");
        const fourth = rows(page).nth(3);
        await fourth.focus();
        await page.keyboard.press("Space");
        await expect(fourth).toHaveAttribute("aria-expanded", "true");
        await expect(third).toHaveAttribute("aria-expanded", "false");
      });

      test("reduced motion: switching is immediate", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await rows(page).nth(5).click();
        await expect(panel(page)).toBeVisible();
        await expect(page.locator("#cat-panel h2")).toHaveText(s.catalogue.services[5].title);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
      });

      test("indicator sits at the end side", async ({ page }) => {
        const row = await box(rows(page).first());
        const icon = await box(rows(page).first().locator("svg").last());
        if (locale === "ar") expect(icon.x + icon.width / 2).toBeLessThan(row.x + row.width / 2);
        else expect(icon.x + icon.width / 2).toBeGreaterThan(row.x + row.width / 2);
      });
    });
  }

  test(`${locale} 1440px: desktop rail + side panel unchanged, active row cannot collapse`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto(`/${locale}/solutions`);
    await waitForHydration(page);
    const first = rows(page).first();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    const r = await box(first);
    const p = await box(panel(page));
    if (locale === "ar") expect(p.x + p.width).toBeLessThanOrEqual(r.x + 1);
    else expect(p.x).toBeGreaterThanOrEqual(r.x + r.width - 1);
    await first.click();
    await expect(panel(page)).toBeVisible();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await rows(page).nth(3).click();
    await expect(page.locator("#cat-panel h2")).toHaveText(s.catalogue.services[3].title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}
