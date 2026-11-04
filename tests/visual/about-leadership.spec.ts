import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser, Locator, Page } from "@playwright/test";
import { test, waitForHydration } from "../e2e/support/fixtures";
import { setMotionPreference } from "../e2e/support/motion";
import { messages, type Locale } from "../e2e/support/messages";
import { compareImages } from "./support/compare";
import { qaLedger, within } from "./support/qa";
import { hexToRgb, loadReferences } from "./support/reference";
import { hideOverlays, settle } from "./support/stable";

/**
 * About › Leadership panels (components/sections/about/leadership.tsx)
 * against Figma 406:3681 (Board of Directors) and 406:3682 (Executive
 * Leadership), Designer finding #4 of Infoline-09-About-Page.pdf:
 *   LP1/LP2 panel widths and horizontal insets
 *   LP3     symmetric insets, radius 24, label centred on the top edge
 *   LP4     border: no native dashed border (renders 3px marks), colour, width
 *   LP9     dash 12px / gap 12px, measured from the rendered pixels
 *
 * Gate A — exact geometry, expected values read from the cached Figma node
 *          boxes and variables (the radius is a design-context fact, see the
 *          cached 406-3681.design-context file).
 * Gate B — dash pattern. Figma gives no dash numbers, so the same scan is run
 *          on the Figma render and on the build capture (bottom and left
 *          edges, which no label covers): median dash and median gap, ink =
 *          red channel at least 25 below the white background. Constraint
 *          fixed before measuring: each median within ±1px of Figma's own.
 *          Pixel mismatch and corner ink are advisory evidence.
 */

const ref = loadReferences("about-leadership");
const PANELS = [
  { key: "board", node: ref.node("406:3681"), label: ref.node("406:3683"), file: "406-3681.en.1272.png" },
  { key: "exec", node: ref.node("406:3682"), label: ref.node("406:3685"), file: "406-3682.en.1094.png" },
] as const;
const FRAME_W = 1440;
const RADIUS = 24; // design context: rounded-[24px]
const TOL = 2;
const DASH_TOL = 1;
const INK_DROP = 25;
const VIEWPORTS = [
  { width: 1440, height: 1080 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

type Rect = { x: number; y: number; width: number; height: number };
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const css = (el: Locator, prop: string) => el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);

async function open(page: Page, locale: Locale, vp: { width: number; height: number }) {
  const title = messages[locale].AboutPage.leadership.title;
  await setMotionPreference(page, "reduce");
  await page.setViewportSize(vp);
  await page.goto(`/${locale}/about`);
  await waitForHydration(page);
  const section = page.locator("main > section", { has: page.getByRole("heading", { level: 2, name: title, exact: true }) });
  await section.scrollIntoViewIfNeeded();
  await settle(page, section);
  await hideOverlays(page);
  return section;
}

function panelOf(s: Locator, locale: Locale, key: "board" | "exec") {
  const copy = messages[locale].AboutPage.leadership;
  const label = s.getByText(key === "board" ? copy.boardLabel : copy.execLabel, { exact: true });
  return { label, panel: label.locator("xpath=..") };
}

async function docRect(el: Locator): Promise<Rect> {
  return el.first().evaluate((n) => {
    const r = n.getBoundingClientRect();
    return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
  });
}

/** Median dash / gap along the bottom edge and the left edge of a panel image. */
async function measureDashes(browser: Browser, png: Buffer) {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    return await page.evaluate(async ({ b64, drop }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
      const x = c.getContext("2d")!;
      x.fillStyle = "#fff";
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0);
      const W = c.width, H = c.height;
      const d = x.getImageData(0, 0, W, H).data;
      const ink = (px: number, py: number) => 255 - d[(py * W + px) * 4] > drop;
      const lineInk = (get: (i: number) => boolean, from: number, to: number) => { let n = 0; for (let i = from; i < to; i++) if (get(i)) n++; return n; };
      const pick = (cands: number[], at: (k: number) => (i: number) => boolean, from: number, to: number) =>
        [...cands].sort((p, q) => lineInk(at(q), from, to) - lineInk(at(p), from, to))[0];
      const runs = (get: (i: number) => boolean, from: number, to: number) => {
        const out: { ink: boolean; len: number }[] = [];
        let cur: boolean | null = null, len = 0;
        for (let i = from; i < to; i++) {
          const v = get(i);
          if (cur === null || v !== cur) { if (cur !== null) out.push({ ink: cur, len }); cur = v; len = 0; }
          len++;
        }
        if (cur !== null) out.push({ ink: cur, len });
        return out.slice(1, -1); // drop the partial runs at both ends
      };
      const median = (a: number[]) => (a.length ? [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)] : 0);
      const edge = (get: (i: number) => boolean, from: number, to: number) => {
        const r = runs(get, from, to);
        const dash = r.filter((q) => q.ink).map((q) => q.len), gap = r.filter((q) => !q.ink).map((q) => q.len);
        return { dash: median(dash), gap: median(gap), dashes: dash.length, longest: Math.max(0, ...dash) };
      };
      const br = pick([H - 1, H - 2, H - 3], (y) => (px) => ink(px, y), 40, W - 40);
      const lc = pick([0, 1, 2], (p) => (y) => ink(p, y), 40, H - 40);
      const bottom = edge((px) => ink(px, br), 40, W - 40);
      const left = edge((y) => ink(lc, y), 40, H - 40);
      let corner = 0;
      for (let y = 0; y < 26; y++) for (let px = 0; px < 26; px++) if (ink(px, y)) corner++;
      return { bottom, left, corner, W, H, rowUsed: br, colUsed: lc };
    }, { b64: png.toString("base64"), drop: INK_DROP });
  } finally {
    await context.close();
  }
}

async function zoomCrop(browser: Browser, png: Buffer, box: Rect, scale: number) {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    const b64 = await page.evaluate(async ({ b64, box, scale }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = new OffscreenCanvas(box.width * scale, box.height * scale);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, c.width, c.height);
      const blob = await c.convertToBlob({ type: "image/png" });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    }, { b64: png.toString("base64"), box, scale });
    return Buffer.from(b64, "base64");
  } finally {
    await context.close();
  }
}

test.describe("Gate A — panel geometry vs Figma 406:3681 / 406:3682", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`${locale.toUpperCase()} 1440 — widths, insets, radius, border, labels`, async ({ page }, testInfo) => {
      const s = await open(page, locale, VIEWPORTS[0]);
      const qa = qaLedger(testInfo, locale, "1440×1080");
      for (const [i, P] of PANELS.entries()) {
        const { label, panel } = panelOf(s, locale, P.key);
        const box = await docRect(panel);
        const lab = await docRect(label);
        const n = `LP${i + 1}`;
        qa.match({ id: `${n}.1`, title: `${P.key} panel width (Figma ${P.node.width})`, category: "layout" }, round(box.width), P.node.width, within(TOL));
        qa.match({ id: `${n}.2`, title: `${P.key} panel left inset (Figma ${P.node.x})`, category: "layout" }, round(box.x), P.node.x, within(TOL));
        qa.match({ id: `${n}.3`, title: `${P.key} panel right inset (Figma ${FRAME_W - P.node.x - P.node.width})`, category: "layout" },
          round(FRAME_W - box.x - box.width), FRAME_W - P.node.x - P.node.width, within(TOL));
        qa.match({ id: `${n}.4`, title: `${P.key} panel corner radius (24)`, category: "visual" },
          await css(panel, "border-top-left-radius"), `${RADIUS}px`);
        qa.match({ id: `${n}.5`, title: `${P.key} label centred on the panel top edge`, category: "layout" },
          `${round(lab.x + lab.width / 2 - (box.x + box.width / 2))},${round(lab.y + lab.height / 2 - box.y)}`, "0,0",
          (a, e) => a.split(",").every((v, k) => Math.abs(Number(v) - Number(e.split(",")[k])) <= TOL));
        // Border: not the browser's native dashed border (3px marks); colour token and 1px width on whatever draws it.
        const native = await panel.evaluate((el) => {
          const cs = getComputedStyle(el);
          return { style: cs.borderTopStyle, width: parseFloat(cs.borderTopWidth), color: cs.borderTopColor };
        });
        const svgStroke = await panel.evaluate((el) => {
          const rect = el.querySelector(":scope > svg rect");
          if (!rect) return null;
          const cs = getComputedStyle(rect);
          return { stroke: cs.stroke, width: parseFloat(cs.strokeWidth), dash: cs.strokeDasharray };
        });
        qa.match({ id: `${n}.6`, title: `${P.key} border is not the native CSS dashed border`, category: "visual" }, native.style !== "dashed", true);
        qa.match({ id: `${n}.7`, title: `${P.key} border colour (border/brand/muted)`, category: "colour" },
          svgStroke ? svgStroke.stroke : native.color, hexToRgb(ref.token("border/brand/muted")));
        qa.match({ id: `${n}.8`, title: `${P.key} border width 1px`, category: "visual" }, svgStroke ? svgStroke.width : native.width, 1);
        qa.advisory({ id: `${n}.9`, title: `${P.key} border implementation`, category: "visual", note: "Evidence." },
          svgStroke ? `svg stroke-dasharray ${svgStroke.dash}` : `native ${native.style}`);
      }

      // Portraits stay inside their panels (content preserved).
      const portraits = await s.locator("img").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; }));
      const boxes = await Promise.all(PANELS.map((P) => docRect(panelOf(s, locale, P.key).panel)));
      const inside = (r: Rect, b: Rect) => r.x >= b.x && r.x + r.width <= b.x + b.width && r.y >= b.y && r.y + r.height <= b.y + b.height;
      qa.match({ id: "LP3.1", title: "Every portrait lies inside the Board or Executive panel", category: "layout" },
        portraits.length === 10 && portraits.every((r) => boxes.some((b) => inside(r, b))), true);
      qa.advisory({ id: "LP3.2", title: "Board portrait 1 centre x vs Figma card 406:3578 (262.5)", category: "layout",
        note: "Portrait placement is outside finding #4; recorded as evidence." }, `${round(portraits[0].x + portraits[0].width / 2)}`);
      await qa.attach();
    });
  }
});

test.describe("Gate B — dash pattern", () => {
  test("EN 1440 — dash and gap against the Figma renders", async ({ page, browser }, testInfo) => {
    const s = await open(page, "en", VIEWPORTS[0]);
    const qa = qaLedger(testInfo, "en", "1440×1080");
    for (const [i, P] of PANELS.entries()) {
      const reference = readFileSync(join(process.cwd(), "tests/visual/figma/about-leadership", P.file));
      const self = await compareImages(browser, reference, reference, []);
      qa.match({ id: `LB${i + 1}.0`, title: `${P.key}: self-compare (Figma vs itself) mismatch = 0`, category: "visual" }, self.mismatchRatio, 0);
      const { panel } = panelOf(s, "en", P.key);
      await panel.scrollIntoViewIfNeeded();
      const label = panelOf(s, "en", P.key).label;
      await label.evaluate((el) => ((el as HTMLElement).style.visibility = "hidden")); // the label covers part of the top edge only
      const actual = await panel.screenshot({ animations: "disabled", caret: "hide" });
      await label.evaluate((el) => ((el as HTMLElement).style.visibility = ""));
      const f = await measureDashes(browser, reference);
      const a = await measureDashes(browser, actual);
      const row = (id: string, title: string, got: number, want: number) =>
        qa.match({ id, title, category: "visual" }, `${got}`, `${want}`, (x, y) => Math.abs(Number(x) - Number(y)) <= DASH_TOL);
      row(`LB${i + 1}.1`, `${P.key}: bottom-edge median dash (Figma ${f.bottom.dash}px, ±${DASH_TOL})`, a.bottom.dash, f.bottom.dash);
      row(`LB${i + 1}.2`, `${P.key}: bottom-edge median gap (Figma ${f.bottom.gap}px, ±${DASH_TOL})`, a.bottom.gap, f.bottom.gap);
      row(`LB${i + 1}.3`, `${P.key}: left-edge median dash (Figma ${f.left.dash}px, ±${DASH_TOL})`, a.left.dash, f.left.dash);
      row(`LB${i + 1}.4`, `${P.key}: left-edge median gap (Figma ${f.left.gap}px, ±${DASH_TOL})`, a.left.gap, f.left.gap);
      qa.match({ id: `LB${i + 1}.5`, title: `${P.key}: separated long dashes, not a near-continuous line (longest dash ≤ 2 × Figma's)`, category: "visual" },
        a.bottom.longest <= 2 * f.bottom.longest, true);
      qa.advisory({ id: `LB${i + 1}.6`, title: `${P.key}: dash measurements (Figma → build)`, category: "visual", note: "Medians in px; dashes counted on the bottom edge." },
        `bottom dash ${f.bottom.dash}→${a.bottom.dash}, gap ${f.bottom.gap}→${a.bottom.gap}; left dash ${f.left.dash}→${a.left.dash}, gap ${f.left.gap}→${a.left.gap}; dashes ${f.bottom.dashes}→${a.bottom.dashes}`);
      qa.advisory({ id: `LB${i + 1}.7`, title: `${P.key}: corner ink in the 26×26 top-left box (Figma → build)`, category: "visual", note: "Corner continuity evidence; dash phase differs." },
        `${f.corner}→${a.corner}`);
      if (process.env.QA_EVIDENCE_DIR) {
        mkdirSync(process.env.QA_EVIDENCE_DIR, { recursive: true });
        const zoom = { x: 0, y: 0, width: 120, height: 60 };
        writeFileSync(`${process.env.QA_EVIDENCE_DIR}/${P.key}-top-left-figma.png`, await zoomCrop(browser, reference, zoom, 6));
        writeFileSync(`${process.env.QA_EVIDENCE_DIR}/${P.key}-top-left-build.png`, await zoomCrop(browser, actual, zoom, 6));
      }
      await testInfo.attach(`${P.key}-build.png`, { body: actual, contentType: "image/png" });
    }
    await qa.attach();
  });
});

test.describe("Responsive and RTL", () => {
  for (const locale of ["en", "ar"] as const) {
    for (const vp of VIEWPORTS) {
      test(`${locale.toUpperCase()} ${vp.width}×${vp.height} — panels, overflow, content`, async ({ page }, testInfo) => {
        const s = await open(page, locale, vp);
        const qa = qaLedger(testInfo, locale, `${vp.width}×${vp.height}`);
        qa.match({ id: "LR.1", title: "No horizontal overflow", category: "responsive" },
          await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        const boxes = await Promise.all(PANELS.map((P) => docRect(panelOf(s, locale, P.key).panel)));
        qa.match({ id: "LR.2", title: "Both panels inside the viewport", category: "responsive" },
          boxes.every((b) => b.x >= 0 && b.x + b.width <= vp.width + 0.5), true);
        qa.match({ id: "LR.3", title: "Insets symmetric (RTL-neutral)", category: "rtl" },
          boxes.every((b) => Math.abs(b.x - (vp.width - b.x - b.width)) <= TOL), true);
        const portraits = await s.locator("img").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; }));
        qa.match({ id: "LR.4", title: "No portrait clipped by its panel (all ten inside a panel)", category: "responsive" },
          portraits.length === 10 && portraits.every((r) => boxes.some((b) => r.x >= b.x - 0.5 && r.x + r.width <= b.x + b.width + 0.5 && r.y >= b.y && r.y + r.height <= b.y + b.height)), true);
        qa.match({ id: "LR.5", title: "Labels inside the viewport and centred on their panels", category: "responsive" },
          (await Promise.all(PANELS.map(async (P, k) => {
            const lab = await docRect(panelOf(s, locale, P.key).label);
            return lab.x >= 0 && lab.x + lab.width <= vp.width && Math.abs(lab.x + lab.width / 2 - (boxes[k].x + boxes[k].width / 2)) <= TOL;
          }))).every(Boolean), true);
        qa.match({ id: "LR.6", title: "Document direction", category: "rtl" }, await page.evaluate(() => document.documentElement.dir), locale === "ar" ? "rtl" : "ltr");
        if (vp.width !== 1440) {
          qa.unavailable({ id: "LR.7", title: "Figma frame at this width", category: "responsive", note: "Only 1440 frames exist (PQA-031)." });
        }
        qa.advisory({ id: "LR.8", title: "Panel widths (board / exec)", category: "layout", note: "Regression evidence." }, `${round(boxes[0].width)} / ${round(boxes[1].width)}`);
        await qa.attach();
      });
    }
  }
});
