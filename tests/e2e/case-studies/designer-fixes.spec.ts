import type { Locator, Page } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { messages, locales, dirFor, type Locale } from "../support/messages";
import { scrollElementTo } from "../support/motion";

/**
 * Case Studies › Designer review #8 (Figma 406:4321): English weights, hero /
 * band colours, results card radius, the contact band's video fill, and result
 * counters that never strand a zero (reduced motion, print).
 */

const VIDEO_SRC = "/videos/4779866-hd_1920_1080_30fps.mp4";
const rgb = {
  brandblue300: "rgb(116, 192, 231)", // #74C0E7
  slate100: "rgb(207, 216, 220)", // #CFD8DC
  slate400: "rgb(120, 144, 156)", // #78909C
  e3: "rgb(227, 227, 227)", // #E3E3E3
  brandblue500: "rgb(28, 151, 212)", // #1C97D4
};

const copy = (locale: Locale) => messages[locale].CaseStudiesPage;
const hero = (page: Page) => page.locator("main > section").first();
const band = (page: Page) => page.locator("main > section").last();
const heroFigures = (page: Page) => hero(page).locator("li span").filter({ hasText: /\d/ }).first();
const resultFigures = (page: Page) => page.locator("main article ul > li > div > span");
const finalValues = (locale: Locale) => ({
  hero: copy(locale).hero.movement.map((m) => m.value),
  results: copy(locale).chapters.flatMap((c) => c.results.map((r) => r.value)),
});

async function css(locator: Locator, prop: string) {
  return locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
}

test.describe("Case Studies › typography and colour", () => {
  for (const locale of locales) {
    test(`${locale}: weights follow Figma in English and stay unchanged in Arabic`, async ({ page }) => {
      await page.goto(`/${locale}/case-studies`);
      await waitForHydration(page);
      const t = copy(locale);
      const en = locale === "en";

      const eyebrow = hero(page).getByText(t.hero.eyebrow, { exact: true });
      const movementLabel = hero(page).getByText(t.hero.movementLabel, { exact: true });
      const bandHeading = band(page).getByRole("heading", { name: t.cta.title });

      // English: Figma tokens. Arabic: the pre-fix Tajawal weights (pending decision).
      expect(await css(page.locator("main h1"), "font-weight")).toBe(en ? "800" : "700");
      expect(await css(eyebrow, "font-weight")).toBe(en ? "500" : "400");
      expect(await css(movementLabel, "font-weight")).toBe(en ? "500" : "400");
      expect(await css(heroFigures(page), "font-weight")).toBe(en ? "900" : "700");
      expect(await css(resultFigures(page).first(), "font-weight")).toBe(en ? "900" : "700");
      expect(await css(bandHeading, "font-weight")).toBe(en ? "800" : "600");

      // Colours are locale-independent.
      expect(await css(eyebrow, "color")).toBe(rgb.brandblue300);
      expect(await css(heroFigures(page), "color")).toBe(rgb.brandblue300);
      expect(await css(hero(page).getByText(t.hero.movement[0].title, { exact: true }), "color")).toBe(rgb.slate100);
      expect(await css(hero(page).getByText(t.hero.movement[0].subtitle, { exact: true }), "color")).toBe(rgb.slate400);
      expect(await css(hero(page).getByText(t.hero.description, { exact: true }), "color")).toBe(rgb.slate100);
      expect(await css(band(page).getByText(t.cta.description, { exact: true }), "color")).toBe(rgb.e3);
      expect(await css(resultFigures(page).first(), "color")).toBe(rgb.brandblue500);
    });
  }

  test("results cards: 16px radius on the #FAFAFA fill, padding unchanged", async ({ page }) => {
    await page.goto("/en/case-studies");
    await waitForHydration(page);
    const cards = page.locator("main article ul");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS("border-radius", "16px");
      await expect(card).toHaveCSS("background-color", "rgb(250, 250, 250)");
      await expect(card).toHaveCSS("padding", "16px");
    }
  });
});

test.describe("Case Studies › result counters", () => {
  for (const locale of locales) {
    test(`${locale}: reduced motion shows every final value immediately`, async ({ page }) => {
      await page.goto(`/${locale}/case-studies`);
      await waitForHydration(page);
      const expected = finalValues(locale);
      // Read without scrolling: offscreen counters must not have been reset to zero.
      await expect(resultFigures(page)).toHaveText(expected.results);
      await expect(hero(page).locator("li span").filter({ hasText: /\d/ })).toHaveText(expected.hero);
    });
  }

  test.describe("normal motion", () => {
    test.use({ reducedMotion: "no-preference" });

    test("en: unseen counters print their final values; counting still runs on view", async ({ page }) => {
      await page.goto("/en/case-studies");
      await waitForHydration(page);
      const expected = finalValues("en").results;
      const last = resultFigures(page).last();

      // Offscreen counters sit at their zero start until they are viewed.
      await expect(last).toHaveText("0");

      await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
      await expect(resultFigures(page)).toHaveText(expected);

      // Normal count-up behaviour is preserved and lands on the same values.
      await scrollElementTo(page, last, 300);
      await expect(last).toHaveText(expected.at(-1)!);
    });
  });
});

test.describe("Case Studies › contact band video", () => {
  test.describe("reduced motion", () => {
    for (const locale of locales) {
      test(`${locale}: no video mounts; still at 30% under the tint and fade`, async ({ page }) => {
        await page.goto(`/${locale}/case-studies`);
        await waitForHydration(page);
        await expect(page.locator("video[data-testid=case-studies-cta-video]")).toHaveCount(0);
        const backdrop = band(page).locator("[aria-hidden=true].pointer-events-none").first();
        await expect(backdrop.locator("img")).toHaveCSS("opacity", "0.3");
        // Tailwind v4 emits the tint via color-mix (computed as lab()); read it back as sRGB.
        const [r, g, b, a] = await backdrop.locator(":scope > div").nth(1).evaluate((el) => {
          const ctx = document.createElement("canvas").getContext("2d")!;
          ctx.fillStyle = getComputedStyle(el).backgroundColor;
          ctx.fillRect(0, 0, 1, 1);
          return Array.from(ctx.getImageData(0, 0, 1, 1).data);
        });
        for (const [got, want] of [[r, 28], [g, 151], [b, 212], [a, Math.round(0.16 * 255)]]) {
          expect(Math.abs(got - want)).toBeLessThanOrEqual(3);
        }
        expect(await css(backdrop.locator(":scope > div").nth(2), "background-image")).toMatch(
          /linear-gradient\(.*rgba\(0, 0, 0, 0\).*rgb\(0, 0, 0\)/,
        );
      });
    }
  });

  test.describe("normal motion", () => {
    test.use({ reducedMotion: "no-preference" });

    for (const locale of locales) {
      test(`${locale}: muted loop at 30%, plays in view, pauses offscreen`, async ({ page }) => {
        await page.goto(`/${locale}/case-studies`);
        await waitForHydration(page);
        await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
        const video = page.locator("video[data-testid=case-studies-cta-video]");
        await expect(video).toHaveCount(1);
        await expect(video).toHaveJSProperty("muted", true);
        await expect(video).toHaveJSProperty("loop", true);
        await expect(video).toHaveJSProperty("playsInline", true);
        await expect(video).toHaveCSS("opacity", "0.3");
        await expect(video.locator("source")).toHaveAttribute("src", VIDEO_SRC);
        await expect(video).toHaveJSProperty("paused", true);

        await scrollElementTo(page, band(page), 200);
        // The harness blocks .mp4 requests (support/network.ts), so assert play intent.
        await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);

        await page.evaluate(() => window.scrollTo(0, 0));
        await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
      });
    }
  });
});

test.describe("Case Studies › responsive", () => {
  for (const width of [1440, 768, 390]) {
    for (const locale of locales) {
      test(`${locale} @${width}px: no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/case-studies`);
        await waitForHydration(page);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBe(0);
      });
    }
  }
});
