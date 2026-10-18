import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Deterministic helpers for motion-heavy UI. See tests/README.md for the
 * strategy. None of these sleep for a fixed duration — each waits on an
 * observable condition (scroll position, animation promises, stable frames).
 */

export type MotionPreference = "reduce" | "no-preference";

/** Switch `prefers-reduced-motion` for the current page (framer reads it live). */
export async function setMotionPreference(page: Page, preference: MotionPreference) {
  await page.emulateMedia({ reducedMotion: preference });
}

/**
 * Jump (never smooth-scroll) to an absolute scroll offset and wait until the
 * browser reports it plus two animation frames, so scroll-linked listeners
 * (framer `useScroll`, IntersectionObserver, scroll timelines) have run.
 * Returns the position actually reached (clamped to the scrollable range).
 */
export async function scrollToY(page: Page, y: number): Promise<number> {
  const reached = await page.evaluate(async (target) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const top = Math.max(0, Math.min(target, max));
    window.scrollTo({ top, behavior: "instant" });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return Math.round(window.scrollY);
  }, y);
  return reached;
}

/** Scroll so the element's top sits `offset` px below the viewport top. */
export async function scrollElementTo(page: Page, locator: Locator, offset = 0) {
  const top = await locator.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  return scrollToY(page, top - offset);
}

/**
 * Wait for every finite Web Animation (CSS transitions/animations and
 * framer's WAAPI-accelerated props) on the element and its subtree to finish.
 * Infinite animations (marquees, pings) are ignored.
 */
export async function waitForAnimationsSettled(locator: Locator) {
  await locator.evaluate(async (root) => {
    const finite = root
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
  });
}

/**
 * Wait until the given computed style properties stop changing for `frames`
 * consecutive animation frames — covers JS-driven (rAF) framer animations
 * that never appear in `getAnimations()`.
 */
export async function waitForStableStyle(
  locator: Locator,
  properties: string[] = ["transform", "opacity", "clip-path"],
  frames = 3,
) {
  await locator.evaluate(
    async (el, { properties, frames }) => {
      const read = () => {
        const cs = getComputedStyle(el);
        return properties.map((p) => cs.getPropertyValue(p)).join("|");
      };
      let last = read();
      let stable = 0;
      while (stable < frames) {
        await new Promise((r) => requestAnimationFrame(r));
        const next = read();
        stable = next === last ? stable + 1 : 0;
        last = next;
      }
    },
    { properties, frames },
  );
}

/** Viewport-relative top edge of an element, in CSS px. */
export async function viewportTop(locator: Locator) {
  return locator.evaluate((el) => el.getBoundingClientRect().top);
}

/**
 * Assert that a sticky/pinned element holds `top` px from the viewport top at
 * each of the given scroll offsets (relative to where it starts pinning).
 */
export async function expectPinnedAt(
  page: Page,
  locator: Locator,
  top: number,
  scrollOffsets: number[],
) {
  for (const y of scrollOffsets) {
    await scrollToY(page, y);
    expect(Math.round(await viewportTop(locator)), `pinned at scrollY=${y}`).toBe(top);
  }
}

/**
 * Cumulative Layout Shift recorded while `action` runs (or since navigation
 * when buffered entries exist). Shifts right after user input are excluded,
 * matching the CLS definition.
 */
export async function measureLayoutShift(page: Page, action: () => Promise<unknown>) {
  await page.evaluate(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        if (!entry.hadRecentInput) w.__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await action();
  // Layout-shift entries are delivered asynchronously; give the observer a frame.
  return page.evaluate(
    () =>
      new Promise<number>((resolve) =>
        requestAnimationFrame(() =>
          resolve((window as unknown as { __cls: number }).__cls),
        ),
      ),
  );
}
