import { test, expect, waitForHydration } from "../support/fixtures";
import { scrollElementTo } from "../support/motion";

/**
 * Home › Partners marquee. Each row slides one logo group per 40s cycle; the
 * track must hold enough copies that no empty space shows at either edge at
 * any phase, on wide screens included (two copies left a gap above 1448px).
 */
const widths = [390, 1440, 1920, 2560];
const marquee = (page: import("@playwright/test").Page) => page.locator("section:has(ul.partners-track)");

test.describe("Home › Partners marquee", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const locale of ["en", "ar"] as const) {
    for (const width of widths) {
      test(`${locale} / ${width}px: rows stay covered through the whole cycle and wrap seamlessly`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}`);
        await waitForHydration(page);
        await scrollElementTo(page, marquee(page), 100);

        const result = await marquee(page).evaluate((section) => {
          const tracks = [...section.querySelectorAll<HTMLElement>("ul.partners-track")];
          const anims = tracks.map((t) => t.getAnimations()[0]);
          const out = tracks.map((track, i) => {
            const anim = anims[i];
            const duration = Number(anim.effect!.getComputedTiming().duration);
            const box = track.parentElement!.getBoundingClientRect();
            const edgeGap = () => {
              const first = track.firstElementChild!.getBoundingClientRect();
              const last = track.lastElementChild!.getBoundingClientRect();
              const m = parseFloat(getComputedStyle(track.firstElementChild!).marginLeft);
              return Math.max(0, first.left - m - box.left, box.right - (last.right + m));
            };
            const onScreen = () =>
              [...track.children]
                .map((li) => [li.querySelector("img")!.getAttribute("src"), li.getBoundingClientRect()] as const)
                .filter(([, r]) => r.right > box.left && r.left < box.right)
                .map(([src, r]) => `${src}@${Math.round(r.left - box.left)}`)
                .join(",");
            anim.pause();
            let maxGap = 0;
            for (let k = 0; k <= 200; k++) {
              anim.currentTime = Math.min(duration - 0.001, (duration * k) / 200);
              maxGap = Math.max(maxGap, edgeGap());
            }
            anim.currentTime = 0;
            const start = onScreen();
            const x0 = new DOMMatrix(getComputedStyle(track).transform).m41;
            anim.currentTime = duration - 0.001;
            const end = onScreen();
            const x1 = new DOMMatrix(getComputedStyle(track).transform).m41;
            return { duration, maxGap: Math.round(maxGap), seamless: start === end, travel: Math.round(x1 - x0) };
          });
          return out;
        });

        expect(result.map((r) => r.duration)).toEqual([40000, 40000]);
        expect(result.map((r) => r.maxGap)).toEqual([0, 0]);
        expect(result.map((r) => r.seamless)).toEqual([true, true]);
        // Row one travels left by one group (8 pills), row two right by one group (9 pills).
        // Pill pitch: 108px below sm (640px), 181px from sm up.
        const pitch = width < 640 ? 108 : 181;
        expect(result.map((r) => r.travel)).toEqual([-8 * pitch, 9 * pitch]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
      });
    }
  }

  test("hovering a row pauses only that row; reduced motion stops both", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto("/en");
    await waitForHydration(page);
    await scrollElementTo(page, marquee(page), 100);
    const positions = () =>
      page.evaluate(() => [...document.querySelectorAll("ul.partners-track")].map((t) => new DOMMatrix(getComputedStyle(t).transform).m41));
    const states = () =>
      page.evaluate(() => [...document.querySelectorAll("ul.partners-track")].map((t) => getComputedStyle(t).animationPlayState));

    const row = page.locator(".partners-marquee").first();
    await row.hover();
    await expect.poll(states).toEqual(["paused", "running"]);
    const paused = await positions();
    await expect.poll(async () => (await positions())[0]).toBe(paused[0]);
    await expect.poll(async () => (await positions())[1]).not.toBe(paused[1]);

    await page.mouse.move(1, 1);
    await expect.poll(states).toEqual(["running", "running"]);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() => page.evaluate(() => [...document.querySelectorAll("ul.partners-track")].map((t) => getComputedStyle(t).animationName)))
      .toEqual(["none", "none"]);
    await expect(page.locator("ul.partners-track li:not([aria-hidden]) img")).toHaveCount(17);
  });
});
