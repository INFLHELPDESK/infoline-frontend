import { test, expect, waitForHydration } from "../support/fixtures";

/** Designer closure report (7 Nov 2026): plural English label; Arabic 2004 label must not strand the year. */
test.use({ reducedMotion: "reduce" });

const lines = (l: import("@playwright/test").Locator) =>
  l.evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)));

for (const [w, h] of [[1440, 1080], [390, 844]] as const) {
  test(`en @${w}: approved stat labels, no overflow`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/en");
    await waitForHydration(page);
    await expect(page.getByText("Customer transactions a year", { exact: true })).toBeVisible();
    await expect(page.getByText("Customer transaction a year", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });

  test(`ar @${w}: the 2004 label keeps the year on the same line`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/ar");
    await waitForHydration(page);
    const label = page.getByText("نعمل في عُمان منذ 2004", { exact: true }).first();
    expect(await lines(label)).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}
