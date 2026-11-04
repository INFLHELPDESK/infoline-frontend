import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../e2e/support/fixtures";
import { setMotionPreference } from "../e2e/support/motion";
import { type Locale } from "../e2e/support/messages";
import { compareImages } from "./support/compare";
import { INK_THRESHOLD, inkGeometryMatches, measureInk } from "./support/ink";
import { qaLedger, within } from "./support/qa";
import { hexToRgb, loadReferences } from "./support/reference";
import { hideOverlays, settle } from "./support/stable";

/**
 * About Hero (components/sections/about/hero.tsx) against Figma 406:3444,
 * Designer finding #1 of Infoline-09-About-Page.pdf (video treatment, overlay,
 * glow, skyline). The Hero copy/eyebrow are approved and not under test here.
 *
 * Expected values are read from the cached Figma node boxes
 * (406:3445 Video-BG, 406:3446 Glow, 406:3452/3454 skyline) and the design
 * context (overlay colour/alpha/blend, glow gradient, blur). Gate B ratios are
 * advisory; verdicts come from predefined constraints (Gate A, ink geometry).
 *
 * IDs: AH1 video, AH2 overlay, AH3 no extra gradient, AH4 glow, AH5 skyline.
 */

const ref = loadReferences("about-hero");
const FRAME = { width: 1440, height: 1080 }; // reference viewport; Hero node is 1440×755
const HERO_H = ref.node("406:3444").height;
const GEO = 2; // px

const css = (el: Locator, prop: string) => el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);

function parts(page: Page) {
  const section = page.locator("main > section").first();
  return {
    section,
    video: section.getByTestId("about-hero-video").or(section.locator("video")).first(),
    // DOM order contract: video box → (overlay inside it, or sibling) → glow → skyline → copy.
    glow: section.locator("[data-testid=about-hero-glow]"),
    skyline: section.locator("[data-testid=about-hero-skyline]"),
    h1: section.locator("h1"),
  };
}

async function rectIn(section: Locator, el: Locator) {
  const s = await section.boundingBox();
  const e = await el.boundingBox();
  if (!s || !e) throw new Error("not rendered");
  const r = (n: number) => Math.round(n * 10) / 10;
  return { x: r(e.x - s.x), y: r(e.y - s.y), width: r(e.width), height: r(e.height) };
}

async function open(page: Page, locale: Locale, viewport: { width: number; height: number }, motion: "reduce" | "no-preference" = "reduce", video = false) {
  // The e2e network guard aborts every .webm/.mp4 (see tests/e2e/support/network.ts);
  // a page-level route wins over the context-level one, so video tests opt back in.
  if (video) await page.route(/flying-birds\.webm(\?.*)?$/, (route) => route.continue());
  await setMotionPreference(page, motion);
  await page.setViewportSize(viewport);
  await page.goto(`/${locale}/about`);
  const p = parts(page);
  await settle(page, p.section);
  return p;
}

/** The layer that paints the Figma overlay: the only element over the video with a blend mode. */
async function overlayInfo(section: Locator) {
  return section.evaluate((root) => {
    const video = root.querySelector("video")!;
    const vr = video.getBoundingClientRect();
    const found = [...root.querySelectorAll<HTMLElement>("*")].filter((n) => {
      const cs = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      const coversVideo = Math.abs(r.width - vr.width) < 2 && Math.abs(r.height - vr.height) < 2 && Math.abs(r.x - vr.x) < 2 && Math.abs(r.y - vr.y) < 2;
      return n !== video && coversVideo && cs.position === "absolute" && cs.backgroundColor !== "rgba(0, 0, 0, 0)";
    });
    return found.map((n) => {
      const cs = getComputedStyle(n);
      return { bg: cs.backgroundColor, blend: cs.mixBlendMode, image: cs.backgroundImage };
    });
  });
}

/** Absolutely positioned layers that paint a linear-gradient across the whole Hero (the reported extra ink fade). */
async function fullHeroGradients(section: Locator) {
  return section.evaluate((root) => {
    const sr = root.getBoundingClientRect();
    return [...root.querySelectorAll<HTMLElement>("*")]
      .filter((n) => {
        const cs = getComputedStyle(n);
        if (!cs.backgroundImage.includes("linear-gradient")) return false;
        const r = n.getBoundingClientRect();
        return r.width >= sr.width * 0.9 && r.height >= sr.height * 0.9;
      })
      .map((n) => getComputedStyle(n).backgroundImage.slice(0, 80));
  });
}

test.describe("Gate A — layer composition vs Figma 406:3444", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`${locale.toUpperCase()} 1440 — video, overlay, glow, skyline`, async ({ page }, testInfo) => {
      const p = await open(page, locale, FRAME);
      const qa = qaLedger(testInfo, locale, "1440×1080");

      // Section frame.
      qa.match({ id: "AH0.1", title: "Hero height (Figma 755)", category: "layout" },
        (await rectIn(p.section, p.section)).height, HERO_H, within(GEO));
      qa.match({ id: "AH0.2", title: "Hero background #0d161b", category: "colour" },
        await css(p.section, "background-color"), hexToRgb("#0d161b"));

      // AH1 — video at full opacity before compositing, in the Video-BG box.
      const vbg = ref.node("406:3445");
      const video = await rectIn(p.section, p.video.locator("xpath=.."));
      qa.match({ id: "AH1.1", title: "Video opacity (Figma: 100% before the overlay)", category: "visual" },
        await css(p.video, "opacity"), "1");
      qa.match({ id: "AH1.2", title: "Video-BG box x/y/w/h (406:3445)", category: "layout" },
        `${video.x},${video.y},${video.width},${video.height}`, `${vbg.x},${vbg.y},${vbg.width},${vbg.height}`,
        (a, e) => a.split(",").every((v, i) => Math.abs(Number(v) - Number(e.split(",")[i])) <= GEO));
      qa.match({ id: "AH1.3", title: "Video object-fit cover", category: "visual" }, await css(p.video, "object-fit"), "cover");

      // AH2 — exactly one overlay: rgba(13,22,27,0.9), colour-burn.
      const overlays = await overlayInfo(p.section);
      qa.match({ id: "AH2.1", title: "Exactly one tinted layer over the video", category: "visual" }, overlays.length, 1);
      qa.match({ id: "AH2.2", title: "Overlay colour rgba(13,22,27,0.9)", category: "colour" },
        overlays[0]?.bg ?? "none", "rgba(13, 22, 27, 0.9)");
      qa.match({ id: "AH2.3", title: "Overlay blend mode (Figma: color-burn)", category: "visual" },
        overlays[0]?.blend ?? "none", "color-burn");

      // AH3 — no extra top-to-bottom ink gradient across the Hero.
      qa.match({ id: "AH3", title: "No full-Hero linear-gradient layer (absent in Figma)", category: "visual" },
        JSON.stringify(await fullHeroGradients(p.section)), "[]");

      // AH4 — glow: 618px, brand blue rgba(28,151,212,0.3), 12px blur, top -103, centred.
      const gnode = ref.node("406:3446");
      const glow = await rectIn(p.section, p.glow);
      qa.match({ id: "AH4.1", title: "Glow diameter (406:3446 = 618)", category: "layout" }, glow.width, gnode.width, within(GEO));
      qa.match({ id: "AH4.2", title: "Glow top / centre-x", category: "layout" },
        `${glow.y}|${glow.x + glow.width / 2}`, `${gnode.y}|${gnode.x + gnode.width / 2}`,
        (a, e) => a.split("|").every((v, i) => Math.abs(Number(v) - Number(e.split("|")[i])) <= GEO));
      qa.match({ id: "AH4.3", title: "Glow blur (12px)", category: "visual" }, await css(p.glow, "filter"), "blur(12px)");
      const gradient = await css(p.glow, "background-image");
      qa.match({ id: "AH4.4", title: "Glow colour rgba(28,151,212,0.3) → transparent (brand blue)", category: "colour" },
        gradient.includes("rgba(28, 151, 212, 0.3)") && /rgba\(28, 151, 212, 0\)/.test(gradient), true);
      qa.match({ id: "AH4.5", title: "Glow gradient fades out at 68% of the 437px Figma radius (≈297px)", category: "visual" },
        Number(/(\d+(?:\.\d+)?)px\)?$/.exec(gradient.replace(/\)\s*$/, "").trim())?.[1] ?? NaN) > 0 &&
          Math.abs(Number(/rgba\(28, 151, 212, 0\)\s+([\d.]+)px/.exec(gradient)?.[1] ?? NaN) - 297) <= 2, true);

      // AH5 — skyline: masked box at (-9,123) 1447.5×692.5, extending past the Hero bottom.
      const sky = ref.node("406:3452");
      const box = await rectIn(p.section, p.skyline);
      qa.match({ id: "AH5.1", title: "Skyline mask box x/y/w/h (406:3452)", category: "layout" },
        `${box.x},${box.y},${box.width},${box.height}`, `${sky.x},${sky.y},${sky.width},${sky.height}`,
        (a, e) => a.split(",").every((v, i) => Math.abs(Number(v) - Number(e.split(",")[i])) <= GEO));
      qa.match({ id: "AH5.2", title: "Skyline extends below the Hero boundary (no inner cut)", category: "layout" },
        box.y + box.height > HERO_H, true);
      qa.match({ id: "AH5.3", title: "Hero clips the skyline (overflow hidden)", category: "layout" },
        await css(p.section, "overflow-y"), "hidden");

      await qa.attach();
    });
  }
});

test.describe("Gate B — Figma PNG vs browser (visual evidence)", () => {
  test("EN 1440 — Hero capture vs Figma 406:3444", async ({ page, browser }, testInfo) => {
    const p = await open(page, "en", FRAME, "reduce", true);
    await p.video.evaluate((v: HTMLVideoElement) => v.readyState >= 2 || new Promise((r) => v.addEventListener("loadeddata", () => r(true), { once: true })));
    await hideOverlays(page);
    const qa = qaLedger(testInfo, "en", "1440×1080");
    const shot = ref.screenshot("en")!;
    const reference = readFileSync(shot.path);
    const actual = await p.section.screenshot({ animations: "disabled" });
    await testInfo.attach("figma-reference.png", { body: reference, contentType: "image/png" });
    await testInfo.attach("browser-actual.png", { body: actual, contentType: "image/png" });

    // Self-compare control: the reference against itself must score exactly 0.
    const self = await compareImages(browser, reference, reference, []);
    qa.match({ id: "AHB.0", title: "Self-compare (reference vs itself) mismatch = 0", category: "visual" }, self.mismatchRatio, 0);

    const regions = [
      { name: "Hero", x: 0, y: 0, width: 1440, height: HERO_H },
      { name: "Glow area", x: 411, y: 0, width: 618, height: 415 },
      { name: "Skyline band", x: 0, y: 340, width: 1440, height: HERO_H - 340 },
    ];
    const cmp = await compareImages(browser, reference, actual, regions);
    await testInfo.attach("diff.png", { body: cmp.diffPng, contentType: "image/png" });
    await testInfo.attach("overlay.png", { body: cmp.overlayPng, contentType: "image/png" });
    // Dated evidence for the QA report (opt-in; never writes under tests/visual/figma).
    if (process.env.QA_EVIDENCE_DIR) {
      mkdirSync(process.env.QA_EVIDENCE_DIR, { recursive: true });
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/browser-actual.png`, actual);
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/diff.png`, cmp.diffPng);
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/overlay.png`, cmp.overlayPng);
    }
    qa.match({ id: "AHB.1", title: "Capture size equals Figma frame", category: "visual" },
      `${cmp.actualSize.width}×${cmp.actualSize.height}`, `${cmp.referenceSize.width}×${cmp.referenceSize.height}`);
    for (const r of cmp.regions) {
      qa.advisory({ id: `AHB.2.${r.name}`, title: `Pixel mismatch — ${r.name}`, category: "visual",
        note: "Evidence only: video frame and anti-aliasing differ; verdicts come from the constraints below." },
        `${(r.mismatchRatio * 100).toFixed(2)}%`);
    }

    // Skyline ink geometry (constraint fixed before measuring): bbox + visible area of the
    // drawn pixels in the lower band, Figma crop vs build crop.
    const band = { x: 0, y: 340, width: 1440, height: HERO_H - 340 };
    const ink = await measureInk(browser, reference, actual, [band], [band]);
    const geo = inkGeometryMatches(ink.act[0], ink.ref[0]);
    qa.match({ id: "AHB.3", title: "Skyline ink bounding box (size within max(2px,5%), centre within 2px)", category: "visual" },
      geo.ok ? "match" : geo.detail, "match");
    const area = ink.act[0].pixels / ink.ref[0].pixels;
    qa.match({ id: "AHB.4", title: `Skyline visible area vs Figma (${ink.act[0].pixels} / ${ink.ref[0].pixels} px)`, category: "visual" },
      Math.abs(area - 1) <= 0.05, true);

    // The skyline must reach the Hero's bottom edge with no horizontal cut: the last
    // 3 rows of the section are drawn across the full width, as in Figma.
    const strip = { x: 0, y: HERO_H - 3, width: 1440, height: 3 };
    const edge = await measureInk(browser, reference, actual, [strip], [strip]);
    qa.match({ id: "AHB.5", title: "Bottom edge fully covered by the skyline photo (ink width)", category: "visual" },
      Math.abs(edge.act[0].width - edge.ref[0].width) <= 2, true);
    void INK_THRESHOLD;

    await qa.attach();
  });
});

test.describe("Responsive, RTL and motion", () => {
  const viewports = [
    { width: 1440, height: 1080 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ];
  for (const locale of ["en", "ar"] as const) {
    for (const vp of viewports) {
      test(`${locale.toUpperCase()} ${vp.width}×${vp.height} — no overflow, centred glow, skyline bottom-anchored`, async ({ page }, testInfo) => {
        const p = await open(page, locale, vp);
        const qa = qaLedger(testInfo, locale, `${vp.width}×${vp.height}`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        qa.match({ id: "AHR.1", title: "No horizontal overflow", category: "responsive" }, overflow <= 0, true);
        const g = await rectIn(p.section, p.glow);
        qa.match({ id: "AHR.2", title: "Glow centred on the Hero (RTL-neutral)", category: "rtl" },
          Math.abs(g.x + g.width / 2 - vp.width / 2) <= GEO, true);
        const s = await rectIn(p.section, p.skyline);
        const h = (await rectIn(p.section, p.section)).height;
        // Figma's own mask box ends at x = -9 + 1447.5 = 1438.5 on the 1440 frame (a 1.5px gap), scaled by --u.
        const figmaGap = (ref.node("406:3444").width - (ref.node("406:3452").x + ref.node("406:3452").width)) * (s.width / ref.node("406:3452").width);
        qa.match({ id: "AHR.3", title: "Skyline reaches and passes the Hero bottom edge", category: "layout" },
          s.y + s.height >= h, true);
        qa.match({ id: "AHR.4", title: "Skyline spans the full Hero width", category: "layout" },
          s.x <= 0 && s.x + s.width >= vp.width - figmaGap - 0.5, true);
        if (vp.width !== 1440) {
          qa.unavailable({ id: "AHR.5", title: "Figma frame at this width", category: "responsive",
            note: "Only 1440 frames exist; scale/floor choice is a designer-confirmation item." });
        }
        qa.match({ id: "AHR.6", title: "Document direction", category: "rtl" },
          await page.evaluate(() => document.documentElement.dir), locale === "ar" ? "rtl" : "ltr");
        await qa.attach();
      });
    }
  }

  test("reduced motion — video never plays and the first frame is the static fallback", async ({ page }, testInfo) => {
    const p = await open(page, "en", FRAME, "reduce", true);
    const qa = qaLedger(testInfo, "en", "1440×1080");
    await expect.poll(() => p.video.evaluate((v: HTMLVideoElement) => v.readyState), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await page.waitForTimeout(800); // a negative assertion needs time to be meaningful
    const state = await p.video.evaluate((v: HTMLVideoElement) => ({ paused: v.paused, t: v.currentTime }));
    qa.match({ id: "AHM.1", title: "Reduced motion: video paused, currentTime 0", category: "motion" },
      `${state.paused}@${state.t}`, "true@0");
    await qa.attach();
  });

  test("motion allowed — plays in view, pauses off-screen and resumes", async ({ page }, testInfo) => {
    const p = await open(page, "en", FRAME, "no-preference", true);
    const qa = qaLedger(testInfo, "en", "1440×1080");
    const playing = () => p.video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0);
    await expect.poll(playing, { timeout: 10_000 }).toBe(true);
    qa.match({ id: "AHM.2", title: "In view: video plays", category: "motion" }, await playing(), true);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => p.video.evaluate((v: HTMLVideoElement) => v.paused), { timeout: 10_000 }).toBe(true);
    qa.match({ id: "AHM.3", title: "Off-screen: video paused", category: "motion" },
      await p.video.evaluate((v: HTMLVideoElement) => v.paused), true);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => p.video.evaluate((v: HTMLVideoElement) => v.paused), { timeout: 10_000 }).toBe(false);
    qa.match({ id: "AHM.4", title: "Back in view: video resumes", category: "motion" },
      await p.video.evaluate((v: HTMLVideoElement) => v.paused), false);
    await qa.attach();
  });

  test("video element is muted, looping, inline and decorative", async ({ page }, testInfo) => {
    const p = await open(page, "en", FRAME);
    const qa = qaLedger(testInfo, "en", "1440×1080");
    const attrs = await p.video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, loop: v.loop, inline: v.playsInline, hidden: v.closest("[aria-hidden]") !== null }));
    qa.match({ id: "AHM.5", title: "muted + loop + playsInline + aria-hidden ancestor", category: "motion" },
      JSON.stringify(attrs), JSON.stringify({ muted: true, loop: true, inline: true, hidden: true }));
    await qa.attach();
  });
});
