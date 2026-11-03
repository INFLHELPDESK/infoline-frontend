import type { Page } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { scrollToY, setMotionPreference } from "../support/motion";

/**
 * components/sections/industries/sectors.tsx: each sector card tilts around its
 * horizontal axis as it scrolls in (scroll-linked, framer `useScroll`) and
 * settles flat once it pins. Simpler layouts (below lg) and reduced motion get
 * no 3D tilt.
 */

/** rotateX (deg) of the card face (`article > div`) for sector `index`. */
const tilt = (page: Page, index: number) =>
  page.evaluate((i) => {
    const el = document.querySelectorAll("article[id^='sec-'] > div")[i] as HTMLElement;
    const t = getComputedStyle(el).transform;
    if (t === "none") return 0;
    const m = new DOMMatrixReadOnly(t);
    return Math.round((Math.atan2(m.m23, m.m22) * 180) / Math.PI * 10) / 10;
  }, index);

const cardTop = (page: Page, index: number) =>
  page.evaluate(
    (i) =>
      document.querySelectorAll("article[id^='sec-']")[i].getBoundingClientRect().top +
      window.scrollY,
    index,
  );

for (const locale of ["en", "ar"]) {
  test(`${locale} / desktop: cards tilt with scroll progress and settle flat`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setMotionPreference(page, "no-preference");
    await page.goto(`/${locale}/industries`);
    await waitForHydration(page);

    const top = await cardTop(page, 1);
    // Card 2's top edge sits 700px, then 400px, below the viewport top, then pinned.
    await scrollToY(page, top - 880);
    const early = await tilt(page, 1);
    await scrollToY(page, top - 500);
    const mid = await tilt(page, 1);
    await scrollToY(page, top - 104);
    const pinned = await tilt(page, 1);

    expect(early).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(0.5);
    expect(pinned).toBe(0);

    // Scroll-linked: scrolling back unwinds the tilt.
    await scrollToY(page, top - 500);
    expect(await tilt(page, 1)).toBeCloseTo(mid, 0);
  });

  test(`${locale} / desktop: sticky stacking keeps the pin line`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/industries`);
    await waitForHydration(page);
    const top = await cardTop(page, 2);
    await scrollToY(page, top + 150);
    const pinned = await page
      .locator("article[id^='sec-']")
      .nth(2)
      .evaluate((el) => Math.round(el.getBoundingClientRect().top));
    expect(pinned).toBe(104);
  });

  test(`${locale} / reduced motion: no tilt, content visible`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setMotionPreference(page, "reduce");
    await page.goto(`/${locale}/industries`);
    await waitForHydration(page);
    const top = await cardTop(page, 1);
    await scrollToY(page, top - 500);
    expect(await tilt(page, 1)).toBe(0);
    await expect(page.locator("article[id^='sec-']").nth(1).locator("h3")).toBeVisible();
  });

  // Sample where the exit scale is active: the stack has released and card 1 has
  // scrolled partly out of view (not the start of the stack).
  const exitState = async (page: Page) => {
    const end = await page.evaluate(() => {
      const last = [...document.querySelectorAll("article[id^='sec-']")].pop()!;
      return last.parentElement!.getBoundingClientRect().bottom + window.scrollY;
    });
    await scrollToY(page, end - 300);
    return page.evaluate(() =>
      [...document.querySelectorAll("article[id^='sec-']")].map((a) => {
        const cs = getComputedStyle(a);
        return { name: cs.animationName, transform: cs.transform };
      }),
    );
  };

  test(`${locale} / reduced motion: stack exit scaling is off at the end of the stack`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setMotionPreference(page, "reduce");
    await page.goto(`/${locale}/industries`);
    await waitForHydration(page);
    const state = await exitState(page);
    expect(state).toHaveLength(6);
    for (const s of state) {
      expect(s.name).toBe("none");
      expect(s.transform).toBe("none");
    }
    for (let i = 0; i < 6; i++) expect(await tilt(page, i)).toBe(0);
    await expect(page.locator("article[id^='sec-'] h3")).toHaveCount(6);
    for (const h of await page.locator("article[id^='sec-'] h3").all()) await expect(h).toBeVisible();
  });

  test(`${locale} / normal motion: stack exit still scales cards down`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setMotionPreference(page, "no-preference");
    await page.goto(`/${locale}/industries`);
    await waitForHydration(page);
    const state = await exitState(page);
    for (const s of state) {
      expect(s.name).toBe("stack-recede");
      expect(parseFloat(s.transform.replace("matrix(", ""))).toBeLessThan(0.99);
    }
  });

  test(`${locale} / mobile: no tilt and no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/industries`);
    await waitForHydration(page);
    const top = await cardTop(page, 1);
    await scrollToY(page, top - 500);
    expect(await tilt(page, 1)).toBe(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}

test("en / desktop: Industries card and hero styling matches the approved values", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/industries");
  await waitForHydration(page);

  const hero = await page.evaluate(() => {
    const cs = (el: Element) => getComputedStyle(el);
    const h1 = document.querySelector("main h1")!;
    const eyebrow = h1.parentElement!.querySelector("span")!;
    return {
      eyebrowText: eyebrow.textContent,
      eyebrow: [cs(eyebrow).fontSize, cs(eyebrow).lineHeight, cs(eyebrow).fontWeight, cs(eyebrow).color, cs(eyebrow).letterSpacing],
      h1: [cs(h1).fontSize, cs(h1).lineHeight, cs(h1).fontWeight],
    };
  });
  expect(hero.eyebrowText).toBe("Industries");
  expect(hero.eyebrow).toEqual(["13px", "16px", "500", "rgb(116, 192, 231)", "1.5px"]);
  expect(hero.h1).toEqual(["48px", "56px", "800"]);

  const card = await page.evaluate(() => {
    const art = document.querySelector("article[id^='sec-']")!;
    const cs = (el: Element) => getComputedStyle(el);
    const face = art.firstElementChild!;
    const title = art.querySelector("h3")!;
    const cta = art.querySelector("a")!;
    return {
      width: Math.round(face.getBoundingClientRect().width),
      radius: [cs(face).borderRadius, cs(art.querySelector("img")!).borderRadius, cs(cta).borderRadius],
      title: [cs(title).fontSize, cs(title).lineHeight, cs(title).fontWeight],
      icon: cs(cta.querySelector("svg")!).width,
    };
  });
  expect(card.radius).toEqual(["16px", "12px", "8px"]);
  expect(card.title).toEqual(["28px", "36px", "900"]);
  expect(card.icon).toBe("20px");
  expect(card.width).toBeGreaterThanOrEqual(1270);
  expect(card.width).toBeLessThanOrEqual(1285);
});
