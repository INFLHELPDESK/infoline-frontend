import { test, expect, waitForHydration } from "../support/fixtures";
import { messages, dirFor } from "../support/messages";

/**
 * About › closing CTA — copy, the two buttons and their locale-aware routes,
 * button alignment/wrapping and no horizontal overflow.
 */
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

for (const locale of ["en", "ar"] as const) {
  const copy = messages[locale].AboutPage.cta;

  for (const vp of viewports) {
    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      test(`${locale} / ${vp.name} / motion:${reducedMotion}: closing CTA buttons`, async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (m) => m.type() === "error" && !m.text().includes("ERR_BLOCKED_BY_CLIENT") && errors.push(m.text())); // fixture blocks off-origin traffic
        page.on("pageerror", (e) => errors.push(e.message));
        await page.emulateMedia({ reducedMotion });
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/${locale}/about`);
        await waitForHydration(page);
        expect(await page.evaluate(() => document.documentElement.dir)).toBe(dirFor(locale));

        const heading = page.getByRole("heading", { level: 3, name: copy.title });
        await heading.scrollIntoViewIfNeeded();
        await expect(heading).toBeVisible();
        const section = page.locator("section", { has: heading });
        await expect(section.getByText(copy.description, { exact: true })).toBeVisible();

        const primary = section.getByRole("link", { name: copy.button.label });
        const secondary = section.getByRole("link", { name: copy.secondaryButton.label });
        await expect(primary).toBeVisible();
        await expect(secondary).toBeVisible();
        await expect(primary).toHaveAttribute("href", `/${locale}${copy.button.href}`);
        await expect(secondary).toHaveAttribute("href", `/${locale}${copy.secondaryButton.href}`);

        const [p, s, h] = await Promise.all([primary.boundingBox(), secondary.boundingBox(), heading.boundingBox()]);
        for (const b of [p!, s!]) {
          expect(b.x).toBeGreaterThanOrEqual(0);
          expect(b.x + b.width).toBeLessThanOrEqual(vp.width);
          expect(b.height).toBeLessThan(80); // labels never wrap onto a second line
        }
        if (vp.name === "mobile") {
          expect(s!.y).toBeGreaterThan(p!.y); // stacked
        } else {
          expect(Math.abs(s!.y - p!.y)).toBeLessThan(2); // one row
        }
        expect(Math.min(p!.y, s!.y)).toBeGreaterThan(h!.y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width);
        expect(errors).toEqual([]);
      });
    }
  }
}
