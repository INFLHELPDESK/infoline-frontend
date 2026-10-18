import type { Page } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { messages } from "../support/messages";
import {
  expectPinnedAt,
  measureLayoutShift,
  scrollElementTo,
  scrollToY,
  waitForAnimationsSettled,
  viewportTop,
  waitForStableStyle,
} from "../support/motion";

/**
 * Characterizes the motion behaviour that exists today and is stable enough
 * to assert. Timing is driven by Playwright's fake clock — never by sleeps.
 * See tests/README.md ("Motion testing strategy").
 */

const industries = messages.en.HomeV1.industries;
/** D-9: React's minified hydration-mismatch error. */
const HYDRATION_MISMATCH = /Minified React error #418;/;
/** Mirrors AUTO_MS in components/sections/home-1/industry-cards.tsx. */
const AUTO_MS = 5_000;

const rail = (page: Page) =>
  page
    .locator("ul")
    .filter({ has: page.getByRole("link", { name: `${industries.items[0].title} — ${industries.exploreLabel}` }) });
const card = (page: Page, index: number) => rail(page).locator(":scope > li").nth(index);
/** The open card is the only one rendering its description. */
const isOpen = (page: Page, index: number) =>
  card(page, index).getByText(industries.items[index].description, { exact: true });

test.describe("/home-1 hydration", () => {
  test("[D-9] hydrates without errors under prefers-reduced-motion", async ({ page, pageErrors }) => {
    test.info().annotations.push({
      type: "known-defect",
      description:
        "D-9: why-trust / hero-badge / logo-constellation branch JSX on useReducedMotion() during render (React #418)",
    });
    await page.goto("/en/home-1");
    await waitForHydration(page);

    // Pin today's defective behaviour exactly, so any other change fails red.
    expect(pageErrors.length).toBeGreaterThan(0);
    expect(pageErrors.filter((e) => !HYDRATION_MISMATCH.test(e.message))).toEqual([]);

    test.fail(); // from here on: the defect itself
    expect(pageErrors.map((e) => e.message)).toEqual([]);
  });

  test("hydrates without errors with motion enabled", async ({ page, pageErrors }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en/home-1");
    await waitForHydration(page);
    expect(pageErrors.map((e) => e.message)).toEqual([]);
  });
});

test.describe("auto-advancing industry rail (/home-1)", () => {
  // D-9 (asserted above) raises a hydration mismatch under reduced motion on
  // this route; only that error is tolerated here, anything else still fails.
  test.use({ knownPageErrors: [HYDRATION_MISMATCH] });

  test("advances to the next card after AUTO_MS while in view", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.clock.install();
    await page.goto("/en/home-1");
    await scrollElementTo(page, rail(page), 200);
    await expect(isOpen(page, 0)).toBeVisible();

    // The timer is armed by an effect once IntersectionObserver reports the
    // rail in view; advance fake time in whole periods until it fires.
    await expect(async () => {
      await page.clock.runFor(AUTO_MS);
      await expect(isOpen(page, 1)).toBeAttached({ timeout: 250 });
    }).toPass({ timeout: 10_000 });
    await expect(isOpen(page, 0)).toHaveCount(0);
  });

  test("never auto-advances under prefers-reduced-motion", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en/home-1");
    await waitForHydration(page, "main ul li a");
    await scrollElementTo(page, rail(page), 200);
    await expect(isOpen(page, 0)).toBeVisible();

    // Same stepping as the motion-on test (which proves the timer arms
    // within these periods once the rail is hydrated and in view).
    for (let i = 0; i < 4; i++) await page.clock.runFor(AUTO_MS);
    await expect(isOpen(page, 0)).toBeVisible();
    await expect(isOpen(page, 1)).toHaveCount(0);
  });

  test("keyboard focus opens a card; activating the open card follows its link", async ({
    page,
  }) => {
    await page.goto("/en/home-1");
    await scrollElementTo(page, rail(page), 200);

    const first = card(page, 0).getByRole("link");
    await first.focus();
    await page.keyboard.press("Tab");
    const second = card(page, 1).getByRole("link");
    await expect(second).toBeFocused();
    await expect(isOpen(page, 1)).toBeVisible();
    await expect(isOpen(page, 0)).toHaveCount(0);

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/en${industries.items[1].href}$`));
  });

  test("first tap on a closed card opens it instead of navigating", async ({ page }) => {
    await page.goto("/en/home-1");
    await scrollElementTo(page, rail(page), 200);
    await card(page, 2).getByRole("link").dispatchEvent("click");
    await expect(isOpen(page, 2)).toBeVisible();
    await expect(page).toHaveURL(/\/en\/home-1$/);
  });
});

test.describe("sticky / pinned layout", () => {
  // With reduced motion the page wrapper keeps a 14px transform (D-7), which
  // offsets every sticky element; characterize sticky itself with motion on.
  test.use({ reducedMotion: "no-preference" });

  test("blog article 'about' rail pins 128px (top-32) below the viewport top", async ({ page }) => {
    await page.goto(`/en/blog/${messages.en.Blog.posts[0].slug}`);
    await waitForStableStyle(page.locator("main").locator("xpath=.."));
    const aside = page.locator("main aside").first();
    const { start, end } = await aside.evaluate((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const parentBottom = el.parentElement!.getBoundingClientRect().bottom + window.scrollY;
      // Sticky range: from reaching top-32 until the grid row runs out.
      return { start: top - 128, end: parentBottom - (el as HTMLElement).offsetHeight - 128 };
    });
    expect(end - start, "rail has room to pin").toBeGreaterThan(40);

    await expectPinnedAt(page, aside, 128, [start + 20, Math.round((start + end) / 2), end - 20]);

    // Before the range it scrolls with the page.
    await scrollToY(page, start - 100);
    expect(Math.round(await viewportTop(aside))).toBe(228);
  });
});

test.describe("reduced motion", () => {
  test("home hero heading is fully visible without transforms once settled", async ({ page }) => {
    await page.goto("/en");
    const heading = page.locator("main h1");
    await waitForAnimationsSettled(heading);
    await waitForStableStyle(heading);
    await expect(heading).toHaveCSS("opacity", "1");
    await expect(heading).toBeInViewport();
  });

  test("[D-7] template entrance leaves no lasting transform on the page wrapper", async ({
    page,
  }) => {
    test.info().annotations.push({
      type: "known-defect",
      description:
        "D-7: app/[locale]/template.tsx hydrates with y:14 then animates opacity only, so translateY(14px) persists",
    });
    await page.goto("/en/about");
    const wrapper = page.locator("main").locator("xpath=..");
    await waitForStableStyle(wrapper);
    await expect(wrapper).toHaveCSS("opacity", "1");
    // Pin today's defective behaviour exactly, so any other change fails red.
    await expect(wrapper).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 14)");

    test.fail(); // from here on: the defect itself
    await expect(wrapper).toHaveCSS("transform", "none", { timeout: 1_000 });
  });
});

test.describe("motion enabled", () => {
  test.use({ reducedMotion: "no-preference" });

  test("template entrance settles at full opacity with no lasting transform", async ({ page }) => {
    await page.goto("/en/about");
    const wrapper = page.locator("main").locator("xpath=..");
    await waitForStableStyle(wrapper);
    await expect(wrapper).toHaveCSS("opacity", "1");
    await expect(wrapper).toHaveCSS("transform", "none");
  });
});

test.describe("layout stability", () => {
  test("home page stays within the 'good' CLS budget while loading and scrolling", async ({
    page,
  }) => {
    await page.goto("/en");
    const cls = await measureLayoutShift(page, async () => {
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= height; y += 800) await scrollToY(page, y);
    });
    test.info().annotations.push({ type: "cls", description: cls.toFixed(4) });
    expect(cls).toBeLessThan(0.1);
  });
});
