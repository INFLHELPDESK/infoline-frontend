import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import type { Browser, Locator, Page } from "@playwright/test";
import { test, waitForHydration } from "../e2e/support/fixtures";
import { messages, type Locale } from "../e2e/support/messages";
import { scrollElementTo, waitForAnimationsSettled, waitForStableStyle } from "../e2e/support/motion";
import { compareImages } from "./support/compare";
import { qaLedger, within } from "./support/qa";
import { loadReferences, type Box } from "./support/reference";
import { hideOverlays } from "./support/stable";

/**
 * Insights › Content themes (components/sections/insights/themes.tsx) against
 * Figma 406:4792, scoped to its decorative BG-pattern (406:4793: grid vector
 * 406:4794 + four crosses). Designer review 2026-11-03, item 1.
 *
 * Gate A — the pattern is the original Figma SVG (served bytes = the cached
 *          export), at its Figma size and section-relative position, painted
 *          below the eyebrow, heading and cards, decorative (alt="", hidden
 *          from AT), not intercepting pointers, not mirrored in RTL, no
 *          horizontal overflow, no console or page errors.
 * Gate B — the grid is too faint for the ink threshold (support/ink.ts, YIQ
 *          0.15), so the predefined constraint here is a correlation:
 *          Pearson r of luminance between the Figma PNG and the capture over
 *          the pixels where only the pattern can show (inside the pattern box
 *          and the section, outside every content box of either image, 3px
 *          margin). Pass: the best r over shifts of ±4px is ≥ 0.8 and lies
 *          within ±2px of zero. Fixed before measuring. Negative controls (the
 *          same capture with the pattern hidden, and mirrored about the
 *          pattern's centre) must score below 0.8, or the row is advisory.
 *          The full-frame mismatch ratio is evidence only.
 *
 * Figma has one frame (EN, 1440). AR and 768/390 checks are derived from it
 * and labelled so (see the manifest's `unavailable`).
 */

const ref = loadReferences("insights-themes");
const TOL = 2;
const R_MIN = 0.8;
const PHASE = process.env.VISUAL_PHASE ?? "run";

const FRAME = ref.node("406:4792"); // 1440 × 459, origin 0,0
const PATTERN = ref.node("406:4793"); // 338, −18, 744.545 × 520
// Crosses, pattern-local. The metadata gives them section-relative (see the
// manifest note; e.g. Group 17 x=462 = SVG x 124 + 338), but node() nests
// them under the pattern, so subtract the pattern origin twice.
const CROSSES = (["406:4795", "406:4798", "406:4801", "406:4804"] as const).map((id) => {
  const b = ref.node(id);
  return { ...b, x: b.x - 2 * PATTERN.x, y: b.y - 2 * PATTERN.y };
});
// Opaque content painted above the pattern in Figma (eyebrow pill, 4 cards) and the heading text box.
const FIGMA_OPAQUE: Box[] = ["406:4807", "406:4810", "406:4818", "406:4826", "406:4834"].map((id) => ref.node(id));
const FIGMA_CONTENT: Box[] = [...FIGMA_OPAQUE, ref.node("406:4808")];
const PATTERN_OFFSET_FROM_CENTRE = PATTERN.x + PATTERN.width / 2 - FRAME.width / 2; // −9.73
const assetRef = ref.manifest.references.find((r) => r.kind === "asset")!;

const VIEWPORTS = [
  { width: 1440, height: 1080 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

const section = (page: Page, locale: Locale) =>
  page.locator("main > section", { has: page.getByRole("heading", { level: 2, name: messages[locale].InsightsPage.themes.title, exact: true }) });
const patternImg = (s: Locator) => s.locator('img[src*="bg-pattern"]');

type Rect = { x: number; y: number; width: number; height: number };

/** Content rects (eyebrow pill, heading, cards), section-relative. */
async function contentRects(s: Locator) {
  return s.evaluate((sec) => {
    const o = sec.getBoundingClientRect();
    const rel = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.x - o.x, y: r.y - o.y, width: r.width, height: r.height };
    };
    const h2 = sec.querySelector("h2")!;
    const eyebrow = h2.previousElementSibling!;
    const cards = [...sec.querySelectorAll(".grid > *")];
    return { eyebrow: rel(eyebrow), heading: rel(h2), cards: cards.map(rel) };
  });
}

async function open(page: Page, locale: Locale, vp: { width: number; height: number }) {
  await page.setViewportSize(vp);
  await page.goto(`/${locale}/insights`);
  await waitForHydration(page);
  const s = section(page, locale);
  await scrollElementTo(page, s, 120);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction((el) => [...el!.querySelectorAll("img")].every((i) => i.complete && i.naturalWidth > 0), await s.elementHandle());
  await waitForAnimationsSettled(s);
  for (const item of await s.locator("[style*='opacity'], [style*='transform'], [style*='filter']").all()) {
    await waitForStableStyle(item, ["transform", "opacity", "filter"]);
  }
  await hideOverlays(page);
  return s;
}

/**
 * Section-aligned capture in document coordinates: FRAME-sized at 1440;
 * at narrower widths the full width, from the pattern's top overhang to its
 * bottom (evidence only).
 */
async function capture(page: Page, s: Locator, narrow = false) {
  const r = await s.evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { top: b.top + window.scrollY, width: b.width, height: b.height };
  });
  const clip = narrow
    ? { x: 0, y: r.top + PATTERN.y, width: r.width, height: Math.max(r.height, PATTERN.height) - PATTERN.y }
    : { x: 0, y: r.top, width: FRAME.width, height: FRAME.height };
  return page.screenshot({ fullPage: true, animations: "disabled", caret: "hide", clip });
}

/**
 * Pearson r of luminance over `mask` pixels, for every shift of `actual` by
 * (dx, dy) in [−4, 4]². `mirrorAbout` flips `actual` horizontally first.
 */
async function correlate(browser: Browser, reference: Buffer, actual: Buffer, exclude: Rect[], region: Rect, mirrorAbout?: number) {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    return await page.evaluate(
      async ({ refB64, actB64, exclude, region, mirrorAbout, W, H }) => {
        const lum = async (b64: string, mirror?: number) => {
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          await img.decode();
          const c = new OffscreenCanvas(W, H);
          const ctx = c.getContext("2d")!;
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, W, H);
          if (mirror !== undefined) {
            ctx.translate(2 * mirror, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(img, 0, 0);
          const d = ctx.getImageData(0, 0, W, H).data;
          const out = new Float32Array(W * H);
          for (let i = 0; i < W * H; i++) out[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
          return out;
        };
        const [f, a] = await Promise.all([lum(refB64), lum(actB64, mirrorAbout ?? undefined)]);
        const M = 4;
        const inside = (x: number, y: number, r: { x: number; y: number; width: number; height: number }, m = 0) =>
          x >= r.x - m && x < r.x + r.width + m && y >= r.y - m && y < r.y + r.height + m;
        const pts: number[] = [];
        const x0 = Math.max(M, Math.ceil(region.x)), x1 = Math.min(W - M, Math.floor(region.x + region.width));
        const y0 = Math.max(M, Math.ceil(region.y)), y1 = Math.min(H - M, Math.floor(region.y + region.height));
        for (let y = y0; y < y1; y++)
          for (let x = x0; x < x1; x++) if (!exclude.some((r) => inside(x, y, r, 3 + M))) pts.push(y * W + x);
        const r = (dx: number, dy: number) => {
          let sf = 0, sa = 0, sff = 0, saa = 0, sfa = 0;
          const off = dy * W + dx;
          for (const p of pts) {
            const u = f[p], v = a[p + off];
            sf += u; sa += v; sff += u * u; saa += v * v; sfa += u * v;
          }
          const n = pts.length;
          const cov = sfa - (sf * sa) / n, vf = sff - (sf * sf) / n, va = saa - (sa * sa) / n;
          return vf > 0 && va > 0 ? cov / Math.sqrt(vf * va) : 0;
        };
        let best = { r: -2, dx: 0, dy: 0 };
        for (let dy = -M; dy <= M; dy++)
          for (let dx = -M; dx <= M; dx++) {
            const v = r(dx, dy);
            if (v > best.r) best = { r: v, dx, dy };
          }
        return { pixels: pts.length, r0: r(0, 0), best };
      },
      { refB64: reference.toString("base64"), actB64: actual.toString("base64"), exclude, region, mirrorAbout: mirrorAbout ?? null, W: FRAME.width, H: FRAME.height },
    );
  } finally {
    await context.close();
  }
}

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

for (const locale of ["en", "ar"] as const) {
  for (const vp of VIEWPORTS) {
    test(`Insights Content themes BG-pattern — ${locale} ${vp.width}`, async ({ page, browser, consoleErrors }, testInfo) => {
      const qa = qaLedger(testInfo, locale, String(vp.width));
      const s = await open(page, locale, vp);
      const img = patternImg(s);
      const desktop = vp.width === FRAME.width;
      const derived = desktop ? "" : " (derived from the 1440 frame)";
      const rtlNote = locale === "ar" ? " AR: derived from the EN frame." : "";

      const count = await img.count();
      qa.match({ id: "BG1", title: "BG-pattern image rendered in the section", category: "assets" }, count, 1);

      if (count === 1) {
        const info = await img.evaluate((el: HTMLImageElement, sec) => {
          const o = sec!.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          const chain: { transform: string; opacity: string; filter: string; flipped: boolean }[] = [];
          for (let n: Element | null = el; n && n !== sec!.parentElement; n = n.parentElement) {
            const cs = getComputedStyle(n);
            chain.push({ transform: cs.transform, opacity: cs.opacity, filter: cs.filter, flipped: cs.transform !== "none" && new DOMMatrixReadOnly(cs.transform).a < 0 });
          }
          const cs = getComputedStyle(el);
          return {
            src: el.currentSrc || el.src,
            loaded: el.complete && el.naturalWidth > 0,
            box: { x: r.x - o.x, y: r.y - o.y, width: r.width, height: r.height },
            sectionWidth: o.width,
            chain,
            pointerEvents: cs.pointerEvents,
            alt: el.getAttribute("alt"),
            ariaHidden: el.getAttribute("aria-hidden"),
            objectFit: cs.objectFit,
          };
        }, await s.elementHandle());

        qa.match({ id: "BG1.load", title: "BG-pattern image loaded", category: "assets" }, info.loaded, true);

        // Asset identity from bytes: the served file is the cached Figma export.
        const body = await (await page.request.get(info.src)).body();
        const sha = createHash("sha256").update(body).digest("hex");
        qa.match({ id: "BG2", title: "Served SVG = original Figma export of 406:4793 (sha256)", category: "assets" }, sha, assetRef.sha256);

        // Size: Figma's own dimensions at every width (no stretching).
        qa.match({ id: "BG3.w", title: "Pattern width", category: "layout" }, round(info.box.width, 2), round(PATTERN.width, 2), within(TOL));
        qa.match({ id: "BG3.h", title: "Pattern height", category: "layout" }, round(info.box.height, 2), PATTERN.height, within(TOL));
        qa.match(
          { id: "BG3.ratio", title: "Aspect ratio preserved", category: "layout" },
          round(info.box.width / info.box.height, 3),
          round(PATTERN.width / PATTERN.height, 3),
          within(0.005),
        );

        // Position, section-relative.
        if (desktop) {
          qa.match({ id: "BG4.x", title: `Pattern x (section-relative)${rtlNote}`, category: "layout" }, round(info.box.x), PATTERN.x, within(TOL));
        } else {
          const offset = info.box.x + info.box.width / 2 - info.sectionWidth / 2;
          qa.match(
            { id: "BG4.cx", title: `Pattern centre offset from section centre${derived}`, category: "layout" },
            round(offset),
            round(PATTERN_OFFSET_FROM_CENTRE),
            within(TOL),
          );
        }
        qa.match({ id: "BG4.y", title: `Pattern y (section-relative)${derived}`, category: "layout" }, round(info.box.y), PATTERN.y, within(TOL));

        // Not mirrored / distorted, Figma node opacity (none: the SVG carries its own).
        const flipped = info.chain.filter((c) => c.flipped).length;
        qa.match({ id: "BG5", title: `Pattern not mirrored (no negative x-scale on it or its ancestors)${rtlNote}`, category: "rtl" }, flipped, 0);
        const opacity = info.chain.reduce((p, c) => p * Number(c.opacity), 1);
        qa.match({ id: "BG9.opacity", title: "Pattern effective opacity (Figma node: 1; SVG holds its own)", category: "visual" }, opacity, 1);
        qa.match({ id: "BG9.filter", title: "No filter on the pattern", category: "visual" }, info.chain.every((c) => c.filter === "none"), true);

        // Decorative.
        qa.match({ id: "BG8.alt", title: "Decorative: empty alt", category: "assets" }, info.alt, "");
        qa.match({ id: "BG8.aria", title: "Decorative: aria-hidden", category: "assets" }, info.ariaHidden, "true");
        qa.match({ id: "BG7.pe", title: "Pattern ignores pointer events", category: "layout" }, info.pointerEvents, "none");

        // Layering: with hit-testing temporarily enabled on the pattern (test
        // side), every content element must still win at its centre, and a
        // point in the section's top padding — inside the pattern box, above
        // the content wrappers — must hit the pattern (control). (Points
        // between the cards are inside transparent in-flow wrappers, which
        // correctly paint above a negative-z pattern, so they cannot be the control.)
        const rects = await contentRects(s);
        const content: Rect[] = [rects.eyebrow, rects.heading, ...rects.cards];
        const free = { x: Math.max(info.box.x, 0) + 40, y: 12 };
        const hits = await img.evaluate(
          (el: HTMLImageElement, { content, free, sec }) => {
            const o = sec!.getBoundingClientRect();
            const at = (x: number, y: number) => document.elementFromPoint(o.x + x, o.y + y);
            const before = free ? at(free.x, free.y) : null;
            el.style.pointerEvents = "auto";
            const covered = content.map((r) => at(r.x + r.width / 2, r.y + r.height / 2) !== el);
            const control = free ? at(free.x, free.y) === el : null;
            el.style.pointerEvents = "";
            return { covered, control, interceptsByDefault: before === el };
          },
          { content, free, sec: await s.elementHandle() },
        );
        qa.match({ id: "BG6.content", title: "Eyebrow, heading and cards paint above the pattern", category: "layout" }, hits.covered.every(Boolean), true);
        if (hits.control !== null) {
          qa.match({ id: "BG6.control", title: "Control: a free pattern point hits the pattern when hit-testing is on", category: "layout" }, hits.control, true);
          qa.match({ id: "BG7.hit", title: "Free pattern point does not intercept pointers", category: "layout" }, hits.interceptsByDefault, false);
        }

        // Crosses: drawn by the asset; which ones the opaque content covers must match Figma.
        const centres = CROSSES.map((c) => ({ name: c.name, x: info.box.x + c.x + c.width / 2, y: info.box.y + c.y + c.height / 2 }));
        const opaque: Rect[] = [rects.eyebrow, ...rects.cards];
        const coveredIn = (rs: Rect[], p: { x: number; y: number }) => rs.some((r) => p.x >= r.x && p.x < r.x + r.width && p.y >= r.y && p.y < r.y + r.height);
        const shown = centres.map((p) => `${p.name}: ${coveredIn(opaque, p) || p.x < 0 || p.x > info.sectionWidth ? "covered/off-screen" : "visible"}`);
        if (desktop && locale === "en") {
          const figma = CROSSES.map((c) => `${c.name}: ${coveredIn(FIGMA_OPAQUE, { x: PATTERN.x + c.x + c.width / 2, y: PATTERN.y + c.y + c.height / 2 }) ? "covered/off-screen" : "visible"}`);
          qa.match({ id: "BG10", title: `Cross marks shown/covered as in Figma${rtlNote}`, category: "visual" }, shown.join("; "), figma.join("; "));
        } else {
          // AR: the eyebrow and heading widths follow the copy, so which crosses they cover differs from EN.
          qa.unavailable({ id: "BG10", title: "Cross marks shown/covered", category: "visual", note: "No Figma frame for this locale/width; recorded for review." }, shown.join("; "));
        }
      }

      if (!desktop) {
        qa.unavailable({ id: "REF", title: `No Figma frame at ${vp.width}`, category: "responsive", note: ref.manifest.unavailable[1].reason });
      }
      if (locale === "ar") {
        qa.unavailable({ id: "REF.ar", title: "No Arabic Figma frame", category: "rtl", note: ref.manifest.unavailable[0].reason });
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      qa.match({ id: "BG11", title: "No horizontal overflow (scrollWidth − viewport)", category: "responsive" }, overflow, 0);
      qa.match({ id: "BG12", title: "No console errors", category: "content" }, consoleErrors.join(" | "), "");

      // Gate B at the reference width.
      if (desktop) {
        const reference = readFileSync(ref.screenshot("en")!.path);
        const actual = await capture(page, s);
        const rects = await contentRects(s);
        const sectionHeight = (await s.boundingBox())!.height;
        const exclude: Rect[] = [...FIGMA_CONTENT, rects.eyebrow, rects.heading, ...rects.cards];
        const region = { x: PATTERN.x, y: Math.max(0, PATTERN.y), width: PATTERN.width, height: Math.min(FRAME.height, sectionHeight, PATTERN.y + PATTERN.height) };
        const measured = await correlate(browser, reference, actual, exclude, region);
        const crossRegion = CROSSES[1]; // Group 17, the cross Figma leaves uncovered (SVG 124..150 × 150..180)
        if (crossRegion.x !== 124 || crossRegion.y !== 150) throw new Error(`cross geometry misread: ${JSON.stringify(crossRegion)}`);
        const cross = await correlate(browser, reference, actual, exclude, { x: PATTERN.x + crossRegion.x, y: PATTERN.y + crossRegion.y, width: crossRegion.width, height: crossRegion.height });

        let controls: { hidden: number; mirrored: number } | null = null;
        if ((await patternImg(s).count()) === 1) {
          const mirrored = await correlate(browser, reference, actual, exclude, region, PATTERN.x + PATTERN.width / 2);
          await patternImg(s).evaluate((el: HTMLElement) => (el.style.visibility = "hidden"));
          const hiddenShot = await capture(page, s);
          await patternImg(s).evaluate((el: HTMLElement) => (el.style.visibility = ""));
          const hidden = await correlate(browser, reference, hiddenShot, exclude, region);
          controls = { hidden: round(hidden.best.r, 3), mirrored: round(mirrored.best.r, 3) };
        }
        const discriminates = controls ? controls.hidden < R_MIN && controls.mirrored < R_MIN : true; // no pattern = nothing to control
        const verdict = (m: typeof measured) => m.best.r >= R_MIN && Math.abs(m.best.dx) <= TOL && Math.abs(m.best.dy) <= TOL;
        const detail = (m: typeof measured) => `r=${round(m.best.r, 3)} at (${m.best.dx},${m.best.dy}), r0=${round(m.r0, 3)}, n=${m.pixels}`;
        const rowB = { id: "B.pattern", title: `Pattern pixels correlate with Figma (r ≥ ${R_MIN}, peak within ±${TOL}px)${rtlNote}`, category: "visual" as const };
        const rowC = { id: "B.cross17", title: `Cross 17 pixels correlate with Figma (r ≥ ${R_MIN}, peak within ±${TOL}px)${rtlNote}`, category: "visual" as const };
        if (discriminates) {
          qa.match(rowB, detail(measured), verdict(measured) ? detail(measured) : `r ≥ ${R_MIN} at |dx|,|dy| ≤ ${TOL}`, (a, e) => a === e);
          qa.match(rowC, detail(cross), verdict(cross) ? detail(cross) : `r ≥ ${R_MIN} at |dx|,|dy| ≤ ${TOL}`, (a, e) => a === e);
        } else {
          qa.advisory({ ...rowB, note: `Controls do not discriminate: ${JSON.stringify(controls)}` }, detail(measured));
          qa.advisory({ ...rowC, note: `Controls do not discriminate: ${JSON.stringify(controls)}` }, detail(cross));
        }
        qa.advisory({ id: "B.controls", title: "Negative controls (pattern hidden / mirrored)", category: "visual", note: "Must be below r_min for B.pattern to gate." }, JSON.stringify(controls));

        const cmp = await compareImages(browser, reference, actual, [{ name: "pattern", ...region }]);
        qa.advisory(
          { id: "B.frame", title: "Frame mismatch ratio vs Figma (evidence only)", category: "visual", note: "Mixes the pre-existing card offset and text rasterisation; see overlay." },
          `${round(cmp.mismatchRatio * 100, 2)}% (pattern box ${round(cmp.regions[0].mismatchRatio * 100, 2)}%)`,
        );
        const out = (n: string) => testInfo.outputPath(n);
        writeFileSync(out(`${PHASE}.${locale}.1440.browser.png`), actual);
        writeFileSync(out(`${PHASE}.${locale}.1440.overlay-vs-figma.png`), cmp.overlayPng);
        writeFileSync(out(`${PHASE}.${locale}.1440.diff-vs-figma.png`), cmp.diffPng);
        writeFileSync(
          out(`${PHASE}.${locale}.1440.metrics.json`),
          JSON.stringify({ phase: PHASE, locale, rMin: R_MIN, region, sectionHeight, measured, cross17: cross, controls, frameMismatch: cmp.mismatchRatio, patternBoxMismatch: cmp.regions[0].mismatchRatio }, null, 2),
        );
      } else {
        writeFileSync(testInfo.outputPath(`${PHASE}.${locale}.${vp.width}.browser.png`), await capture(page, s, true));
      }

      await qa.attach();
    });
  }
}
