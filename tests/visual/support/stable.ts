import type { Locator, Page } from "@playwright/test";
import { waitForHydration } from "../../e2e/support/fixtures";
import { waitForAnimationsSettled, waitForStableStyle } from "../../e2e/support/motion";

/**
 * Bring a page to a settled, capture-ready state. Every wait is on an
 * observable condition (no sleeps):
 *  1. hydrated (React fiber on the footer),
 *  2. every webfont face the page requested has loaded (`document.fonts.ready`
 *     plus no face left in "loading"),
 *  3. every <img> inside `root` is complete and decoded,
 *  4. finite Web Animations in `root` finished and transform/opacity/filter of
 *     each animated descendant stable for 3 frames (framer's rAF animations).
 */
export async function settle(page: Page, root: Locator) {
  await waitForHydration(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts];
    await Promise.all(faces.filter((f) => f.status === "loading").map((f) => f.loaded.catch(() => undefined)));
  });
  await root.evaluate(async (el) => {
    const images = [...el.querySelectorAll("img")];
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) await new Promise((r) => img.addEventListener("load", r, { once: true }));
        await img.decode().catch(() => undefined);
      }),
    );
  });
  await waitForAnimationsSettled(root);
  const animated = root.locator("[style*='opacity'], [style*='transform'], [style*='filter']");
  for (const item of await animated.all()) {
    await waitForStableStyle(item, ["transform", "opacity", "filter"]);
  }
}

/**
 * The Figma Hero node excludes the site header and the custom cursor (separate
 * layers above it), so hide both before capturing the section.
 */
export async function hideOverlays(page: Page) {
  await page.addStyleTag({
    content: "header, .cursor-root { visibility: hidden !important; }",
  });
}

export type PlatformFont = { familyName: string; postScriptName: string; isCustomFont: boolean; glyphCount: number };

/**
 * Fonts Chromium actually used to draw an element's text (DevTools protocol).
 * This is the rendered face, not the CSS `font-family` request, so a silent
 * fallback to a system font shows up here.
 */
export async function renderedFonts(page: Page, locator: Locator): Promise<PlatformFont[]> {
  const marker = `qa-font-${Math.random().toString(36).slice(2)}`;
  await locator.evaluate((el, m) => el.setAttribute("data-qa-font", m), marker);
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: `[data-qa-font="${marker}"]`,
    });
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    return fonts as PlatformFont[];
  } finally {
    await locator.evaluate((el) => el.removeAttribute("data-qa-font"));
    await cdp.detach();
  }
}
