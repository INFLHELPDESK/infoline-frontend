import { test, expect, waitForHydration } from "../support/fixtures";
import { scrollElementTo } from "../support/motion";

/**
 * Shared pre-footer Contact / CTA › background video (Figma 4779866). The still
 * is always rendered as the poster/fallback; the footage mounts only when motion
 * is permitted, plays while the CTA is in view and pauses when it is not.
 */
const cta = (page: import("@playwright/test").Page) => page.locator("section:has(video[data-testid=cta-video]), section:has(h2):has(a[href$='/contact'])").last();

test.describe("Contact CTA › background video", () => {
  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    for (const locale of ["en", "ar"] as const) {
      test(`${locale}: no video is mounted and the still stays at 30%`, async ({ page }) => {
        await page.goto(`/${locale}`);
        await waitForHydration(page);
        await expect(page.locator("video[data-testid=cta-video]")).toHaveCount(0);
        await expect(cta(page).locator("img").first()).toHaveCSS("opacity", "0.3");
      });
    }
  });

  test.describe("normal motion", () => {
    test.use({ reducedMotion: "no-preference" });

    for (const locale of ["en", "ar"] as const) {
      test(`${locale}: plays when in view, pauses offscreen, 30% opacity`, async ({ page }) => {
        await page.goto(`/${locale}`);
        await waitForHydration(page);
        const video = page.locator("video[data-testid=cta-video]");
        await expect(video).toHaveCount(1);
        await expect(video).toHaveJSProperty("muted", true);
        await expect(video).toHaveJSProperty("loop", true);
        await expect(video).toHaveCSS("opacity", "0.3");
        await expect(video).toHaveJSProperty("paused", true);

        await scrollElementTo(page, cta(page), 100);
        // The harness blocks .mp4 requests (support/network.ts), so assert play intent, not decoded frames.
        await expect(video.locator("source")).toHaveAttribute("src", "/videos/4779866-hd_1920_1080_30fps.mp4");
        await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);

        await page.evaluate(() => window.scrollTo(0, 0));
        await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
      });
    }
  });
});
