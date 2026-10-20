import type { Page } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { messages } from "../support/messages";
import {
  measureLayoutShift,
  scrollElementTo,
  scrollToY,
  waitForAnimationsSettled,
  waitForStableStyle,
} from "../support/motion";

/**
 * Characterizes the motion behaviour that exists today and is stable enough
 * to assert. Timing is driven by Playwright's fake clock — never by sleeps.
 * See tests/README.md ("Motion testing strategy").
 */

const industries = messages.en.HomeV1.industries;
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

test.describe("homepage hydration", () => {
  test("hydrates without errors under prefers-reduced-motion", async ({ page, pageErrors }) => {
    await page.goto("/en");
    await waitForHydration(page);
    expect(pageErrors.map((e) => e.message)).toEqual([]);
  });

  test("hydrates without errors with motion enabled", async ({ page, pageErrors }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en");
    await waitForHydration(page);
    expect(pageErrors.map((e) => e.message)).toEqual([]);
  });
});

test.describe("auto-advancing industry rail (homepage)", () => {
  test("advances to the next card after AUTO_MS while in view", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.clock.install();
    await page.goto("/en");
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
    await page.goto("/en");
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
    await page.goto("/en");
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
    await page.goto("/en");
    await scrollElementTo(page, rail(page), 200);
    await card(page, 2).getByRole("link").dispatchEvent("click");
    await expect(isOpen(page, 2)).toBeVisible();
    await expect(page).toHaveURL(/[/]en$/);
  });
});

test.describe("blog article layout (no sticky rail)", () => {
  // The legacy sticky "About Infoline" rail was removed with the Figma article
  // redesign (the approved design has no sidebar). The article is now a single
  // centred story card followed by the related-articles row.
  test("has no sticky rail; the story card is centred and related articles stay reachable", async ({
    page,
  }) => {
    const [first, second, third] = messages.en.Blog.posts;
    await page.goto(`/en/blog/${first.slug}`);
    await waitForStableStyle(page.locator("main").locator("xpath=.."));

    // The legacy sticky rail is gone.
    await expect(page.locator("main aside")).toHaveCount(0);

    // The story card carries the lead paragraph and sits centred, within the 1062px design width.
    const lead = page.getByText(first.body[0], { exact: true });
    await expect(lead).toBeVisible();
    const card = lead.locator("xpath=ancestor::div[contains(@class, 'rounded-[20px]')][1]");
    const box = (await card.boundingBox())!;
    const viewportWidth = page.viewportSize()!.width;
    expect(box.width).toBeLessThanOrEqual(1062);
    expect(Math.abs(box.x + box.width / 2 - viewportWidth / 2)).toBeLessThan(24);

    // Related articles (the next two posts) remain reachable below the story card.
    for (const post of [second, third]) {
      const link = page.locator(`main a[href="/en/blog/${post.slug}"]`).first();
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeVisible();
    }
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
