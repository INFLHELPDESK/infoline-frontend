import type { Locator, Page } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { dirFor, locales, messages } from "../support/messages";

/**
 * Solutions catalogue below `lg` (Designer mobile review, finding #3): a stacked
 * accordion whose panel follows its row in the DOM (so visual, Tab and
 * screen-reader order agree). The desktop rail and the mobile accordion are
 * separate layouts toggled with display:none, so only one is ever in the
 * accessibility tree / tab order.
 */
const MOBILE = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
];
const mRows = (page: Page) => page.locator("#catalogue button[id^='cat-btn-m-']");
const mPanel = (page: Page) => page.locator("#catalogue [id^='cat-panel-m-']");
const box = async (l: Locator) => (await l.boundingBox())!;
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const locale of locales) {
  const s = messages[locale].SolutionsPage;
  const n = s.catalogue.services.length;

  for (const vp of MOBILE) {
    test.describe(`${locale} ${vp.width}px`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(vp);
        await page.goto(`/${locale}/solutions`);
        await waitForHydration(page);
        await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
        await page.locator("#catalogue").scrollIntoViewIfNeeded();
      });

      test("stacked rows, first open, desktop layout absent from the a11y tree", async ({ page }) => {
        await expect(mRows(page)).toHaveCount(n);
        // Only the mobile buttons are rendered (visible); the desktop rail is display:none.
        await expect(page.locator("#catalogue button[id^='cat-btn-']:visible")).toHaveCount(n);
        await expect(
          page.locator(`#catalogue a[href="/${locale}/solutions/managed-branch-retail"]:visible`),
        ).toHaveCount(1);
        const xs = await mRows(page).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
        expect(new Set(xs).size).toBe(1);
        await expect(mRows(page).first()).toHaveAttribute("aria-expanded", "true");
        await expect(mPanel(page)).toHaveCount(1); // never two active panels
        expect(await overflow(page)).toBe(0);
      });

      test("DOM order = visual order; aria-controls targets the panel right after its row", async ({ page }) => {
        const target = mRows(page).nth(n - 2);
        await target.click();
        await expect(target).toHaveAttribute("aria-expanded", "true");
        await expect(mRows(page).first()).toHaveAttribute("aria-expanded", "false");
        await expect(mPanel(page)).toHaveCount(1);
        const id = (await target.getAttribute("aria-controls"))!;
        await expect(page.locator(`#${id}`)).toHaveAttribute("aria-labelledby", (await target.getAttribute("id"))!);
        // The panel is the next DOM sibling of the row's heading...
        expect(await target.evaluate((b) => b.closest("h3")!.nextElementSibling?.id)).toBe(id);
        // ...and sits directly beneath it visually, with the next row below it.
        const b = await box(target);
        const p = await box(page.locator(`#${id}`));
        expect(Math.abs(p.y - (b.y + b.height))).toBeLessThanOrEqual(2);
        const next = await box(mRows(page).nth(n - 1));
        expect(next.y).toBeGreaterThanOrEqual(p.y + p.height - 2);
        // Whole-list DOM order equals vertical order.
        const ys = await page
          .locator("#catalogue button[id^='cat-btn-m-'], #catalogue [id^='cat-panel-m-']")
          .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
        expect(ys).toEqual([...ys].sort((x, y) => x - y));
        await expect(page.locator(`#${id} h2`)).toHaveCount(0);
        await target.click(); // tap-to-close stays supported
        await expect(target).toHaveAttribute("aria-expanded", "false");
        await expect(mPanel(page)).toHaveCount(0);
      });

      test("keyboard: panel CTA is the next Tab stop, Enter/Space toggle, focus stays on the row", async ({ page }) => {
        const first = mRows(page).first();
        await first.focus();
        expect(await first.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
        await page.keyboard.press("Tab");
        await expect(page.locator(`#cat-panel-m-${s.catalogue.services[0].id} a`)).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(mRows(page).nth(1)).toBeFocused(); // next row comes after the panel

        await page.keyboard.press("Enter");
        await expect(mRows(page).nth(1)).toHaveAttribute("aria-expanded", "true");
        await expect(mRows(page).nth(1)).toBeFocused(); // focus not moved into the panel
        await page.keyboard.press("Space");
        await expect(mRows(page).nth(1)).toHaveAttribute("aria-expanded", "false");
        await expect(mRows(page).nth(1)).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(mRows(page).nth(2)).toBeFocused(); // collapsed: no panel stop
      });

      test("reduced motion: switching is immediate", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await mRows(page).nth(5).click();
        await expect(mPanel(page)).toBeVisible();
        await expect(mPanel(page)).toHaveCSS("opacity", "1");
        expect(await overflow(page)).toBe(0);
      });

      test("indicator on the end side; service 09 still navigates", async ({ page }) => {
        const row = await box(mRows(page).first());
        const icon = await box(mRows(page).first().locator("svg").last());
        const mid = icon.x + icon.width / 2;
        if (locale === "ar") expect(mid).toBeLessThan(row.x + row.width / 2);
        else expect(mid).toBeGreaterThan(row.x + row.width / 2);
        await page.locator(`#catalogue a[href="/${locale}/solutions/managed-branch-retail"]:visible`).click();
        await expect(page).toHaveURL(new RegExp(`/${locale}/solutions/managed-branch-retail`));
      });
    });
  }

  for (const width of [1024, 1440]) {
    test(`${locale} ${width}px: desktop rail + side panel, mobile accordion absent`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1080 });
      await page.goto(`/${locale}/solutions`);
      await waitForHydration(page);
      await expect(mRows(page).first()).toBeHidden();
      const rows = page.locator("#catalogue button[id^='cat-btn-']:visible");
      await expect(rows).toHaveCount(n);
      await expect(rows.first()).toHaveAttribute("aria-pressed", "true");
      const r = await box(rows.first());
      expect(Math.round(r.width)).toBeGreaterThanOrEqual(258); // 260px rail (minus border)
      expect(Math.round(r.width)).toBeLessThanOrEqual(260);
      await rows.first().click();
      await expect(rows.first()).toHaveAttribute("aria-pressed", "true"); // cannot collapse
      await rows.nth(3).click();
      await expect(page.locator("#catalogue h2:visible", { hasText: s.catalogue.services[3].title })).toBeVisible();
      expect(await overflow(page)).toBe(0);
    });
  }
}
