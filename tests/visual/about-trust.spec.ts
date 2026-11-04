import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser, Locator, Page } from "@playwright/test";
import { test, waitForHydration } from "../e2e/support/fixtures";
import { setMotionPreference } from "../e2e/support/motion";
import { messages, type Locale } from "../e2e/support/messages";
import { compareImages } from "./support/compare";
import { qaLedger, within } from "./support/qa";
import { loadReferences } from "./support/reference";
import { hideOverlays, settle } from "./support/stable";

/**
 * About › Built on Trust background rings (components/sections/about/accountability.tsx)
 * against Figma 406:3363, Designer finding #2 of Infoline-09-About-Page.pdf
 * ("three complete concentric rings behind the block" vs "ring field cropped
 * and flattened").
 *
 * Gate A — exact geometry, every expected value read from the cached Figma
 *          node boxes: ring distortion, centre, radii, dot positions, coverage,
 *          stacking/pointer/a11y.
 * Gate B — the rings are faint (#ABD7ED at 0.4–1 opacity), so ink bounds prove
 *          nothing. Verdict: Pearson r of luminance between the Figma crop and
 *          the capture over the pixels where only the asset can show (outside
 *          every content box of EITHER image), best over ±4px shifts. Fixed
 *          before measuring: pass when r ≥ 0.8 at a shift within ±2px, and only
 *          if both negative controls (rings hidden; capture moved 40px down)
 *          score below 0.8. The mirrored control is reported, not gated: the
 *          rings are symmetric, so mirroring cannot discriminate them (the
 *          nine dots are the only asymmetry). Pixel mismatch is advisory.
 *
 * Section height and padding differ from the Figma frame (web 622px vs Figma
 * 802px), so the two are aligned on the eyebrow top; that is the relation
 * Figma defines (ring centre = eyebrow top + 233).
 */

const ref = loadReferences("about-trust");
const FRAME = ref.node("406:3363"); // 1439 × 1394
const EYEBROW = ref.node("406:3365");
const RINGS = ["406:3368", "406:3369", "406:3370"].map((id) => ref.node(id)); // 1132, 1384, 816
const DOTS = ["406:3380", "406:3386", "406:3392", "406:3398", "406:3404", "406:3410", "406:3416", "406:3422", "406:3428"].map((id) => ref.node(id));
const FIGMA_CONTENT = ["406:3364", "406:3365", "406:3366", "406:3367", "406:3371"].map((id) => ref.node(id));
const CENTRE = { x: RINGS[0].x + RINGS[0].width / 2, y: RINGS[0].y + RINGS[0].height / 2 }; // 720, 933
const TOL = 2;
const R_MIN = 0.8;
const PHASE = process.env.VISUAL_PHASE ?? "run";
const VIEWPORTS = [
  { width: 1440, height: 1080 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

type Rect = { x: number; y: number; width: number; height: number };
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

async function open(page: Page, locale: Locale, vp: { width: number; height: number }) {
  const copy = messages[locale].AboutPage.accountability;
  await setMotionPreference(page, "reduce");
  await page.setViewportSize(vp);
  await page.goto(`/${locale}/about`);
  await waitForHydration(page);
  const section = page.locator("main > section", { has: page.getByRole("heading", { level: 2, name: copy.title }) });
  await section.scrollIntoViewIfNeeded();
  await settle(page, section);
  await hideOverlays(page);
  return section;
}

const rings = (s: Locator) => s.locator("img").first();

/** Where the SVG's user space lands on screen: xMidYMid meet inside the img box (the SVG default). */
async function svgMap(s: Locator) {
  return s.evaluate((sec) => {
    const img = sec.querySelector("img")!;
    const o = sec.getBoundingClientRect();
    const b = img.getBoundingClientRect();
    return { src: img.currentSrc || img.src, box: { x: b.x - o.x, y: b.y - o.y, width: b.width, height: b.height }, sec: { width: o.width, height: o.height } };
  });
}

/** Parse the asset actually served: viewBox, ring circles (centre, r) and dot centres, in SVG user units. */
function parseAsset(src: string) {
  const url = new URL(src, "http://x");
  const path = url.pathname.startsWith("/_next/image") ? decodeURIComponent(url.searchParams.get("url")!) : url.pathname;
  const svg = readFileSync(join(process.cwd(), "public", path), "utf8");
  const vb = /viewBox="([-\d.\s]+)"/.exec(svg)![1].trim().split(/\s+/).map(Number);
  const circles = [...svg.matchAll(/<circle[^>]*\bcx="([\d.]+)"[^>]*\bcy="([\d.]+)"[^>]*\br="([\d.]+)"/g)].map((m) => ({ cx: +m[1], cy: +m[2], r: +m[3] }));
  // Each dot is a <g filter> whose first path starts at the circle's left-middle point (M x y C …), 18px wide.
  const dots = [...svg.matchAll(/<g filter="url\(#[^)]+\)">\s*<path d="M([\d.]+) ([\d.]+)C/g)].map((m) => ({ x: +m[1] + 9, y: +m[2] }));
  return { vb: { x: vb[0], y: vb[1], width: vb[2], height: vb[3] }, circles, dots };
}

function mapper(box: Rect, vb: Rect) {
  const s = Math.min(box.width / vb.width, box.height / vb.height);
  const ox = box.x + (box.width - vb.width * s) / 2;
  const oy = box.y + (box.height - vb.height * s) / 2;
  return { s, pt: (x: number, y: number) => ({ x: ox + (x - vb.x) * s, y: oy + (y - vb.y) * s }) };
}

async function contentRects(s: Locator): Promise<{ eyebrow: Rect; rects: Rect[]; heading: Rect }> {
  return s.evaluate((sec) => {
    const o = sec.getBoundingClientRect();
    const rel = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.x - o.x, y: r.y - o.y, width: r.width, height: r.height };
    };
    const h2 = sec.querySelector("h2")!;
    const eyebrow = h2.previousElementSibling!;
    const rects = [eyebrow, h2, ...sec.querySelectorAll("p"), ...sec.querySelectorAll("ul > li")].map(rel);
    return { eyebrow: rel(eyebrow), heading: rel(h2), rects };
  });
}

async function capture(page: Page, s: Locator) {
  const r = await s.evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { top: b.top + window.scrollY, width: b.width, height: b.height };
  });
  return page.screenshot({ fullPage: true, animations: "disabled", caret: "hide", clip: { x: 1, y: r.top, width: FRAME.width, height: r.height } });
}

/** Pearson r of luminance over pixels outside `exclude`, best over ±4px shifts. */
async function correlate(
  browser: Browser, reference: Buffer, actual: Buffer, exclude: Rect[], size: { W: number; H: number }, refOffsetY: number,
  options: { mirrorAbout?: number; actDy?: number } = {},
) {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    return await page.evaluate(
      async ({ refB64, actB64, exclude, W, H, refOffsetY, mirrorAbout, actDy }) => {
        const lum = async (b64: string, offY: number, mirror: number | null, dy: number) => {
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          await img.decode();
          const c = new OffscreenCanvas(W, H);
          const ctx = c.getContext("2d")!;
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, W, H);
          if (mirror !== null) {
            ctx.translate(2 * mirror, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(img, 0, -offY + dy);
          const d = ctx.getImageData(0, 0, W, H).data;
          const out = new Float32Array(W * H);
          for (let i = 0; i < W * H; i++) out[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
          return out;
        };
        const [f, a] = await Promise.all([lum(refB64, refOffsetY, null, 0), lum(actB64, 0, mirrorAbout, actDy)]);
        const M = 4;
        const inside = (x: number, y: number, r: { x: number; y: number; width: number; height: number }, m: number) =>
          x >= r.x - m && x < r.x + r.width + m && y >= r.y - m && y < r.y + r.height + m;
        const pts: number[] = [];
        for (let y = M; y < H - M; y++)
          for (let x = M; x < W - M; x++) if (!exclude.some((r) => inside(x, y, r, 3 + M))) pts.push(y * W + x);
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
      { refB64: reference.toString("base64"), actB64: actual.toString("base64"), exclude, W: size.W, H: size.H, refOffsetY, mirrorAbout: options.mirrorAbout ?? null, actDy: options.actDy ?? 0 },
    );
  } finally {
    await context.close();
  }
}

test.describe("Gate A — ring geometry vs Figma 406:3363", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`${locale.toUpperCase()} 1440 — circles, centre, radii, dots, stacking`, async ({ page }, testInfo) => {
      const s = await open(page, locale, VIEWPORTS[0]);
      const qa = qaLedger(testInfo, locale, "1440×1080");
      const m = await svgMap(s);
      const asset = parseAsset(m.src);
      const content = await contentRects(s);

      // AT1 — no elliptical distortion / letterboxing: the box has the asset's own aspect ratio.
      const boxRatio = m.box.width / m.box.height;
      const vbRatio = asset.vb.width / asset.vb.height;
      qa.match({ id: "AT1.1", title: "Rings box keeps the asset aspect ratio (±0.5%, no stretch)", category: "visual" },
        Math.abs(boxRatio / vbRatio - 1) <= 0.005, true);
      const { s: scale, pt } = mapper(m.box, asset.vb);
      qa.match({ id: "AT1.2", title: "Rings drawn at Figma scale (1 SVG unit = 1px at 1440)", category: "layout" }, round(scale, 3), 1, within(0.005));

      // AT2 — shared centre: horizontally on the section centre, vertically eyebrow top + (933 − 700).
      const c = asset.circles[0];
      const centre = pt(c.cx, c.cy);
      qa.match({ id: "AT2.1", title: "Ring centre x = section centre (Figma 720 on a 1439 frame)", category: "layout" },
        round(centre.x, 1), round(m.sec.width / 2 + (CENTRE.x - FRAME.width / 2), 1), within(TOL));
      qa.match({ id: "AT2.2", title: "Ring centre y = eyebrow top + 233 (Figma 933 − 700)", category: "layout" },
        round(centre.y - content.eyebrow.y, 1), CENTRE.y - EYEBROW.y, within(TOL));
      qa.match({ id: "AT2.3", title: "All three rings share one centre", category: "layout" },
        asset.circles.every((k) => k.cx === c.cx && k.cy === c.cy), true);

      // AT3 — three radii equal the Figma ellipses (centre-line = half the box − 0.5 stroke).
      const figmaRadii = RINGS.map((r) => r.width / 2 - 0.5).sort((a, b) => a - b);
      qa.match({ id: "AT3", title: "Three ring radii vs Figma 406:3368/3369/3370", category: "layout" },
        asset.circles.map((k) => round(k.r * scale, 1)).sort((a, b) => a - b).join(","), figmaRadii.join(","),
        (a, e) => a.split(",").length === 3 && a.split(",").every((v, i) => Math.abs(Number(v) - Number(e.split(",")[i])) <= TOL));

      // AT4 — nine dots, each where Figma puts it relative to the ring centre, and on a ring path.
      qa.match({ id: "AT4.1", title: "Nine decorative dots", category: "assets" }, asset.dots.length, DOTS.length);
      const figmaVec = DOTS.map((d) => ({ x: d.x + d.width / 2 - CENTRE.x, y: d.y + d.height / 2 - CENTRE.y })).sort((p, q) => p.x - q.x || p.y - q.y);
      const webVec = asset.dots.map((d) => { const p = pt(d.x, d.y); return { x: p.x - centre.x, y: p.y - centre.y }; }).sort((p, q) => p.x - q.x || p.y - q.y);
      const worst = Math.max(...figmaVec.map((v, i) => Math.hypot(v.x - (webVec[i]?.x ?? 1e4), v.y - (webVec[i]?.y ?? 1e4))));
      qa.match({ id: "AT4.2", title: "Dot offsets from the ring centre vs Figma (worst, px)", category: "layout" }, round(worst, 1), 0, within(TOL));
      const radii = asset.circles.map((k) => k.r * scale);
      const offRing = Math.max(...webVec.map((v) => Math.min(...radii.map((r) => Math.abs(Math.hypot(v.x, v.y) - r)))));
      qa.match({ id: "AT4.3", title: "Every dot centre lies on a ring path (worst distance, px)", category: "layout" }, round(offRing, 1), 0, within(TOL));

      // AT5 — rings sit behind the whole section's content, covering it; clipped only by the section.
      qa.match({ id: "AT5.1", title: "Rings box covers the whole section", category: "layout" },
        m.box.x <= 0.5 && m.box.y <= 0.5 && m.box.x + m.box.width >= m.sec.width - 0.5 && m.box.y + m.box.height >= m.sec.height - 0.5, true);
      qa.match({ id: "AT5.2", title: "Section clips the artwork (overflow hidden), no page overflow", category: "layout" },
        `${await s.evaluate((el) => getComputedStyle(el).overflowY)}|${await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)}`, "hidden|true");
      const img = rings(s);
      qa.match({ id: "AT5.3", title: "Rings ignore pointer events", category: "layout" }, await img.evaluate((el) => getComputedStyle(el).pointerEvents), "none");
      qa.match({ id: "AT5.4", title: "Decorative: empty alt and aria-hidden", category: "assets" },
        `${await img.getAttribute("alt")}|${await img.getAttribute("aria-hidden")}`, "|true");
      // The heading text, eyebrow and pills are hit before the rings.
      const hit = await s.evaluate((sec, rects) => {
        const o = sec.getBoundingClientRect();
        const img = sec.querySelector("img")!;
        return rects.map((r) => {
          const el = document.elementFromPoint(o.x + r.x + r.width / 2, o.y + r.y + r.height / 2);
          return el === img;
        });
      }, content.rects);
      qa.match({ id: "AT5.5", title: "Rings never sit above content (hit-test at every content box centre)", category: "layout" }, hit.some(Boolean), false);

      // Mirroring: Figma specifies none, so EN and AR must use the same unmirrored asset.
      qa.match({ id: "AT6", title: "Rings not mirrored in RTL (no negative x-scale)", category: "rtl" },
        await img.evaluate((el) => { const t = getComputedStyle(el).transform; return t === "none" || !/^matrix\(-/.test(t); }), true);

      qa.advisory({ id: "AT7", title: "Section box (neighbour/regression evidence)", category: "layout",
        note: "Compare before/after: the section's own height must not change." }, `${round(m.sec.width)}×${round(m.sec.height)}`);
      await qa.attach();
    });
  }
});

test.describe("Gate B — Figma crop vs browser capture", () => {
  test("EN 1440 — ring field correlation with controls", async ({ page, browser }, testInfo) => {
    const s = await open(page, "en", VIEWPORTS[0]);
    const qa = qaLedger(testInfo, "en", "1440×1080");
    const shot = ref.screenshot("en")!;
    const reference = readFileSync(shot.path);
    const content = await contentRects(s);
    const sectionH = (await svgMap(s)).sec.height;
    const refOffsetY = Math.round(EYEBROW.y - content.eyebrow.y); // align on the eyebrow top
    const H = Math.min(Math.round(sectionH), FRAME.height - refOffsetY);
    const W = FRAME.width;
    const actual = await capture(page, s);
    // Reference crop, written for the report (cut from the Figma PNG only).
    const exclude: Rect[] = [
      ...content.rects,
      ...FIGMA_CONTENT.map((b) => ({ x: b.x, y: b.y - refOffsetY, width: b.width, height: b.height })),
    ].map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height }));

    const refCrop = await cropPng(browser, reference, 0, refOffsetY, W, H);
    // Self-compare: the Figma crop fed in as the capture must correlate exactly (r = 1 at shift 0,0).
    const self = await correlate(browser, reference, refCrop, exclude, { W, H }, refOffsetY);
    qa.match({ id: "ATB.0", title: "Self-compare (Figma crop vs itself) r = 1 at (0,0)", category: "visual" },
      `${round(self.best.r, 3)}@${self.best.dx},${self.best.dy}`, "1@0,0");
    const measured = await correlate(browser, reference, actual, exclude, { W, H }, refOffsetY);
    await s.locator("img").first().evaluate((el) => (el.style.visibility = "hidden"));
    const hiddenShot = await capture(page, s);
    await s.locator("img").first().evaluate((el) => (el.style.visibility = ""));
    const hidden = await correlate(browser, reference, hiddenShot, exclude, { W, H }, refOffsetY);
    const moved = await correlate(browser, reference, actual, exclude, { W, H }, refOffsetY, { actDy: 40 });
    const mirrored = await correlate(browser, reference, actual, exclude, { W, H }, refOffsetY, { mirrorAbout: W / 2 });

    const ctl = `hidden ${round(hidden.best.r, 3)}, moved +40px ${round(moved.best.r, 3)}, mirrored ${round(mirrored.best.r, 3)} (not gated: symmetric rings); n=${measured.pixels}`;
    const discriminates = hidden.best.r < R_MIN && moved.best.r < R_MIN;
    const row = {
      id: "ATB.1", title: `Ring-field luminance correlation vs Figma crop (r ≥ ${R_MIN}, shift ≤ ±${TOL}px)`, category: "visual" as const,
    };
    const actualText = `r ${round(measured.best.r, 3)} at (${measured.best.dx},${measured.best.dy}); r(0,0) ${round(measured.r0, 3)}; ${ctl}`;
    if (!discriminates) {
      qa.advisory({ ...row, note: "Negative controls did not separate (a control scored ≥ 0.8): not gated." }, actualText);
    } else {
      qa.match(row, measured.best.r >= R_MIN && Math.abs(measured.best.dx) <= TOL && Math.abs(measured.best.dy) <= TOL ? "match" : actualText, "match");
    }
    qa.advisory({ id: "ATB.1r", title: "Correlation detail (measured values)", category: "visual", note: "Fixed in advance: r >= 0.8 at shift <= 2px; controls < 0.8." }, actualText);
    qa.match({ id: "ATB.2", title: "Control: rings hidden scores below the threshold (proves signal)", category: "visual" }, hidden.best.r < R_MIN, true);
    qa.match({ id: "ATB.3", title: "Control: capture moved 40px down scores below the threshold (proves position sensitivity)", category: "visual" }, moved.best.r < R_MIN, true);

    // Evidence only: a plain pixel diff of the aligned crops.
    const cmp = await compareImages(browser, refCrop, actual, [{ name: "Section", x: 0, y: 0, width: W, height: H }]);
    qa.advisory({ id: "ATB.4", title: "Pixel mismatch, aligned section crop", category: "visual", note: "Evidence only: text/spacing differences are outside this finding." },
      `${(cmp.regions[0].mismatchRatio * 100).toFixed(2)}%`);
    if (process.env.QA_EVIDENCE_DIR) {
      mkdirSync(process.env.QA_EVIDENCE_DIR, { recursive: true });
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/figma-crop.png`, refCrop);
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/browser-actual.png`, actual);
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/overlay.png`, cmp.overlayPng);
    }
    await testInfo.attach("figma-crop.png", { body: refCrop, contentType: "image/png" });
    await testInfo.attach("browser-actual.png", { body: actual, contentType: "image/png" });
    await testInfo.attach("overlay.png", { body: cmp.overlayPng, contentType: "image/png" });
    void PHASE;
    await qa.attach();
  });
});

async function cropPng(browser: Browser, png: Buffer, x: number, y: number, w: number, h: number) {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    const b64 = await page.evaluate(async ({ b64, x, y, w, h }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = new OffscreenCanvas(w, h);
      c.getContext("2d")!.drawImage(img, x, y, w, h, 0, 0, w, h);
      const blob = await c.convertToBlob({ type: "image/png" });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    }, { b64: png.toString("base64"), x, y, w, h });
    return Buffer.from(b64, "base64");
  } finally {
    await context.close();
  }
}

test.describe("Responsive and RTL", () => {
  for (const locale of ["en", "ar"] as const) {
    for (const vp of VIEWPORTS) {
      test(`${locale.toUpperCase()} ${vp.width}×${vp.height} — circular, centred, covering, no overflow`, async ({ page }, testInfo) => {
        const s = await open(page, locale, vp);
        const qa = qaLedger(testInfo, locale, `${vp.width}×${vp.height}`);
        const m = await svgMap(s);
        const asset = parseAsset(m.src);
        const content = await contentRects(s);
        qa.match({ id: "ATR.1", title: "Rings stay circular (box ratio = asset ratio)", category: "responsive" },
          Math.abs(m.box.width / m.box.height / (asset.vb.width / asset.vb.height) - 1) <= 0.005, true);
        const { pt } = mapper(m.box, asset.vb);
        const c = asset.circles[0];
        const centre = pt(c.cx, c.cy);
        qa.match({ id: "ATR.2", title: "Ring centre on the section's vertical axis (RTL-neutral)", category: "rtl" },
          Math.abs(centre.x - m.sec.width / 2) <= TOL, true);
        qa.match({ id: "ATR.3", title: "Rings box spans the full section width", category: "responsive" },
          m.box.x <= 0.5 && m.box.x + m.box.width >= m.sec.width - 0.5, true);
        // Vertical coverage is defined by Figma at 1440 (AT5.1, gated). Below that there is no frame and
        // the field is scaled to the width, so a tall mobile section can be taller than it: evidence only.
        const covers = m.box.y <= 0.5 && m.box.y + m.box.height >= m.sec.height - 0.5;
        if (vp.width === 1440) {
          qa.match({ id: "ATR.3v", title: "Rings box covers the section height (Figma-defined at 1440)", category: "responsive" }, covers, true);
        } else {
          qa.advisory({ id: "ATR.3v", title: "Rings box vertical coverage of the section", category: "responsive",
            note: "No Figma frame at this width; the scale floor is a designer-confirmation item (PQA-029)." },
            `${covers ? "covers" : "does not cover"} (field ${round(m.box.height)}px, section ${round(m.sec.height)}px)`);
        }
        qa.match({ id: "ATR.4", title: "Ring centre lies inside the content block (vertically)", category: "responsive" },
          centre.y >= content.eyebrow.y && centre.y <= content.rects.reduce((mx, r) => Math.max(mx, r.y + r.height), 0), true);
        qa.match({ id: "ATR.5", title: "No horizontal overflow", category: "responsive" },
          await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        qa.match({ id: "ATR.6", title: "Document direction", category: "rtl" }, await page.evaluate(() => document.documentElement.dir), locale === "ar" ? "rtl" : "ltr");
        if (vp.width !== 1440) {
          qa.unavailable({ id: "ATR.7", title: "Figma frame at this width", category: "responsive",
            note: "Only 1440 frames exist; the scale floor is a designer-confirmation item (PQA-029)." });
        }
        await qa.attach();
      });
    }
  }
});
