import { test, expect } from "../support/fixtures";

/** Designer Fix #4 — page-wide components (Infoline-04-Global-Components.pdf). */
for (const locale of ["en", "ar"] as const) {
  test.describe(`global components (${locale})`, () => {
    test("home hero has no eyebrow pill and the headline is its first child", async ({ page }) => {
      await page.goto(`/${locale}`);
      const hero = page.locator("main section").first();
      await expect(hero.locator("h1")).toBeVisible();
      await expect(hero.locator("span.rounded-full.backdrop-blur-xl")).toHaveCount(0);
      const first = await hero.locator("h1").evaluate((h) => h.parentElement!.firstElementChild === h);
      expect(first).toBe(true);
    });

    test("light eyebrows share one treatment; dark ones stay frosted", async ({ page }) => {
      await page.goto(`/${locale}`);
      const pills = page.locator("main span.inline-flex.h-10.rounded-full");
      const styles = await pills.evaluateAll((els) =>
        els.map((e) => {
          const s = getComputedStyle(e);
          return { bg: s.backgroundColor, border: `${s.borderTopWidth} ${s.borderTopColor}`, color: s.color };
        }),
      );
      const light = styles.filter((s) => s.bg === "rgb(255, 255, 255)");
      const dark = styles.filter((s) => s.bg !== "rgb(255, 255, 255)");
      expect(light.length).toBeGreaterThanOrEqual(5);
      expect(dark.length).toBeGreaterThanOrEqual(2);
      for (const s of light) {
        expect(s.border).toBe("1px rgb(238, 238, 238)");
        expect(s.color).toBe("rgb(28, 151, 212)");
      }
      for (const s of dark) expect(s.border.startsWith("0px")).toBe(true);
    });

    test("language toggle labels are 12px medium white on the dark header", async ({ page }) => {
      await page.goto(`/${locale}`);
      const buttons = page.locator("header [role=group]").first().locator("button");
      await expect(buttons).toHaveCount(2);
      for (const label of await buttons.locator("span > span").all()) {
        await expect(label).toHaveCSS("font-size", "12px");
        await expect(label).toHaveCSS("font-weight", "500");
        await expect(label).toHaveCSS("color", "rgb(255, 255, 255)");
      }
      await expect(buttons.locator('[lang="ar"]')).toHaveCSS("font-family", /Tajawal/);
    });

    test("navbar CTA is 40px high with 8px radius, 16px padding and a 20px icon", async ({ page }) => {
      await page.goto(`/${locale}`);
      const cta = page.locator("header a.h-10").filter({ has: page.locator("svg") }).first();
      await expect(cta).toHaveCSS("height", "40px");
      await expect(cta).toHaveCSS("border-top-left-radius", "8px");
      await expect(cta).toHaveCSS("padding-left", "16px");
      await expect(cta.locator("svg")).toHaveCSS("width", "20px");
    });
  });
}
