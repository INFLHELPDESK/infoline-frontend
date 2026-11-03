import { readFileSync, writeFileSync } from "node:fs";
import type { Browser, Locator, Page, TestInfo } from "@playwright/test";
import { expect, test, waitForHydration } from "../e2e/support/fixtures";
import { messages, type Locale } from "../e2e/support/messages";
import { measureLayoutShift, scrollElementTo, waitForAnimationsSettled, waitForStableStyle } from "../e2e/support/motion";
import { compareImages } from "./support/compare";
import { IDENTITY_MARGIN, identityVerdict, inkGeometryMatches, measureInk, type CropBox } from "./support/ink";
import { qaLedger, within } from "./support/qa";
import { hexToRgb, loadReferences } from "./support/reference";
import { hideOverlays, renderedFonts } from "./support/stable";

/**
 * Home Clients (components/sections/home-1/clients.tsx, Figma 406:4287) and
 * Partners (components/sections/home/partners.tsx, Figma 406:4226). Verify only.
 *
 * Gate A — computed styles, rendered faces and geometry; expected values from
 *          the cached variables / metadata / design-context extract.
 * Gate B — Figma PNG vs browser capture, with the marquee paused at the phase
 *          Figma draws (rows centred). No acceptance budget is derived from the
 *          measured build. Verdicts come only from predefined constraints,
 *          measured independently on both images (support/ink.ts):
 *            · ink geometry — drawn-pixel bounds within max(2px, 5%) in size
 *              and 2px in centre;
 *            · visual identity — each element's ink best matches its own
 *              Figma element (margin ≥ 0.05; below that: identity uncertain).
 *          The pixel-mismatch ratio r = measured / negative control (element
 *          hidden) is evidence only (advisory); r ≥ 0.9 with every
 *          constraint passing is flagged for review, not failed. (Revised
 *          2026-11-03: the earlier ratio rule failed thin text and thin logos
 *          whose geometry, style, font and identity all match.)
 * Motion — Figma holds static frames only, so marquee motion is checked
 *          against the implementation contract, not Figma (see the manifest).
 */

const partnersRef = loadReferences("home-partners");
const clientsRef = loadReferences("home-clients");
const pDC = JSON.parse(readFileSync(`${__dirname}/figma/home-partners/406-4226.design-context.extract.json`, "utf8"));
const cDC = JSON.parse(readFileSync(`${__dirname}/figma/home-clients/406-4287.design-context.extract.json`, "utf8"));
const TOL = 2;

const partnersSection = (page: Page) => page.locator("section:has(ul.partners-track)");
const clientsSection = (page: Page) => page.locator("main > section").nth(1);

/** The first element at or under `l` that carries its own text (for CDP fonts). */
const textEl = (l: Locator) => l.locator("xpath=descendant-or-self::*[text()[normalize-space()]]").first();
const css = (el: Locator, prop: string) => el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);
/** Any CSS colour (rgb, lab, oklab, color-mix result…) → "rgba(r, g, b, a)" via canvas. */
const colour = (el: Locator, prop: string) =>
  el.evaluate((n, p) => {
    const ctx = new OffscreenCanvas(1, 1).getContext("2d")!;
    ctx.fillStyle = getComputedStyle(n).getPropertyValue(p);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 100) / 100})`;
  }, prop);
const rgba = (hex: string, a = 1) => hexToRgb(hex).replace("rgb(", "rgba(").replace(")", `, ${a})`);
const sameColour = (a: string, e: string) => {
  const p = (s: string) => s.match(/[\d.]+/g)!.map(Number);
  const [x, y] = [p(a), p(e)];
  return x.slice(0, 3).every((v, i) => Math.abs(v - y[i]) <= 2) && Math.abs(x[3] - y[3]) <= 0.02;
};
const faces = async (page: Page, l: Locator) =>
  (await renderedFonts(page, textEl(l))).filter((f) => f.glyphCount > 0).map((f) => `${f.postScriptName}${f.isCustomFont ? "" : " (system)"}`).join(", ");
const figmaStyle = (ref: typeof partnersRef, token: string) => /style: ([^,]+)/.exec(ref.token(token))![1].replace(/\s+/g, "");

async function rectIn(section: Locator, el: Locator, content = false) {
  const s = (await section.boundingBox())!;
  const e = await el.evaluate((node, content) => {
    const r = node.getBoundingClientRect();
    if (!content) return { x: r.x, y: r.y, width: r.width, height: r.height };
    const cs = getComputedStyle(node);
    const [t, ri, b, l] = ["top", "right", "bottom", "left"].map((k) => parseFloat(cs.getPropertyValue(`padding-${k}`)));
    return { x: r.x + l, y: r.y + t, width: r.width - l - ri, height: r.height - t - b };
  }, content);
  const r = (n: number) => Math.round(n * 10) / 10;
  return { x: r(e.x - s.x), y: r(e.y - s.y), width: r(e.width), height: r(e.height) };
}

/**
 * Settle a section: scroll it in, hydrate, wait for fonts, for every image that
 * intersects the viewport (the partner logos are lazy and the off-screen
 * marquee copies never load), and for finite + JS-driven reveals.
 */
async function settleSection(page: Page, section: Locator) {
  await waitForHydration(page);
  await scrollElementTo(page, section, 0);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Lazy images inside an overflow:hidden marquee track never intersect the
  // viewport and never load. Force every image in the section to load (test
  // side only: same sources, only the fetch timing changes), then wait for all.
  await section.evaluate((el) => el.querySelectorAll("img[loading=lazy]").forEach((img) => img.setAttribute("loading", "eager")));
  await page.waitForFunction(
    (el) => [...el!.querySelectorAll("img")].every((img) => img.complete && img.naturalWidth > 0),
    await section.elementHandle(),
  );
  await waitForAnimationsSettled(section);
  for (const item of await section.locator("[style*='opacity'], [style*='transform'], [style*='filter']").all()) {
    await waitForStableStyle(item, ["transform", "opacity", "filter"]);
  }
}

async function open(page: Page, locale: Locale, width: number, which: (p: Page) => Locator, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto(`/${locale}`);
  const section = which(page);
  await settleSection(page, section);
  return section;
}

/**
 * Pause both marquee rows at the phase Figma draws: the first pill of each row
 * at the Figma x (row frames are justify-center). Solves T(t) ≡ target (mod one
 * group) from two samples of the linear keyframes, so it holds for either
 * direction and any duration.
 */
async function alignMarqueeToFigma(section: Locator, firstPillX: number[]) {
  return section.evaluate((sec, targets) => {
    const s = sec.getBoundingClientRect();
    return [...sec.querySelectorAll<HTMLElement>("ul.partners-track")].map((track, i) => {
      const anim = track.getAnimations()[0];
      anim.pause();
      const duration = Number(anim.effect!.getComputedTiming().duration);
      const tx = (t: number) => {
        anim.currentTime = t;
        return new DOMMatrix(getComputedStyle(track).transform).m41;
      };
      const t0 = tx(0);
      const slope = (tx(duration / 2) - t0) / (duration / 2);
      const group = track.scrollWidth / 4;
      const li = track.firstElementChild as HTMLElement;
      const ml = parseFloat(getComputedStyle(li).marginLeft);
      const base = track.parentElement!.getBoundingClientRect().left - s.left + ml; // pill left at T = 0
      const wanted = targets[i] - base; // desired T, modulo one group
      let t = ((((wanted - t0) / slope) % ((group / Math.abs(slope)) )) + group / Math.abs(slope)) % (group / Math.abs(slope));
      t = Math.min(t, duration - 1);
      tx(t);
      return { row: i, currentTime: Math.round(t), translate: Math.round(new DOMMatrix(getComputedStyle(track).transform).m41 * 10) / 10 };
    });
  }, firstPillX);
}

type Crop = {
  name: string;
  node: string;
  figma: CropBox;
  actual: { x: number; y: number };
  /** Identity group: the element must best-match its own Figma element within the group. */
  group?: string;
  /** Sub-crop for ink measurement (e.g. the logo box inside a pill); defaults to the crop. */
  ink?: { figma: CropBox; actual: CropBox };
};

async function gateB(
  browser: Browser,
  testInfo: TestInfo,
  qa: ReturnType<typeof qaLedger>,
  reference: Buffer,
  actual: Buffer,
  broken: Buffer,
  crops: Crop[],
  frameRegions: { name: string; x: number; y: number; width: number; height: number }[],
  prefix: string,
) {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const frame = await compareImages(browser, reference, actual, frameRegions);
  const self = await compareImages(browser, reference, reference, []);
  const rows: { name: string; node: string; measured: number; control: number; r: number }[] = [];
  const diffs: [string, Buffer][] = [];
  for (const c of crops) {
    const crop = { reference: c.figma, actual: { ...c.figma, x: c.actual.x, y: c.actual.y } };
    const m = await compareImages(browser, reference, actual, [], { crop });
    const k = await compareImages(browser, reference, broken, [], { crop });
    rows.push({ name: c.name, node: c.node, measured: m.mismatchRatio, control: k.mismatchRatio, r: k.mismatchRatio ? m.mismatchRatio / k.mismatchRatio : 0 });
    diffs.push([`diff-${c.name.replace(/[^a-z0-9]+/gi, "-")}.png`, m.diffPng]);
  }
  const files: [string, Buffer][] = [
    ["figma-reference.png", reference],
    ["browser-actual.png", actual],
    ["negative-control.png", broken],
    ["diff.png", frame.diffPng],
    ["overlay.png", frame.overlayPng],
    ...diffs,
  ];
  for (const [n, b] of files) {
    writeFileSync(testInfo.outputPath(n), b);
    await testInfo.attach(n, { body: b, contentType: "image/png" });
  }
  const metrics = { rule: "r = measured/control is evidence only; verdicts from ink geometry + identity (see ink.json)", frame: { size: [frame.actualSize, frame.referenceSize], mismatch: frame.mismatchRatio, regions: frame.regions }, crops: rows, self: self.mismatchRatio };
  writeFileSync(testInfo.outputPath("metrics.json"), JSON.stringify(metrics, null, 2));
  await testInfo.attach("metrics.json", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });

  qa.match({ id: `${prefix}B.size`, title: "Capture size equals the Figma frame", category: "visual" },
    `${frame.actualSize.width}×${frame.actualSize.height}`, `${frame.referenceSize.width}×${frame.referenceSize.height}`);
  qa.advisory({ id: `${prefix}B.frame`, title: "Frame-level mismatch", category: "visual", note: "Fixed Figma coordinates; mixes layout, rasterisation and imagery. Review diff.png / overlay.png." },
    `${pct(frame.mismatchRatio)}; ${frame.regions.map((r) => `${r.name} ${pct(r.mismatchRatio)}`).join(", ")}`);
  // Predefined constraints, measured independently on both images.
  const inkCrop = (c: Crop) => c.ink ?? { figma: c.figma, actual: { ...c.figma, x: c.actual.x, y: c.actual.y } };
  const ink = await measureInk(browser, reference, actual, crops.map((c) => inkCrop(c).figma), crops.map((c) => inkCrop(c).actual));
  const identity: { name: string; expected: number; verdict: ReturnType<typeof identityVerdict> | null }[] = [];
  const MIN_INK = 20; // px; below this there is nothing to measure
  for (const [i, c] of crops.entries()) {
    const f = ink.ref[i];
    const a = ink.act[i];
    const r = rows[i];
    const evidence = `measured ${pct(r.measured)}, control ${pct(r.control)}, r=${r.r.toFixed(2)}`;
    let constraintsPass = true;
    if (f.pixels < MIN_INK || a.pixels < MIN_INK) {
      qa.advisory({ id: `${prefix}B.ink.${c.name}`, title: `${c.name} ink geometry`, category: "visual", note: "Too little ink to measure." }, `${a.pixels} / ${f.pixels} px`);
    } else {
      const g = inkGeometryMatches(a, f);
      constraintsPass &&= g.ok;
      qa.match({ id: `${prefix}B.ink.${c.name}`, title: `${c.name} ink geometry vs Figma ${c.node} (size ±max(2px,5%), centre ±2px)`, category: "visual" },
        g.ok ? "within constraint" : g.detail, "within constraint", (x, e) => x === e);
    }
    if (c.group !== undefined) {
      const members = crops.map((m, k) => [m, k] as const).filter(([m]) => m.group === c.group).map(([, k]) => k);
      const row = members.map((k) => ink.distance[i][k]);
      const v = identityVerdict(row, members.indexOf(i));
      const bestName = crops[members[v.best]].name;
      identity.push({ name: c.name, expected: i, verdict: v });
      const detail = `best match ${bestName} (distance ${v.distance.toFixed(2)}, margin ${v.margin.toFixed(2)})`;
      if (v.status === "uncertain") {
        constraintsPass = false;
        qa.advisory({ id: `${prefix}B.id.${c.name}`, title: `${c.name} visual identity — UNCERTAIN`, category: "assets",
          note: `No reference element wins by ≥ ${IDENTITY_MARGIN}; identity not established.` }, detail);
      } else {
        constraintsPass &&= v.status === "match";
        qa.match({ id: `${prefix}B.id.${c.name}`, title: `${c.name} draws the logo Figma shows at ${c.node}`, category: "assets" },
          v.status === "match" ? "match" : `draws Figma's ${bestName}`, "match");
      }
    }
    const reviewNote = r.r >= 0.9 && constraintsPass
      ? "High pixel difference with every constraint passing: rasterisation/anti-aliasing. Review the crop diff."
      : "Evidence only; verdicts come from the ink and identity rows.";
    qa.advisory({ id: `${prefix}B.px.${c.name}`, title: `${c.name} pixel difference (aligned crop)`, category: "visual", note: reviewNote }, evidence);
  }
  const metricsInk = { constraints: { inkSize: "max(2px, 5%)", inkCentre: "2px", identityMargin: IDENTITY_MARGIN }, ink: crops.map((c, i) => ({ name: c.name, figma: ink.ref[i], build: ink.act[i] })), identity };
  writeFileSync(testInfo.outputPath("ink.json"), JSON.stringify(metricsInk, null, 2));
  await testInfo.attach("ink.json", { body: JSON.stringify(metricsInk, null, 2), contentType: "application/json" });
  expect(self.mismatchRatio, "comparator self-check").toBe(0);
  return { identity, crops };
}

/* ───────────────────────────── Clients ───────────────────────────── */

test.describe("Clients — Gate A (EN 1440)", () => {
  test("typography, colours, geometry and assets vs Figma 406:4287", async ({ page }, testInfo) => {
    const s = await open(page, "en", 1440, clientsSection);
    const copy = messages.en.HomeV1.clients;
    await expect(s.locator("h2")).toHaveText(copy.title);
    const qa = qaLedger(testInfo, "en", "1440×900");
    const ref = clientsRef;
    const px = (t: string) => `${ref.token(t)}px`;
    const h2 = s.locator("h2");
    const p = s.locator("h2 + p");
    const eyebrow = s.locator("span.rounded-full").first();
    const items = s.locator("ul > li");

    qa.match({ id: "C1", title: "Section height (frame 406:4287)", category: "layout" }, (await s.boundingBox())!.height, 454, within(TOL));

    // Title — heading/2xl/bold.
    qa.match({ id: "C2.1", title: "Title size / line-height", category: "typography" },
      `${await css(h2, "font-size")} / ${await css(h2, "line-height")}`, `${px("font-size/text-4xl")} / ${px("line-height/leading-44")}`);
    qa.match({ id: "C2.2", title: "Title weight (font-weight/Black)", category: "typography",
      note: "In English 700 and 800 both render Avenir Black (see C2.3); in Arabic 700 renders Tajawal Bold, not ExtraBold." },
      await css(h2, "font-weight"), ref.token("font-weight/Black"));
    qa.match({ id: "C2.3", title: "Title rendered face", category: "typography" }, await faces(page, h2), `Avenir-${figmaStyle(ref, "heading/2xl/bold")}`);
    qa.match({ id: "C2.4", title: "Title colour (content/base/primary)", category: "colour" }, await css(h2, "color"), hexToRgb(ref.token("content/base/primary")));
    // Description — body/lg/regular.
    qa.match({ id: "C3.1", title: "Description size / line-height / weight", category: "typography" },
      `${await css(p, "font-size")} / ${await css(p, "line-height")} / ${await css(p, "font-weight")}`,
      `${px("font-size/text-lg")} / ${px("line-height/leading-24")} / ${ref.token("font-weight/Roman")}`);
    qa.match({ id: "C3.2", title: "Description rendered face", category: "typography" }, await faces(page, p), `Avenir-${figmaStyle(ref, "body/lg/regular")}`);
    qa.match({ id: "C3.3", title: "Description colour (content/base/secondary)", category: "colour" }, await css(p, "color"), hexToRgb(ref.token("content/base/secondary")));
    // Eyebrow (light chip).
    qa.match({ id: "C4.1", title: "Eyebrow fill / border (surface/base/layer-1, border/neutral/subtle)", category: "colour" },
      `${await colour(eyebrow, "background-color")} ${await css(eyebrow, "border-top-width")} ${await colour(eyebrow, "border-top-color")}`,
      `${rgba(ref.token("surface/base/layer-1"))} 1px ${rgba(ref.token("border/neutral/subtle"))}`,
      (a, e) => {
        // Split into colour and length tokens; rgba(...) contains spaces.
        const parts = (x: string) => x.match(/rgba\([^)]*\)|\S+/g)!;
        const [pa, pe] = [parts(a), parts(e)];
        return pa.length === pe.length && pa.every((v, i) => (v.startsWith("rgba") ? sameColour(v, pe[i]) : v === pe[i]));
      });
    qa.match({ id: "C4.2", title: "Eyebrow text colour (content/brand/default)", category: "colour" }, await css(eyebrow, "color"), hexToRgb(ref.token("content/brand/default")));
    qa.decision({ id: "C4.3", title: "Eyebrow face (Figma: Inter Medium 18, tracking −0.72px)", category: "typography", note: "PQA-020 item 2: the site uses Avenir Medium for eyebrows." },
      `${await faces(page, eyebrow)}, ${await css(eyebrow, "font-size")}, ${await css(eyebrow, "letter-spacing")}`, cDC.eyebrow.font);

    // Geometry (frame-relative, ±2px).
    const geo = async (id: string, title: string, el: Locator, node: string, keys: ("x" | "y" | "width" | "height")[], content = true) => {
      const a = await rectIn(s, el, content);
      const f = ref.node(node);
      for (const k of keys) qa.match({ id: `${id}.${k}`, title: `${title} ${k} (Figma ${node})`, category: "layout" }, a[k], f[k], within(TOL));
    };
    await geo("G1", "Eyebrow", eyebrow, "406:4289", ["y", "height"], false);
    const eb = await rectIn(s, eyebrow);
    qa.decision({ id: "G1.w", title: "Eyebrow width / x", category: "layout", note: "Follows the eyebrow face (PQA-020 item 2)." },
      `${eb.width} @ ${eb.x}`, `${ref.node("406:4289").width} @ ${ref.node("406:4289").x}`);
    await geo("G2", "Title", h2, "406:4290", ["x", "y", "width", "height"]);
    await geo("G3", "Description", p, "406:4291", ["x", "y", "width", "height"]);

    // Logo row: ten slots, centres on the Figma slot centres; logo content size.
    const slots = ["406:4293", "406:4295", "406:4299", "406:4301", "406:4305", "406:4307", "406:4309", "406:4311", "406:4313", "406:4315"];
    qa.match({ id: "G4", title: "Logo count", category: "assets" }, await items.count(), slots.length);
    const live = await items.evaluateAll((lis, sx) =>
      lis.map((li) => {
        const img = li.querySelector("img")!;
        const r = img.getBoundingClientRect();
        // object-contain: the drawn logo is the natural ratio fitted into the box.
        const k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
        const w = img.naturalWidth * k;
        const h = img.naturalHeight * k;
        return { cx: r.left + r.width / 2 - (sx as number), cy: r.top + r.height / 2, box: [r.width, r.height], drawn: [w, h], alt: img.alt };
      }), (await s.boundingBox())!.x);
    const sTop = (await s.boundingBox())!.y;
    for (const [i, id] of slots.entries()) {
      const f = ref.node(id);
      qa.match({ id: `G5.${i + 1}`, title: `Logo ${i + 1} centre x (slot ${id})`, category: "layout" }, Math.round(live[i].cx * 10) / 10, f.x + f.width / 2, within(TOL));
      qa.match({ id: `G6.${i + 1}`, title: `Logo ${i + 1} centre y (row 406:4292)`, category: "layout" }, Math.round((live[i].cy - sTop) * 10) / 10, f.y + f.height / 2, within(TOL));
    }
    // Logo rendering (size, crop, ink) is judged by the Gate B slot crops: the
    // exported assets are whole Figma slots (natural 119×88 incl. padding), so a
    // drawn-box vs inner-image-box comparison would not measure the logo.
    // Asset identity is established from pixels in Gate B (support/ink.ts), not
    // from filenames, alt text or Figma layer names.
    // PQA-016 cross-check: the two Figma tooltips name slots 2 and 4.
    qa.match({ id: "A2", title: "Slot 2 / 4 identities match the Figma tooltip names (PQA-016)", category: "content" },
      `${live[1].alt} | ${live[3].alt}`, `${cDC.tooltips["406:4297"].text} | ${cDC.tooltips["406:4303"].text}`);
    qa.decision({ id: "I1", title: "Logo name tooltips (Figma 406:4297 / 406:4303, opacity 0)", category: "content",
      note: "Figma has hidden name tooltips on two logo slots; the build has none. Confirm whether hover/focus tooltips are intended. New — not in the issue log." },
      `${await s.locator("[role=tooltip]").count()} tooltip elements; img title attrs: ${await s.locator("img[title]").count()}`, cDC.tooltips.style);
    await qa.attach();
  });

  test("Gate B — capture vs 406-4287.en.1440.png", async ({ page, browser }, testInfo) => {
    const s = await open(page, "en", 1440, clientsSection);
    await hideOverlays(page);
    const reference = readFileSync(clientsRef.screenshot("en")!.path);
    const shot = () => s.screenshot({ animations: "disabled", caret: "hide" });
    const actual = await shot();
    const qa = qaLedger(testInfo, "en", "1440×900");
    const crops: Crop[] = [];
    const add = async (name: string, node: string, el: Locator, content: boolean) => {
      const a = await rectIn(s, el, content);
      const f = clientsRef.node(node);
      // Slots: centre the Figma-size crop on the live element's centre.
      const x = content ? a.x : a.x + (a.width - f.width) / 2;
      const y = content ? a.y : a.y + (a.height - f.height) / 2;
      crops.push({ name, node, figma: f, actual: { x, y } });
    };
    await add("title", "406:4290", s.locator("h2"), true);
    await add("description", "406:4291", s.locator("h2 + p"), true);
    const slots = ["406:4293", "406:4295", "406:4299", "406:4301", "406:4305", "406:4307", "406:4309", "406:4311", "406:4313", "406:4315"];
    for (const [i, id] of slots.entries()) {
      await add(`logo ${i + 1}`, id, s.locator("ul > li").nth(i), false);
      crops.at(-1)!.group = "logos";
    }
    const alts = await s.locator("ul > li img").evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).alt));
    await s.locator("h2, h2 + p, ul img").evaluateAll((els) => els.forEach((e) => ((e as HTMLElement).style.visibility = "hidden")));
    const broken = await shot();
    const { identity } = await gateB(browser, testInfo, qa, reference, actual, broken, crops,
      [{ ...clientsRef.node("406:4288"), name: "header" }, { ...clientsRef.node("406:4292"), name: "logo row" }], "C");

    // Alt text vs what the slot draws. Gated only where Figma itself names the
    // organisation (the hidden tooltips over slots 2 and 4); elsewhere the
    // organisation is not established by any reference → recorded separately.
    const figmaNames: Record<number, string> = { 1: cDC.tooltips["406:4297"].text, 3: cDC.tooltips["406:4303"].text };
    for (const [k, alt] of alts.entries()) {
      const v = identity.find((x) => x.name === `logo ${k + 1}`)!.verdict!;
      const drawsSlot = v.status === "uncertain" ? null : v.best; // index within the logo group
      if (drawsSlot !== null && drawsSlot in figmaNames) {
        qa.match({ id: `A3.${k + 1}`, title: `Logo ${k + 1} alt names the organisation Figma names for the drawn logo`, category: "assets" }, alt, figmaNames[drawsSlot]);
      } else if (drawsSlot !== null && drawsSlot !== k) {
        qa.advisory({ id: `A4.${k + 1}`, title: `Logo ${k + 1} identity — organisation UNCERTAIN (alt vs drawn logo)`, category: "assets",
          note: `Slot ${k + 1} draws the logo Figma shows in slot ${drawsSlot + 1}, but no reference names that organisation, so whether alt "${alt}" is wrong is not established by a reference. Agent inspection (each file rendered alone, 2026-11-03): see 2026-11-03.client-asset-files-rendered.png.` },
          `alt "${alt}" · draws Figma slot ${drawsSlot + 1}`);
      }
    }
    await qa.attach();
  });
});

/* ───────────────────────────── Partners ───────────────────────────── */

test.describe("Partners — Gate A (EN 1440)", () => {
  test("typography, colours, geometry, glows and pills vs Figma 406:4226", async ({ page }, testInfo) => {
    const s = await open(page, "en", 1440, partnersSection);
    const qa = qaLedger(testInfo, "en", "1440×900");
    const ref = partnersRef;
    const px = (t: string) => `${ref.token(t)}px`;
    const h2 = s.locator("h2");
    const p = s.locator("p").filter({ hasText: messages.en.Partners.description });
    const eyebrow = s.locator("span.rounded-full").first();

    qa.match({ id: "P1", title: "Section height (frame 406:4226)", category: "layout" }, (await s.boundingBox())!.height, 643, within(TOL));
    qa.match({ id: "P2.1", title: "Title size / line-height", category: "typography" },
      `${await css(h2, "font-size")} / ${await css(h2, "line-height")}`, `${px("font-size/text-4xl")} / ${px("line-height/leading-44")}`);
    qa.match({ id: "P2.2", title: "Title weight (font-weight/Black)", category: "typography" }, await css(h2, "font-weight"), ref.token("font-weight/Black"));
    qa.match({ id: "P2.3", title: "Title rendered face", category: "typography" }, await faces(page, h2), `Avenir-${figmaStyle(ref, "heading/2xl/bold")}`);
    qa.match({ id: "P2.4", title: "Title colour (content/base/inverse)", category: "colour" }, await css(textEl(h2), "color"), hexToRgb(ref.token("content/base/inverse")));
    qa.match({ id: "P3.1", title: "Description size / line-height / weight", category: "typography" },
      `${await css(p, "font-size")} / ${await css(p, "line-height")} / ${await css(p, "font-weight")}`,
      `${px("font-size/text-lg")} / ${px("line-height/leading-24")} / ${ref.token("font-weight/Roman")}`);
    qa.match({ id: "P3.2", title: "Description rendered face", category: "typography" }, await faces(page, p), `Avenir-${figmaStyle(ref, "body/lg/regular")}`);
    qa.match({ id: "P3.3", title: "Description colour (content/base/inverse-tertiary)", category: "colour" }, await css(p, "color"), hexToRgb(ref.token("content/base/inverse-tertiary")));
    qa.match({ id: "P4.1", title: "Eyebrow fill (white 20%)", category: "colour" }, await colour(eyebrow, "background-color"), pDC.eyebrow.background.replace(/,/g, ", "), sameColour);
    qa.match({ id: "P4.2", title: "Eyebrow text colour (content/brand/subtle)", category: "colour" }, await css(eyebrow, "color"), hexToRgb(ref.token("content/brand/subtle")));
    qa.decision({ id: "P4.3", title: "Eyebrow face (Figma: Inter Medium 18, tracking −0.72px)", category: "typography", note: "PQA-020 item 2." },
      `${await faces(page, eyebrow)}, ${await css(eyebrow, "font-size")}, ${await css(eyebrow, "letter-spacing")}`, pDC.eyebrow.font);

    const geo = async (id: string, title: string, el: Locator, node: string, keys: ("x" | "y" | "width" | "height")[], content = true) => {
      const a = await rectIn(s, el, content);
      const f = ref.node(node);
      for (const k of keys) qa.match({ id: `${id}.${k}`, title: `${title} ${k} (Figma ${node})`, category: "layout" }, a[k], f[k], within(TOL));
    };
    await geo("G1", "Eyebrow", eyebrow, "406:4231", ["y", "height"], false);
    // Centred, shrink-to-fit text: compare the centre (not Figma's fixed box width).
    const centred = async (id: string, title: string, el: Locator, node: string) => {
      const a = await rectIn(s, el, true);
      const f = ref.node(node);
      qa.match({ id: `${id}.cx`, title: `${title} centre x (Figma ${node})`, category: "layout" }, a.x + a.width / 2, f.x + f.width / 2, within(TOL));
      for (const k of ["y", "height"] as const) {
        qa.match({ id: `${id}.${k}`, title: `${title} ${k} (Figma ${node})`, category: "layout" }, a[k], f[k], within(TOL));
      }
      qa.advisory({ id: `${id}.w`, title: `${title} box width (Figma text box ${f.width})`, category: "layout", note: "Shrink-to-fit block; the centre is the comparable value." }, String(a.width));
    };
    await centred("G2", "Title", h2, "406:4232");
    await centred("G3", "Description", p, "406:4233");
    const rows = s.locator(".partners-marquee");
    await geo("G4", "Row 1", rows.nth(0), "406:4234", ["y", "height"], false);
    await geo("G5", "Row 2", rows.nth(1), "406:4259", ["y", "height"], false);

    // Pills.
    const pill = s.locator("ul.partners-track li").first();
    const logo = pill.locator("img");
    qa.match({ id: "P5.1", title: "Pill size", category: "layout" }, `${(await pill.boundingBox())!.width}×${(await pill.boundingBox())!.height}`, `${pDC.pill.width}×${pDC.pill.height}`);
    const pitch = await s.locator("ul.partners-track").first().evaluate((t) => {
      const [a, b] = [...t.children].map((c) => c.getBoundingClientRect().left);
      return Math.round((b - a) * 10) / 10;
    });
    qa.match({ id: "P5.2", title: "Pill pitch (width + row gap 16)", category: "layout" }, pitch, pDC.pill.width + pDC.rows.gap, within(0.5));
    qa.match({ id: "P5.3", title: "Pill fill (white 90%)", category: "colour" }, await colour(pill, "background-color"), "rgba(255, 255, 255, 0.9)", sameColour);
    qa.match({ id: "P5.4", title: "Pill border (1px white 40%)", category: "colour" },
      `${await css(pill, "border-top-width")} ${await colour(pill, "border-top-color")}`, "1px rgba(255, 255, 255, 0.4)",
      (a, e) => a.split(" ")[0] === e.split(" ")[0] && sameColour(a.slice(a.indexOf(" ") + 1), e.slice(e.indexOf(" ") + 1)));
    qa.match({ id: "P5.5", title: "Pill radius (radius/full)", category: "layout" }, parseFloat(await css(pill, "border-top-left-radius")) >= pDC.pill.height / 2, true);
    const lb = await logo.boundingBox();
    const pb = (await pill.boundingBox())!;
    qa.match({ id: "P5.6", title: "Logo box size / inset in pill", category: "layout" },
      `${lb!.width}×${lb!.height} @ ${Math.round((lb!.x - pb.x) * 10) / 10},${Math.round((lb!.y - pb.y) * 10) / 10}`,
      `86×44 @ 39.6,8`,
      (a) => { const n = a.match(/[\d.]+/g)!.map(Number); return Math.abs(n[0] - pDC.pill.logoBox.width) <= 1 && Math.abs(n[1] - pDC.pill.logoBox.height) <= 1 && Math.abs(n[2] - 39.575) <= 1 && Math.abs(n[3] - 8.005) <= 1; });
    qa.match({ id: "P5.7", title: "Logo opacity", category: "colour" }, Number(await css(logo, "opacity")), pDC.pill.logoBox.opacity);
    qa.advisory({ id: "P5.8", title: "Per-logo optical sizing", category: "assets",
      note: `Figma scales and crops each logo individually inside the 85.85×44 box (${pDC.pill.note}); the build fits every logo with object-contain. Judged per pill by the Gate B PB.ink.* (drawn-logo geometry) and PB.id.* rows.` },
      "object-contain, uniform");

    // Glows: Figma 406:4227 (top), 406:4228 (bottom-left), 406:4229 (bottom-right).
    const glows = await s.locator(":scope > div[aria-hidden]").evaluateAll((els, top) =>
      els.filter((e) => getComputedStyle(e).backgroundImage.includes("radial-gradient")).map((e) => {
        const r = e.getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.round(r.top - (top as number)), w: Math.round(r.width), h: Math.round(r.height), blur: getComputedStyle(e).filter };
      }), (await s.boundingBox())!.y);
    qa.match({ id: "P6.1", title: "Glow count (Figma: top + bottom-left + bottom-right)", category: "visual" }, glows.length, Object.keys(pDC.glows).length);
    const top = ref.node("406:4227");
    qa.match({ id: "P6.2", title: "Top glow size (Figma 406:4227)", category: "visual" },
      glows[0] ? `${glows[0].w}×${glows[0].h}` : "none", `${top.width}×${Math.round(top.height)}`,
      (a, e) => a.split("×").every((v, i) => Math.abs(Number(v) - Number(e.split("×")[i])) <= TOL));
    qa.match({ id: "P6.3", title: "Top glow top offset (Figma 406:4227)", category: "visual" }, glows[0]?.y ?? NaN, Math.round(top.y), within(TOL));
    qa.match({ id: "P6.4", title: "Glow blur", category: "visual" }, glows[0]?.blur ?? "none", `blur(${pDC.glows["406:4227"].blur})`);

    qa.decision({ id: "P7", title: "Marquee edge fade (5% mask)", category: "visual",
      note: "Figma's static frame shows hard row edges; the build masks 5% at each edge. New — not in the issue log." },
      await css(rows.first(), "mask-image"), "none");
    await qa.attach();
  });

  // The marquee exists only with motion allowed; it is paused before capture.
  test.describe("motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });
  test("Gate B — capture (marquee paused at the Figma phase) vs 406-4226.en.1440.png", async ({ page, browser }, testInfo) => {
    const s = await open(page, "en", 1440, partnersSection);
    await hideOverlays(page);
    const first = [partnersRef.node("406:4235").x, partnersRef.node("406:4260").x];
    const phase = await alignMarqueeToFigma(s, first);
    await testInfo.attach("marquee-phase.json", { body: JSON.stringify({ figmaFirstPillX: first, phase }, null, 2), contentType: "application/json" });
    // "allow": Playwright's "disabled" cancels infinite animations to their start.
    const shot = () => s.screenshot({ animations: "allow", caret: "hide" });
    const actual = await shot();
    const qa = qaLedger(testInfo, "en", "1440×900");
    const crops: Crop[] = [];
    // Centred, shrink-to-fit text: anchor the Figma-size crop on the live centre.
    const addText = async (name: string, node: string, el: Locator) => {
      const a = await rectIn(s, el, true);
      const f = partnersRef.node(node);
      crops.push({ name, node, figma: f, actual: { x: a.x + a.width / 2 - f.width / 2, y: a.y } });
    };
    const logoName = (src: string) => decodeURIComponent(/url=([^&]+)/.exec(src)?.[1] ?? src).split("/").pop()!.replace(/\.\w+$/, "");
    await addText("title", "406:4232", s.locator("h2"));
    await addText("description", "406:4233", s.locator("p").filter({ hasText: messages.en.Partners.description }));
    // Fully visible pills outside the 5% edge fade, matched to the live pill at the same x.
    const fade = 1440 * 0.05;
    const livePills = await s.locator("ul.partners-track").evaluateAll((tracks, sx) =>
      tracks.map((t) => [...t.children].map((li) => {
        const r = li.getBoundingClientRect();
        const img = li.querySelector("img")!;
        const ir = img.getBoundingClientRect();
        return { x: r.left - (sx as number), y: r.top, src: img.getAttribute("src"), logo: { x: ir.left - (sx as number), y: ir.top } };
      })), (await s.boundingBox())!.x);
    const sy = (await s.boundingBox())!.y;
    const pillIds = [
      ["406:4235", "406:4238", "406:4241", "406:4244", "406:4247", "406:4250", "406:4253", "406:4256"],
      ["406:4260", "406:4263", "406:4266", "406:4269", "406:4272", "406:4275", "406:4278", "406:4281", "406:4284"],
    ];
    const matched: string[] = [];
    pillIds.forEach((ids, row) => ids.forEach((id) => {
      const f = partnersRef.node(id);
      if (f.x < fade || f.x + f.width > 1440 - fade) return;
      const live = livePills[row].find((l) => Math.abs(l.x - f.x) <= 3);
      if (!live) return;
      matched.push(`${row + 1}:${id}→${logoName(live.src!)}`);
      // Ink is measured inside the logo box (design context: 85.85×43.99 at 39.575, 8.005 in the pill),
      // where the background is the flat pill fill; the pill's rounded corners show the dark section.
      const lb = pDC.pill.logoBox;
      const figmaLogo = { x: f.x + 39.575, y: f.y + 8.005, width: lb.width, height: lb.height };
      crops.push({
        name: `row ${row + 1} pill ${logoName(live.src!)}`, node: id, figma: f, actual: { x: live.x, y: live.y - sy },
        group: `row ${row + 1}`,
        ink: { figma: figmaLogo, actual: { ...figmaLogo, x: live.logo.x, y: live.logo.y - sy } },
      });
    }));
    qa.match({ id: "PB.phase", title: "Marquee phase aligned to Figma (pills matched within 3px)", category: "visual", note: matched.join(", ") },
      matched.length, pillIds.flat().filter((id) => { const f = partnersRef.node(id); return f.x >= fade && f.x + f.width <= 1440 - fade; }).length);
    await s.locator("h2, p, ul.partners-track img").evaluateAll((els) => els.forEach((e) => ((e as HTMLElement).style.visibility = "hidden")));
    const broken = await shot();
    await gateB(browser, testInfo, qa, readFileSync(partnersRef.screenshot("en")!.path), actual, broken, crops,
      [{ ...partnersRef.node("406:4230"), name: "header" }, { ...partnersRef.node("406:4234"), name: "row 1" }, { ...partnersRef.node("406:4259"), name: "row 2" }], "P");
    await qa.attach();
  });
  });
});

/* ───────────────────────── Partners motion ───────────────────────── */

type RowState = { duration: number; iterations: number; easing: string; group: number };

test.describe("Partners — marquee motion (implementation contract; no Figma motion reference)", () => {
  test.use({ reducedMotion: "no-preference" });

  test("timing, direction, speed, continuity, wrap, hover and scroll states", async ({ page }, testInfo) => {
    // Sample currentTime from the first frame, across hydration, to catch resets.
    await page.addInitScript(() => {
      const w = window as unknown as { __mq: number[][] };
      w.__mq = [];
      const tick = () => {
        const tracks = [...document.querySelectorAll<HTMLElement>("ul.partners-track")];
        if (tracks.length) w.__mq.push(tracks.map((t) => Number(t.getAnimations()[0]?.currentTime ?? -1)));
        if (performance.now() < 5000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const s = await open(page, "en", 1440, partnersSection);
    const qa = qaLedger(testInfo, "en", "1440×900 motion");

    const rows: RowState[] = await s.locator("ul.partners-track").evaluateAll((ts) =>
      ts.map((t) => {
        const a = t.getAnimations()[0];
        const timing = a.effect!.getComputedTiming();
        return { duration: Number(timing.duration), iterations: Number(timing.iterations), easing: String(timing.easing), group: t.scrollWidth / 4 };
      }));
    qa.match({ id: "M1", title: "Both rows: 40s per group, infinite, linear", category: "motion" },
      rows.map((r) => `${r.duration}/${r.iterations}/${r.easing}`).join(" | "), "40000/Infinity/linear | 40000/Infinity/linear");

    // CSS-driven states first: once script calls pause()/play() on a CSS
    // animation, the browser stops honouring animation-play-state (hover).
    const pos = () => s.evaluate((sec) => [...sec.querySelectorAll<HTMLElement>("ul.partners-track")].map((t) => new DOMMatrix(getComputedStyle(t).transform).m41));
    const state = () => s.evaluate((sec) => [...sec.querySelectorAll<HTMLElement>("ul.partners-track")].map((t) => getComputedStyle(t).animationPlayState).join("/"));
    await s.locator(".partners-marquee").first().hover();
    await expect.poll(state).toBe("paused/running");
    const held = (await pos())[0];
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    qa.match({ id: "M10", title: "Hover pauses only the hovered row (position held)", category: "motion" },
      `${await state()} Δ${Math.abs((await pos())[0] - held).toFixed(2)}`, "paused/running Δ0.00");
    // Resume: arm an in-page watcher first, then leave; it records the position
    // on the first frame the row runs again (no poll latency in the measurement).
    const resumed = page.evaluate(async () => {
      const t = document.querySelector<HTMLElement>("ul.partners-track")!;
      for (let i = 0; i < 600; i++) {
        await new Promise((r) => requestAnimationFrame(r));
        if (getComputedStyle(t).animationPlayState === "running") return new DOMMatrix(getComputedStyle(t).transform).m41;
      }
      return NaN;
    });
    await page.mouse.move(2, 2);
    const firstRunning = await resumed;
    const frameStep = ((rows[0].group / rows[0].duration) * 1000) / 60;
    qa.match({ id: "M11", title: "Resume continues from the paused position (first running frame ≤ 2 frames of travel)", category: "motion" },
      Math.round(Math.abs(firstRunning - held) * 100) / 100, 0, (a) => a <= frameStep * 2 + 0.05);
    // Scroll away and back: the loop keeps running (no restart).
    const ct = () => s.evaluate((sec) => Number(sec.querySelector<HTMLElement>("ul.partners-track")!.getAnimations()[0].currentTime));
    const before = await ct();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await scrollElementTo(page, s, 0);
    qa.match({ id: "M12", title: "Scroll away and back does not restart the loop", category: "motion" }, (await ct()) > before, true);

    // Real-time sampling over ~1.2s (rAF, no sleeps): velocity and continuity.
    const samples = await s.locator("ul.partners-track").first().evaluate(async () => {
      const tracks = [...document.querySelectorAll<HTMLElement>("ul.partners-track")];
      const out: { t: number; x: number[] }[] = [];
      const start = performance.now();
      while (performance.now() - start < 1200) {
        await new Promise((r) => requestAnimationFrame(r));
        out.push({ t: performance.now(), x: tracks.map((t) => new DOMMatrix(getComputedStyle(t).transform).m41) });
      }
      return out;
    });
    for (const row of [0, 1]) {
      const expected = (rows[row].group / rows[row].duration) * 1000 * (row === 0 ? -1 : 1);
      const steps = samples.slice(1).map((sm, i) => {
        const dt = sm.t - samples[i].t;
        let dx = sm.x[row] - samples[i].x[row];
        if (Math.abs(dx) > rows[row].group / 2) dx -= Math.sign(dx) * rows[row].group; // a wrap step
        return { dt, dx, v: (dx / dt) * 1000 };
      }).filter((st) => st.dt > 0);
      const v = (steps.reduce((a, st) => a + st.dx, 0) / steps.reduce((a, st) => a + st.dt, 0)) * 1000;
      qa.match({ id: `M2.${row + 1}`, title: `Row ${row + 1} direction (${row === 0 ? "left" : "right"})`, category: "motion" }, Math.sign(v), Math.sign(expected));
      qa.match({ id: `M3.${row + 1}`, title: `Row ${row + 1} speed px/s (group ${rows[row].group}px / 40s)`, category: "motion" },
        Math.round(v * 10) / 10, Math.round(expected * 10) / 10, (a, e) => Math.abs(a - e) <= Math.abs(e) * 0.05);
      const backwards = steps.filter((st) => Math.sign(st.dx) === -Math.sign(expected) && Math.abs(st.dx) > 0.01).length;
      const jumps = steps.filter((st) => Math.abs(st.dx) > Math.abs(expected) * (st.dt / 1000) * 3 + 1).length;
      qa.match({ id: `M4.${row + 1}`, title: `Row ${row + 1} continuity: no backward steps or >3× jumps over ${steps.length} frames`, category: "motion" },
        `${backwards} backward, ${jumps} jumps`, "0 backward, 0 jumps");
    }
    qa.advisory({ id: "M5", title: "Rows run at different linear speeds", category: "motion",
      note: "Same 40s duration over different group widths (8 vs 9 pills). No Figma motion spec to judge against." },
      `${(rows[0].group / 40).toFixed(1)} vs ${(rows[1].group / 40).toFixed(1)} px/s`);

    // Reset detection: currentTime must never decrease from the first frame (hydration included).
    const mq = await page.evaluate(() => (window as unknown as { __mq: number[][] }).__mq);
    const resets = [0, 1].map((row) => mq.slice(1).filter((m, i) => m[row] >= 0 && mq[i][row] >= 0 && m[row] < mq[i][row] - 1).length);
    qa.match({ id: "M6", title: `No animation restarts from first frame through hydration (${mq.length} frames)`, category: "motion" }, resets.join("/"), "0/0");

    // This test never calls pause()/play()/currentTime, so the CSS play-state
    // checks above are valid; seeking lives in the isolated per-width tests.
    // (playState cannot tell CSS control from script control; this only
    // confirms nothing was left paused.)
    const states = await s.evaluate((sec) => [...sec.querySelectorAll<HTMLElement>("ul.partners-track")].map((t) => t.getAnimations()[0].playState).join("/"));
    qa.match({ id: "M0", title: "Rows running at the end of the state checks (nothing left paused)", category: "motion" }, states, "running/running");

    // Vertical clipping: every pill fully inside its overflow:hidden row.
    const clip = await s.evaluate((sec) => [...sec.querySelectorAll(".partners-marquee")].map((m) => {
      const b = m.getBoundingClientRect();
      return [...m.querySelectorAll("li")].filter((li) => { const r = li.getBoundingClientRect(); return r.top < b.top - 0.5 || r.bottom > b.bottom + 0.5; }).length;
    }));
    qa.match({ id: "M9", title: "Pills clipped vertically by the row", category: "motion" }, clip.join("/"), "0/0");

    await qa.attach();
  });

  for (const width of [1440, 768, 390]) {
    // Seeks the animation (script control): isolated in its own test, and every
    // locale gets a fresh document, so no CSS-driven check runs after this.
    test(`edge coverage and wrap at ${width}px (EN/AR)`, async ({ page }, testInfo) => {
      for (const locale of ["en", "ar"] as Locale[]) {
        const s = await open(page, locale, width, partnersSection);
        const qa = qaLedger(testInfo, locale, `${width}×900 motion`);
        const r = await s.evaluate((sec) => [...sec.querySelectorAll<HTMLElement>("ul.partners-track")].map((track) => {
          const a = track.getAnimations()[0];
          const d = Number(a.effect!.getComputedTiming().duration);
          const box = track.parentElement!.getBoundingClientRect();
          const visible = () => [...track.children].map((li) => [li.querySelector("img")!.getAttribute("src"), li.getBoundingClientRect()] as const)
            .filter(([, rr]) => rr.right > box.left && rr.left < box.right).map(([src, rr]) => `${src}@${Math.round(rr.left - box.left)}`).join(",");
          a.pause();
          let gap = 0;
          for (let k = 0; k <= 200; k++) {
            a.currentTime = Math.min(d - 0.001, (d * k) / 200);
            const f = track.firstElementChild!.getBoundingClientRect();
            const l = track.lastElementChild!.getBoundingClientRect();
            gap = Math.max(gap, f.left - 8 - box.left, box.right - (l.right + 8));
          }
          a.currentTime = 0;
          const start = visible();
          a.currentTime = d - 0.001;
          const end = visible();
          return { gap: Math.max(0, Math.round(gap)), seamless: start === end, dir: getComputedStyle(track.parentElement!).direction };
        }));
        qa.match({ id: "M7.w", title: "Edge coverage gap over 200 phases (px)", category: "motion" }, r.map((x) => x.gap).join("/"), "0/0");
        qa.match({ id: "M8.w", title: "Seamless wrap (visible pills identical at phase 0 and end)", category: "motion" }, r.map((x) => x.seamless).join("/"), "true/true");
        if (locale === "ar") {
          qa.advisory({ id: "M13", title: "Marquee direction in RTL", category: "rtl", note: "Rows are forced dir=ltr, so they run the same way as English. No Figma RTL or motion reference." },
            r.map((x) => x.dir).join("/"));
        }
        await qa.attach();
      }
    });
  }
});

test.describe("Partners — reduced motion", () => {
  for (const width of [1440, 768, 390]) {
    test(`${width}px: marquee stops; reveal does not travel; which logos stay visible`, async ({ page }, testInfo) => {
      await page.addInitScript(() => {
        const w = window as unknown as { __rv: { o: number; t: number; first: number }[] };
        w.__rv = [];
        const first = new Map<Element, number>();
        const tick = () => {
          // Clients (2nd section) and Partners: both reveal with framer.
          document.querySelectorAll("main > section:nth-of-type(2), section:has(ul.partners-track)").forEach((sec) => sec.querySelectorAll<HTMLElement>("[style*='will-change'], [style*='transform']").forEach((el) => {
            if (el.matches("ul.partners-track")) return;
            const cs = getComputedStyle(el);
            const m = new DOMMatrix(cs.transform === "none" ? undefined : cs.transform);
            const t = Math.round(Math.hypot(m.m41, m.m42) * 100) / 100;
            if (!first.has(el)) first.set(el, t);
            w.__rv.push({ o: Number(cs.opacity), t, first: first.get(el)! });
          }));
          if (performance.now() < 6000) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await open(page, "en", width, clientsSection); // reveal Clients, then scroll on to Partners (same load)
      const s = partnersSection(page);
      await settleSection(page, s);
      const qa = qaLedger(testInfo, "en", `${width}×900 reduce`);
      const st = await s.evaluate((sec) => [...sec.querySelectorAll<HTMLElement>("ul.partners-track")].map((t) => `${getComputedStyle(t).animationName}|${getComputedStyle(t).transform}`));
      qa.match({ id: "R1", title: "Both rows: animation none, no transform", category: "motion" }, st.join(" / "), "none|none / none|none");
      const rv = (await page.evaluate(() => (window as unknown as { __rv: { o: number; t: number; first: number }[] }).__rv)).filter((x) => x.o > 0.01);
      qa.match({ id: "R2", title: `Clients + Partners reveal: no visible frame at an intermediate position (${rv.length} samples)`, category: "motion" },
        rv.filter((x) => x.t > 0 && x.t < x.first).length, 0);
      // Every unique partner must stay visually accessible with motion off, by
      // any layout: some instance fully shown (inside the viewport and its
      // clipping ancestor, outside an edge-fade band, not hidden), or inside a
      // container the user can scroll. Implementation-agnostic: a wrapped grid,
      // a scrollable row or a static row that fits all pass.
      const access = await s.evaluate((sec, vw) => {
        const name = (img: HTMLImageElement) => decodeURIComponent(/url=([^&]+)/.exec(img.src)?.[1] ?? img.src).split("/").pop()!;
        const all = new Map<string, "shown" | "scrollable" | "hidden">();
        for (const img of sec.querySelectorAll<HTMLImageElement>("img")) {
          const key = name(img);
          if (!key.match(/\.(png|svg|webp|jpe?g)$/)) continue;
          const tile = (img.closest("li") ?? img) as HTMLElement;
          const r = tile.getBoundingClientRect();
          let lo = 0, hi = vw, state: "shown" | "scrollable" | "hidden" = "shown";
          for (let a = tile.parentElement; a && a !== sec.parentElement; a = a.parentElement) {
            const cs = getComputedStyle(a);
            const ar = a.getBoundingClientRect();
            if (/(auto|scroll)/.test(cs.overflowX) && a.scrollWidth > a.clientWidth) { state = "scrollable"; break; }
            if (cs.overflowX !== "visible") { lo = Math.max(lo, ar.left); hi = Math.min(hi, ar.right); }
            if (cs.maskImage && cs.maskImage !== "none") { lo = Math.max(lo, ar.left + ar.width * 0.05); hi = Math.min(hi, ar.right - ar.width * 0.05); }
          }
          const cs = getComputedStyle(tile);
          if (state === "shown" && (r.width === 0 || r.left < lo - 0.5 || r.right > hi + 0.5 || cs.visibility === "hidden" || Number(cs.opacity) < 0.1)) state = "hidden";
          const prev = all.get(key);
          if (!prev || prev === "hidden" || (prev === "scrollable" && state === "shown")) all.set(key, state);
        }
        const v = [...all.values()];
        return { total: all.size, accessible: v.filter((x) => x !== "hidden").length, scrollable: v.filter((x) => x === "scrollable").length,
          hidden: [...all].filter(([, x]) => x === "hidden").map(([k]) => k.replace(/\.\w+$/, "")) };
      }, width);
      qa.match({ id: "R3", title: `Partners visually accessible with motion off (${access.total} unique)`, category: "motion",
        note: `Hidden: ${access.hidden.join(", ") || "none"}. Scrollable: ${access.scrollable}. Screen readers get all names via the first copy; this checks sighted access.` },
        `${access.accessible}/${access.total}`, `${access.total}/${access.total}`);
      await qa.attach();
    });
  }
});

/* ─────────────────────── Responsive / RTL / stability ─────────────────────── */

test.describe("Responsive, RTL and layout stability (behaviour checks)", () => {
  for (const locale of ["en", "ar"] as Locale[]) {
    for (const width of [1440, 768, 390]) {
      test(`${locale.toUpperCase()} ${width}: overflow, clipping, overlap`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}`);
        const qa = qaLedger(testInfo, locale, `${width}×900`);
        for (const [name, which] of [["clients", clientsSection], ["partners", partnersSection]] as const) {
          const s = which(page);
          await settleSection(page, s);
          const r = await s.evaluate((sec, vw) => {
            const out = [...sec.querySelectorAll<HTMLElement>("h2, p, span.rounded-full")]
              .map((el) => el.getBoundingClientRect()).filter((b) => b.width > 0 && (b.left < -0.5 || b.right > vw + 0.5)).length;
            const logos = [...sec.querySelectorAll(":scope > ul > li")].map((li) => li.getBoundingClientRect());
            let overlaps = 0;
            logos.forEach((a, i) => logos.slice(i + 1).forEach((b) => { if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) overlaps++; }));
            const outside = logos.filter((b) => b.left < -0.5 || b.right > vw + 0.5).length;
            return { out, overlaps, outside, docW: document.documentElement.scrollWidth };
          }, width);
          qa.match({ id: `R.${name}.1`, title: `${name}: page scroll width`, category: "responsive" }, r.docW, width);
          qa.match({ id: `R.${name}.2`, title: `${name}: text/eyebrow outside the viewport`, category: "responsive" }, r.out, 0);
          if (name === "clients") {
            qa.match({ id: "R.clients.3", title: "clients: overlapping logos", category: "responsive" }, r.overlaps, 0);
            qa.match({ id: "R.clients.4", title: "clients: logos outside the viewport", category: "responsive" }, r.outside, 0);
          }
          if (locale === "ar") {
            const h2 = s.locator("h2");
            const face = await faces(page, h2);
            qa.match({ id: `R.${name}.ar1`, title: `${name}: Arabic title renders Tajawal`, category: "rtl" }, /^Tajawal-/.test(face) ? "Tajawal" : face, "Tajawal");
            if (width === 1440) {
              if (name === "clients") {
                qa.decision({ id: "R.clients.ar2", title: "clients: Arabic title copy and weight", category: "rtl",
                  note: "PQA-016: provisional Arabic title. Weight 700 renders Tajawal Bold where Figma's heading/2xl/bold is 800 (PQA-025 weight decisions)." },
                  `${await css(h2, "font-weight")} → ${face}`, "Designer-approved copy; 800");
              } else {
                qa.decision({ id: "R.partners.ar2", title: "partners: Arabic description copy and title weight", category: "rtl",
                  note: "PQA-024: Arabic description still describes sector pages; designer to confirm title and Tajawal 800 weight." },
                  `${await css(h2, "font-weight")} → ${face}`, "Approved Arabic description");
              }
            }
          }
          if (width !== 1440 || locale === "ar") {
            qa.unavailable({ id: `R.${name}.ref`, title: `${name}: Figma frame for ${locale} ${width}`, category: "responsive", note: "Only an English 1440 frame exists (see manifests)." });
          }
        }
        await qa.attach();
      });
    }
  }

  test("layout stability: CLS while loading and scrolling through both sections", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en");
    await waitForHydration(page);
    const cls = await measureLayoutShift(page, async () => {
      for (const which of [clientsSection, partnersSection]) await settleSection(page, which(page));
    });
    const qa = qaLedger(testInfo, "en", "1440×900");
    qa.match({ id: "S1", title: "CLS (load + scroll through Clients and Partners) < 0.1", category: "layout" }, Math.round(cls * 1000) / 1000, 0.1, (a, e) => a < e);
    await qa.attach();
  });
});
