import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser, Locator, Page } from "@playwright/test";
import { test, waitForHydration } from "../e2e/support/fixtures";
import { setMotionPreference } from "../e2e/support/motion";
import { messages, type Locale } from "../e2e/support/messages";
import { compareImages } from "./support/compare";
import { measureInk, inkGeometryMatches } from "./support/ink";
import { qaLedger, within } from "./support/qa";
import { hexToRgb, loadReferences } from "./support/reference";
import { hideOverlays, settle } from "./support/stable";

/**
 * About › Vision & Mission (components/sections/about/vision.tsx) against
 * Figma 406:3558, Designer finding #3 of Infoline-09-About-Page.pdf:
 *   V1 heading 36/44, three lines at 1440 (build: 40/44, four lines)
 *   V2 short accent rule (11×129, heading-top aligned)
 *   V3 right-hand composition built from the original separate layers
 *      (pattern, capsule, cut-out photo, crosses, gradient) instead of one
 *      flattened asset scaled down
 *   V4 asset identity / accessibility / no mirroring
 *
 * Gate A — exact geometry, every expected value read from the cached Figma
 *          node boxes and variables. Layers are positioned absolutely at 1440
 *          (x from the page, y aligned on the eyebrow top: the section's
 *          padding differs from Figma and is outside this finding).
 * Gate B — ink geometry of the composition (capsule + photo) and, for the
 *          faint pattern and crosses, masked luminance correlation with a
 *          hidden and a moved negative control (thresholds fixed in advance:
 *          r ≥ 0.8 at shift ≤ ±2px, both controls < 0.8). Pixel mismatch is
 *          advisory.
 */

const ref = loadReferences("about-vision");
const FRAME = ref.node("406:3558"); // 1440 × 466
const EYEBROW = ref.node("406:3560");
const HEADING = ref.node("406:3559");
const RULE = ref.node("406:3577");
const L = {
  pattern: ref.node("406:3562"),
  capsule: ref.node("406:3564"),
  photo: ref.node("406:3565"),
  overlay: ref.node("406:3575"),
  crosses: ["406:3566", "406:3569", "406:3572"].map((id) => ref.node(id)),
};
const TOL = 2;
const R_MIN = 0.8;
const VIEWPORTS = [
  { width: 1440, height: 1080 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];
const MANIFEST_NOTE = (JSON.parse(readFileSync(join(process.cwd(), "tests/visual/figma/about-vision/manifest.json"), "utf8")).references as { kind: string; note?: string }[]).find((r) => r.kind === "design-context")!.note!;
const PHOTO_SHA = /SHA-256 ([0-9a-f]{64})/.exec(MANIFEST_NOTE)![1];

type Rect = { x: number; y: number; width: number; height: number };
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const css = (el: Locator, prop: string) => el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);
const rectStr = (r: Rect | null) => (r ? `${round(r.x)},${round(r.y)},${round(r.width)},${round(r.height)}` : "absent");
const boxStr = (b: Rect) => `${round(b.x)},${round(b.y)},${round(b.width)},${round(b.height)}`;
const near = (tol: number) => (a: string, e: string) =>
  a !== "absent" && a.split(",").length === e.split(",").length && a.split(",").every((v, i) => Math.abs(Number(v) - Number(e.split(",")[i])) <= tol);

async function open(page: Page, locale: Locale, vp: { width: number; height: number }) {
  const title = messages[locale].AboutPage.vision.title;
  await setMotionPreference(page, "reduce");
  await page.setViewportSize(vp);
  await page.goto(`/${locale}/about`);
  await waitForHydration(page);
  const section = page.locator("main > section", { has: page.getByRole("heading", { level: 2, name: title }) });
  await section.scrollIntoViewIfNeeded();
  await settle(page, section);
  await hideOverlays(page);
  return section;
}

/** Document-space rect of an element (page x, page y). */
async function docRect(el: Locator): Promise<Rect | null> {
  if ((await el.count()) === 0) return null;
  return el.first().evaluate((n) => {
    const r = n.getBoundingClientRect();
    return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
  });
}

function parts(s: Locator) {
  const h2 = s.locator("h2");
  return {
    h2,
    rule: h2.locator("xpath=preceding-sibling::span[1]"),
    eyebrow: h2.locator("xpath=../preceding-sibling::*[1]"),
    photo: s.getByTestId("about-vision-photo"),
    pattern: s.getByTestId("about-vision-pattern"),
    capsule: s.getByTestId("about-vision-capsule"),
    overlay: s.getByTestId("about-vision-overlay"),
    crosses: s.getByTestId("about-vision-cross"),
    imgs: s.locator("img"),
  };
}

async function lineCount(h2: Locator) {
  return h2.evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
}

test.describe("Gate A — heading, rule and layers vs Figma 406:3558", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`${locale.toUpperCase()} 1440 — typography, accent rule, layered composition`, async ({ page }, testInfo) => {
      const s = await open(page, locale, VIEWPORTS[0]);
      const qa = qaLedger(testInfo, locale, "1440×1080");
      const p = parts(s);
      const eyebrow = (await docRect(p.eyebrow))!;
      const dy = eyebrow.y - EYEBROW.y; // Figma y → page y, aligned on the eyebrow top

      // V1 — heading 36/44, three lines (EN), colour.
      qa.match({ id: "V1.1", title: "Heading font-size (heading/2xl: 36)", category: "typography" },
        await css(p.h2, "font-size"), `${ref.token("font-size/text-4xl")}px`);
      qa.match({ id: "V1.2", title: "Heading line-height (44)", category: "typography" },
        await css(p.h2, "line-height"), `${ref.token("line-height/leading-44")}px`);
      qa.match({ id: "V1.3", title: "Heading colour (content/base/primary)", category: "colour" },
        await css(p.h2, "color"), hexToRgb(ref.token("content/base/primary")));
      const lines = await lineCount(p.h2);
      if (locale === "en") {
        qa.match({ id: "V1.4", title: "Heading wraps to three lines at 1440", category: "typography" }, lines, Math.round(HEADING.height / 44));
        qa.match({ id: "V1.5", title: "Heading box width ≤ Figma 611", category: "layout" },
          (await docRect(p.h2))!.width <= HEADING.width + 0.5, true);
      } else {
        qa.unavailable({ id: "V1.4", title: "Arabic heading line count", category: "typography",
          note: "No Arabic frame; Arabic wraps differently. Size and line-height are gated above." }, `${lines} lines`);
      }
      qa.advisory({ id: "V1.6", title: "Heading weight (Figma Black 800; site uses semibold on every About heading)", category: "typography",
        note: "Site-wide heading-weight convention, outside finding #3 (see PQA-020)." }, await css(p.h2, "font-weight"));

      // V2 — accent rule: 11 × 129, top aligned with the heading, 18px gap, brand blue.
      const rule = (await docRect(p.rule))!;
      const h2 = (await docRect(p.h2))!;
      qa.match({ id: "V2.1", title: "Accent rule size 11 × 129", category: "layout" },
        `${round(rule.width)},${round(rule.height)}`, `${RULE.width},${RULE.height}`, near(TOL));
      qa.match({ id: "V2.2", title: "Accent rule top = heading top (Figma both y=133)", category: "layout" },
        round(rule.y - h2.y), RULE.y - HEADING.y, within(TOL));
      qa.match({ id: "V2.3", title: "Gap rule → heading (Figma 111 − 93 = 18)", category: "layout" },
        round(Math.min(Math.abs(h2.x - (rule.x + rule.width)), Math.abs(rule.x - (h2.x + h2.width)))), HEADING.x - (RULE.x + RULE.width), within(TOL));
      qa.match({ id: "V2.4", title: "Accent rule colour (content/brand/default)", category: "colour" },
        await css(p.rule, "background-color"), hexToRgb(ref.token("content/brand/default")));
      qa.match({ id: "V2.5", title: "Accent rule is decorative (aria-hidden)", category: "assets" }, await p.rule.getAttribute("aria-hidden"), "true");

      // V3 — composition from separate layers, Figma sizes and offsets.
      const capsule = await docRect(p.capsule);
      const photo = await docRect(p.photo);
      const pattern = await docRect(p.pattern);
      const overlay = await docRect(p.overlay);
      const crossRects = await Promise.all((await p.crosses.all()).map((c) => docRect(c)));
      qa.match({ id: "V3.1", title: "Composition is separate layers (pattern, capsule, photo, overlay, 3 crosses)", category: "assets" },
        [pattern, capsule, photo, overlay].every(Boolean) && crossRects.length === 3, true);
      qa.match({ id: "V3.2", title: "Only the pattern, the photo and the three crosses are images", category: "assets" },
        await p.imgs.count(), 5);

      // Relative geometry (all locales): every layer against the capsule, as Figma has it.
      const rel = (r: Rect | null, c: Rect | null) => (r && c ? { x: r.x - c.x, y: r.y - c.y, width: r.width, height: r.height } : null);
      const figCapsule = L.capsule;
      const figRel = (b: Rect) => ({ x: b.x - figCapsule.x, y: b.y - figCapsule.y, width: b.width, height: b.height });
      const layerRows: [string, string, Rect | null, Rect][] = [
        ["V3.3", "Capsule size 593.461 × 175.903", capsule ? { x: 0, y: 0, width: capsule.width, height: capsule.height } : null, { x: 0, y: 0, width: figCapsule.width, height: figCapsule.height }],
        ["V3.4", "Photo box vs capsule (406:3565)", rel(photo, capsule), figRel(L.photo)],
        ["V3.5", "Pattern box vs capsule (406:3562)", rel(pattern, capsule), figRel(L.pattern)],
        ["V3.6", "Gradient overlay = capsule box (406:3575)", rel(overlay, capsule), figRel(L.overlay)],
        ...L.crosses.map((c, i) => [`V3.7.${i + 1}`, `Cross ${i + 1} box vs capsule (${["406:3566", "406:3569", "406:3572"][i]})`, rel(crossRects[i] ?? null, capsule), figRel(c)] as [string, string, Rect | null, Rect]),
      ];
      for (const [id, title, actual, expected] of layerRows) {
        qa.match({ id, title, category: "layout" }, rectStr(actual), boxStr(expected), near(TOL));
      }
      // Absolute position (EN only; AR swaps the columns, no Arabic frame).
      if (locale === "en") {
        qa.match({ id: "V3.8", title: "Capsule x/y at 1440 (page x; y aligned on the eyebrow top)", category: "layout" },
          rectStr(capsule ? { x: capsule.x, y: capsule.y - dy, width: capsule.width, height: capsule.height } : null),
          boxStr(L.capsule), near(TOL));
        qa.match({ id: "V3.9", title: "Photo x/y at 1440 (406:3565)", category: "layout" },
          rectStr(photo ? { x: photo.x, y: photo.y - dy, width: photo.width, height: photo.height } : null), boxStr(L.photo), near(TOL));
        qa.match({ id: "V3.10", title: "Pattern overflows the right edge (656 + 847.6 = 1503.6 > 1440)", category: "layout" },
          !!pattern && pattern.x + pattern.width > 1440 + 1, true);
      } else {
        qa.unavailable({ id: "V3.8", title: "Absolute composition position", category: "rtl",
          note: "No Arabic frame; relative layer geometry above is gated, the column is on the opposite side." });
      }

      // V3 look: capsule colour/pill, gradient, stacking order, photo fit.
      qa.match({ id: "V3.11", title: "Capsule colour (content/brand/default #1c97d4)", category: "colour" },
        capsule ? await css(p.capsule, "background-color") : "absent", hexToRgb(ref.token("content/brand/default")));
      qa.match({ id: "V3.12", title: "Capsule is a full pill (radius ≥ height / 2)", category: "visual" },
        capsule ? parseFloat(await css(p.capsule, "border-top-left-radius")) >= capsule.height / 2 - 0.5 : false, true);
      const grad = overlay ? await css(p.overlay, "background-image") : "absent";
      qa.match({ id: "V3.13", title: "Overlay gradient rgba(15,78,110,0) → rgba(15,78,110,0.3), top to bottom", category: "colour" },
        /^linear-gradient\((?:to bottom, |180deg, )?rgba/.test(grad) && grad.includes("rgba(15, 78, 110, 0)") && grad.includes("rgba(15, 78, 110, 0.3)"), true);
      const order = await s.evaluate((sec) => {
        const ids = ["pattern", "capsule", "photo", "cross", "overlay"].map((k) => sec.querySelector(`[data-testid=about-vision-${k}]`));
        const idx = ids.map((e) => (e ? [...(e.parentElement?.children ?? [])].indexOf(e) : -1));
        const lastCross = [...sec.querySelectorAll("[data-testid=about-vision-cross]")].map((e) => [...(e.parentElement?.children ?? [])].indexOf(e)).pop() ?? -1;
        return { idx, lastCross };
      });
      qa.match({ id: "V3.14", title: "Layer order bottom→top: pattern, capsule, photo, crosses, gradient", category: "layout" },
        order.idx[0] >= 0 && order.idx[0] < order.idx[1] && order.idx[1] < order.idx[2] && order.idx[2] < order.idx[3] && order.lastCross < order.idx[4], true);
      qa.match({ id: "V3.15", title: "Photo object-fit cover, background transparent (cut-out PNG)", category: "visual" },
        `${(await p.photo.count()) ? await css(p.photo, "object-fit") : "absent"}`, "cover");

      // V4 — identity, accessibility, no mirroring.
      const asset = join(process.cwd(), "public/assets/about/vision-people.png");
      qa.match({ id: "V4.1", title: "Photo asset is byte-identical to the Figma 406:3565 image (SHA-256)", category: "assets" },
        existsSync(asset) ? createHash("sha256").update(readFileSync(asset)).digest("hex") : "missing", PHOTO_SHA);
      qa.match({ id: "V4.2", title: "Every image decorative: empty alt", category: "assets" },
        (await p.imgs.evaluateAll((els) => els.every((e) => e.getAttribute("alt") === ""))), true);
      qa.match({ id: "V4.3", title: "Composition hidden from assistive technology (aria-hidden on or above every image)", category: "assets" },
        (await p.imgs.evaluateAll((els) => els.every((e) => e.closest("[aria-hidden=true]") !== null))), true);
      qa.match({ id: "V4.4", title: "No image or ancestor mirrored (no negative x-scale)", category: "rtl" },
        await p.imgs.evaluateAll((els) => els.every((e) => {
          for (let n: Element | null = e; n && n.tagName !== "SECTION"; n = n.parentElement) {
            const t = getComputedStyle(n).transform;
            const m = /^matrix\(([-\d.e]+),/.exec(t);
            if (m && Number(m[1]) < 0) return false;
          }
          return true;
        })), true);
      qa.match({ id: "V4.5", title: "Section clips the overflow (overflow hidden), no page overflow", category: "layout" },
        `${await s.evaluate((el) => getComputedStyle(el).overflowX)}|${await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)}`, "hidden|true");

      const box = (await docRect(s))!;
      qa.advisory({ id: "V5.1", title: "Section box (neighbour/regression evidence)", category: "layout", note: "Section padding is outside this finding; compare before/after." },
        `${round(box.width)}×${round(box.height)}`);
      qa.advisory({ id: "V5.2", title: "Text inset: eyebrow/rule x (Figma 82; site container px-10 = 40)", category: "layout",
        note: "About container inset differs from Figma on every section (cf. PQA-023 item 3); not part of finding #3." }, `${round(eyebrow.x)}`);
      await qa.attach();
    });
  }
});

/** Pearson r of luminance over pixels outside `exclude`, best over ±4px shifts. */
async function correlate(
  browser: Browser, reference: Buffer, actual: Buffer, exclude: Rect[], region: Rect, size: { W: number; H: number },
  options: { actDy?: number } = {},
) {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    return await page.evaluate(
      async ({ refB64, actB64, exclude, region, W, H, actDy }) => {
        const lum = async (b64: string, dy: number) => {
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          await img.decode();
          const c = new OffscreenCanvas(W, H);
          const ctx = c.getContext("2d")!;
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, W, H);
          ctx.drawImage(img, 0, dy);
          const d = ctx.getImageData(0, 0, W, H).data;
          const out = new Float32Array(W * H);
          for (let i = 0; i < W * H; i++) out[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
          return out;
        };
        const [f, a] = await Promise.all([lum(refB64, 0), lum(actB64, actDy)]);
        const M = 4;
        const inside = (x: number, y: number, r: { x: number; y: number; width: number; height: number }, m: number) =>
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
      { refB64: reference.toString("base64"), actB64: actual.toString("base64"), exclude, region, W: size.W, H: size.H, actDy: options.actDy ?? 0 },
    );
  } finally {
    await context.close();
  }
}

test.describe("Gate B — Figma frame vs browser capture", () => {
  test("EN 1440 — composition ink geometry and pattern correlation", async ({ page, browser }, testInfo) => {
    const s = await open(page, "en", VIEWPORTS[0]);
    const qa = qaLedger(testInfo, "en", "1440×1080");
    const p = parts(s);
    const reference = readFileSync(ref.screenshot("en")!.path);
    const eyebrow = (await docRect(p.eyebrow))!;
    const top = eyebrow.y - EYEBROW.y;
    const shoot = async () => page.screenshot({ fullPage: true, animations: "disabled", caret: "hide", clip: { x: 0, y: top, width: FRAME.width, height: FRAME.height } });
    const actual = await shoot();

    const self = await compareImages(browser, reference, reference, []);
    qa.match({ id: "VB.0", title: "Self-compare (Figma vs itself) mismatch = 0", category: "visual" }, self.mismatchRatio, 0);

    // Composition ink (capsule + photo): drawn pixels in the right-hand band, Figma crop vs build crop.
    const band = { x: 640, y: 0, width: FRAME.width - 640, height: FRAME.height };
    const ink = await measureInk(browser, reference, actual, [band], [band]);
    const geo = inkGeometryMatches(ink.act[0], ink.ref[0]);
    qa.match({ id: "VB.1", title: "Composition ink bounding box (size within max(2px,5%), centre within 2px)", category: "visual" },
      geo.ok ? "match" : geo.detail, "match");
    qa.match({ id: "VB.2", title: `Composition visible area vs Figma (${ink.act[0].pixels} / ${ink.ref[0].pixels} px, ±5%)`, category: "visual" },
      Math.abs(ink.act[0].pixels / ink.ref[0].pixels - 1) <= 0.05, true);

    // Faint pattern + crosses: correlation outside every content box of either image.
    const capsule = (await docRect(p.capsule)) ?? { x: 0, y: 0, width: 0, height: 0 };
    const photo = (await docRect(p.photo)) ?? { x: 0, y: 0, width: 0, height: 0 };
    // Every content box of EITHER image is excluded (text, eyebrow, rule), not only the capsule and photo.
    const textBoxes = await s.evaluate((sec) => [sec.querySelector("h2")!, ...sec.querySelectorAll("p")].map((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
    }));
    const exclude: Rect[] = [
      ...textBoxes.map((r) => ({ ...r, y: r.y - top })),
      ...[HEADING, ref.node("406:3576"), EYEBROW, RULE].map((b) => ({ x: b.x, y: b.y, width: b.width, height: b.height })),
      { x: capsule.x, y: capsule.y - top, width: capsule.width, height: capsule.height },
      { x: photo.x, y: photo.y - top, width: photo.width, height: photo.height },
      { x: L.capsule.x, y: L.capsule.y, width: L.capsule.width, height: L.capsule.height },
      { x: L.photo.x, y: L.photo.y, width: L.photo.width, height: L.photo.height },
    ];
    const region = { x: 660, y: 0, width: FRAME.width - 660, height: FRAME.height };
    const size = { W: FRAME.width, H: FRAME.height };
    const refSelf = await correlate(browser, reference, reference, exclude, region, size);
    qa.match({ id: "VB.3", title: "Self-compare (Figma vs itself) r = 1 at (0,0)", category: "visual" },
      `${round(refSelf.best.r, 3)}@${refSelf.best.dx},${refSelf.best.dy}`, "1@0,0");
    const measured = await correlate(browser, reference, actual, exclude, region, size);
    const hideTargets = s.locator("[data-testid=about-vision-pattern], [data-testid=about-vision-cross]");
    const hideCount = await hideTargets.count();
    await hideTargets.evaluateAll((els) => els.forEach((e) => ((e as HTMLElement).style.visibility = "hidden")));
    const hiddenShot = await shoot();
    await hideTargets.evaluateAll((els) => els.forEach((e) => ((e as HTMLElement).style.visibility = "")));
    const hidden = await correlate(browser, reference, hiddenShot, exclude, region, size);
    const moved = await correlate(browser, reference, actual, exclude, region, size, { actDy: 40 });
    const detail = `r ${round(measured.best.r, 3)} at (${measured.best.dx},${measured.best.dy}); hidden ${round(hidden.best.r, 3)}, moved +40px ${round(moved.best.r, 3)}; n=${measured.pixels}; pattern/cross layers found: ${hideCount}`;
    qa.advisory({ id: "VB.4r", title: "Pattern correlation detail (measured values)", category: "visual", note: "Fixed in advance: r ≥ 0.8 at shift ≤ 2px; controls < 0.8." }, detail);
    const row = { id: "VB.4", title: `Pattern + crosses luminance correlation vs Figma (r ≥ ${R_MIN}, shift ≤ ±${TOL}px)`, category: "visual" as const };
    if (!(hidden.best.r < R_MIN && moved.best.r < R_MIN)) {
      qa.advisory({ ...row, note: "A negative control scored ≥ 0.8: not gated." }, detail);
    } else {
      qa.match(row, measured.best.r >= R_MIN && Math.abs(measured.best.dx) <= TOL && Math.abs(measured.best.dy) <= TOL ? "match" : detail, "match");
    }
    qa.match({ id: "VB.5", title: "Control: layers hidden scores below the threshold", category: "visual" }, hidden.best.r < R_MIN, true);
    qa.match({ id: "VB.6", title: "Control: capture moved 40px down scores below the threshold", category: "visual" }, moved.best.r < R_MIN, true);

    const cmp = await compareImages(browser, reference, actual, [
      { name: "Section", x: 0, y: 0, width: FRAME.width, height: FRAME.height },
      { name: "Composition", x: 640, y: 0, width: FRAME.width - 640, height: FRAME.height },
    ]);
    for (const r of cmp.regions) {
      qa.advisory({ id: `VB.7.${r.name}`, title: `Pixel mismatch — ${r.name}`, category: "visual", note: "Evidence only." }, `${(r.mismatchRatio * 100).toFixed(2)}%`);
    }
    if (process.env.QA_EVIDENCE_DIR) {
      mkdirSync(process.env.QA_EVIDENCE_DIR, { recursive: true });
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/browser-actual.png`, actual);
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/overlay.png`, cmp.overlayPng);
    }
    await testInfo.attach("figma-reference.png", { body: reference, contentType: "image/png" });
    await testInfo.attach("browser-actual.png", { body: actual, contentType: "image/png" });
    await testInfo.attach("overlay.png", { body: cmp.overlayPng, contentType: "image/png" });
    await qa.attach();
  });
});

test.describe("Responsive and RTL", () => {
  for (const locale of ["en", "ar"] as const) {
    for (const vp of VIEWPORTS) {
      test(`${locale.toUpperCase()} ${vp.width}×${vp.height} — wrapping, layering, overflow`, async ({ page }, testInfo) => {
        const s = await open(page, locale, vp);
        const qa = qaLedger(testInfo, locale, `${vp.width}×${vp.height}`);
        const p = parts(s);
        const box = (await docRect(s))!;
        const h2 = (await docRect(p.h2))!;
        const rule = (await docRect(p.rule))!;
        qa.match({ id: "VR.1", title: "No horizontal overflow", category: "responsive" },
          await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        qa.match({ id: "VR.2", title: "Heading inside the viewport (not clipped)", category: "responsive" },
          h2.x >= -0.5 && h2.x + h2.width <= vp.width + 0.5, true);
        qa.match({ id: "VR.3", title: "Accent rule beside the heading and inside its vertical extent", category: "responsive" },
          rule.y >= h2.y - 0.5 && rule.y + rule.height <= h2.y + h2.height + 0.5, true);
        const capsule = await docRect(p.capsule);
        const photo = await docRect(p.photo);
        qa.match({ id: "VR.4", title: "Capsule and photo fully inside the viewport width (essential content not clipped)", category: "responsive" },
          !!capsule && !!photo && capsule.x >= -0.5 && capsule.x + capsule.width <= vp.width + 0.5 && photo.x >= -0.5 && photo.x + photo.width <= vp.width + 0.5, true);
        qa.match({ id: "VR.5", title: "Photo sits inside the capsule's width and above its bottom edge (cut-out over the capsule)", category: "layout" },
          !!capsule && !!photo && photo.x >= capsule.x - 1 && photo.x + photo.width <= capsule.x + capsule.width + 1 &&
            Math.abs(photo.y + photo.height - (capsule.y + capsule.height)) <= 2, true);
        qa.match({ id: "VR.6", title: "Photo and capsule keep their Figma aspect ratios", category: "responsive" },
          !!capsule && !!photo && Math.abs(capsule.width / capsule.height / (L.capsule.width / L.capsule.height) - 1) < 0.01 &&
            Math.abs(photo.width / photo.height / (L.photo.width / L.photo.height) - 1) < 0.01, true);
        qa.match({ id: "VR.7", title: "Section clips; composition never widens the page", category: "responsive" },
          `${await s.evaluate((el) => getComputedStyle(el).overflowX)}`, "hidden");
        qa.match({ id: "VR.8", title: "Document direction", category: "rtl" }, await page.evaluate(() => document.documentElement.dir), locale === "ar" ? "rtl" : "ltr");
        if (vp.width !== 1440) {
          qa.unavailable({ id: "VR.9", title: "Figma frame at this width", category: "responsive",
            note: "Only 1440 frames exist; the composition scales with the width (PQA-030)." });
        }
        qa.advisory({ id: "VR.10", title: "Section box", category: "layout", note: "Regression evidence." }, `${round(box.width)}×${round(box.height)}`);
        await qa.attach();
      });
    }
  }
});
