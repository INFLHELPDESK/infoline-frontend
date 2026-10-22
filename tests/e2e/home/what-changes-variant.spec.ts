import { test, expect, waitForHydration } from "../support/fixtures";
import { messages, dirFor } from "../support/messages";

/**
 * Home › "What changes with Infoline" preview variants. `?homeVariant=new`
 * swaps in the Figma toggle design for internal review; everything else keeps
 * the existing three-column design. Reduced motion is the project default.
 */
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const toggle = (page: import("@playwright/test").Page) => page.locator('section[data-home-variant="new"]');

for (const locale of ["en", "ar"] as const) {
  const copy = messages[locale].HomeV1.whatChanges;

  test(`${locale}: default and ?homeVariant=current keep the existing design`, async ({ page }) => {
    for (const query of ["", "?homeVariant=current", "?homeVariant=bogus", "?homeVariant=NEW"]) {
      await page.goto(`/${locale}${query}`);
      await waitForHydration(page);
      await expect(toggle(page)).toHaveCount(0);
      const heading = page.getByRole("heading", { level: 3, name: copy.columns.impact });
      await expect(heading).toHaveCount(1);
      // The header and footer carry the same link text, so scope to this section.
      const existing = page.locator("section", { has: heading });
      await expect(existing.getByRole("link", { name: copy.cta.label })).toHaveAttribute(
        "href",
        new RegExp(`${copy.cta.href}$`),
      );
    }
  });

  for (const vp of viewports) {
    test(`${locale} / ${vp.name}: ?homeVariant=new renders the toggle design, no overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/${locale}?homeVariant=new`);
      await waitForHydration(page);
      expect(await page.evaluate(() => document.documentElement.dir)).toBe(dirFor(locale));

      const section = toggle(page);
      await section.scrollIntoViewIfNeeded();
      await expect(section.getByRole("heading", { level: 2, name: copy.title })).toBeVisible();
      await expect(page.getByRole("heading", { level: 3, name: copy.columns.impact })).toHaveCount(0);

      // Without state first.
      await expect(section.getByRole("tab", { name: copy.columns.without })).toHaveAttribute("aria-selected", "true");
      for (const row of copy.rows) await expect(section.getByText(row.without, { exact: true })).toBeVisible();

      await section.getByRole("tab", { name: copy.columns.with }).click();
      for (const row of copy.rows) {
        await expect(section.getByText(row.with, { exact: true })).toBeVisible();
        await expect(section.getByText(row.impact, { exact: true })).toBeVisible();
      }

      // Every visible pill stays inside the viewport; the page never scrolls sideways.
      const boxes = await section
        .locator("[role=tabpanel]:not([hidden]) li")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ left: r.left, right: r.right })));
      expect(boxes).toHaveLength(8);
      for (const b of boxes) {
        expect(b.left).toBeGreaterThanOrEqual(0);
        expect(b.right).toBeLessThanOrEqual(vp.width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width);

      if (vp.name === "desktop") {
        // The first pill sits on the dial's start side: left in LTR, right in RTL.
        const dial = await section.locator("[role=tabpanel]:not([hidden]) [data-dial]").boundingBox();
        const first = await section.locator("[role=tabpanel]:not([hidden]) li").first().boundingBox();
        expect(dial && first).toBeTruthy();
        const dialMid = dial!.x + dial!.width / 2;
        const firstMid = first!.x + first!.width / 2;
        expect(locale === "en" ? firstMid < dialMid : firstMid > dialMid).toBe(true);
      }
    });
  }

  test(`${locale}: reload and direct entry keep the selected variant`, async ({ page }) => {
    await page.goto(`/${locale}?homeVariant=new`);
    await waitForHydration(page);
    await expect(toggle(page)).toHaveCount(1);
    await page.reload();
    await waitForHydration(page);
    await expect(toggle(page)).toHaveCount(1);
  });
}

test("switching variant leaves the other Home sections unchanged", async ({ page }) => {
  const outline = async (query: string) => {
    await page.goto(`/en${query}`);
    await waitForHydration(page);
    return page.evaluate(() =>
      [...document.querySelectorAll("main > section")].map((s) => s.querySelector("h1,h2")?.textContent ?? ""),
    );
  };
  const current = await outline("");
  const alt = await outline("?homeVariant=new");
  // The swapped section keeps the same title, so the outlines match exactly.
  expect(alt).toEqual(current);
});
