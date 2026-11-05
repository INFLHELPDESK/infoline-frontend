import { test, expect, waitForHydration } from "../support/fixtures";
import { scrollElementTo } from "../support/motion";

/**
 * About, Insights, Industries and Careers closing bands › background video (designer review
 * 2026-11-05, finding #2). The still is always the poster/fallback; the footage
 * mounts only when motion is permitted, plays in view and pauses offscreen.
 */
const pages = ["about", "insights", "industries", "careers"] as const;

for (const slug of pages) {
  test.describe(`${slug} closing band › video`, () => {
    test.describe("reduced motion", () => {
      test.use({ reducedMotion: "reduce" });
      for (const locale of ["en", "ar"] as const) {
        test(`${locale}: no video mounted, still stays at 30%`, async ({ page }) => {
          await page.goto(`/${locale}/${slug}`);
          await waitForHydration(page);
          await expect(page.locator("video[data-testid=band-video]")).toHaveCount(0);
          await expect(page.locator("img[src*='options%2Fbg']").last()).toHaveCSS("opacity", "0.3");
        });
      }
    });

    test.describe("normal motion", () => {
      test.use({ reducedMotion: "no-preference" });
      for (const locale of ["en", "ar"] as const) {
        test(`${locale}: plays in view, pauses offscreen, 30% under tint and fade`, async ({ page }) => {
          await page.goto(`/${locale}/${slug}`);
          await waitForHydration(page);
          const video = page.locator("video[data-testid=band-video]");
          await expect(video).toHaveCount(1);
          await expect(video).toHaveJSProperty("muted", true);
          await expect(video).toHaveJSProperty("loop", true);
          await expect(video).toHaveCSS("opacity", "0.3");
          await expect(video).toHaveJSProperty("paused", true);
          await expect(video.locator("source")).toHaveAttribute("src", "/videos/4779866-hd_1920_1080_30fps.mp4");

          const layers = video.locator("xpath=ancestor::div[@aria-hidden][1]");
          await expect(layers.locator("> div").nth(1)).toHaveCSS("background-color", /^(lab|rgba)\(.* 0\.16\)$/);
          await expect(layers.locator("> div").nth(2)).toHaveCSS("background-image", /linear-gradient\(/);

          await scrollElementTo(page, video, 100);
          // The harness blocks .mp4 requests, so assert play intent, not decoded frames.
          await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
          await page.evaluate(() => window.scrollTo(0, 0));
          await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
        });
      }
    });
  });
}
