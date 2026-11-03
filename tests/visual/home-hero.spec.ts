import { readFileSync, writeFileSync } from "node:fs";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../e2e/support/fixtures";
import { messages, type Locale } from "../e2e/support/messages";
import { compareImages, type Region } from "./support/compare";
import { qaLedger, within } from "./support/qa";
import { hexToRgb, loadReferences } from "./support/reference";
import { hideOverlays, renderedFonts, settle } from "./support/stable";

/**
 * Home Hero (components/sections/home-1/hero.tsx) against Figma 406:3782.
 *
 * Gate A — computed styles, rendered fonts and geometry, every expected value
 *          read from the cached Figma variables/geometry (never hard-coded).
 * Gate B — the Figma PNG against a browser capture of the section: reference,
 *          actual, diff and overlay are attached to every run.
 *
 * H1–H9 are the historical findings in hero-qa/index.html (1 Nov 2026).
 * Open questions are recorded as `designer-decision` with their issue ID and
 * never fail the run; see tests/visual/README.md for the statuses.
 */

const ref = loadReferences("home-hero");
const FRAME = { width: 1440, height: 794 }; // Figma 406:3782
const GEO_TOLERANCE = 2; // px — "minor spacing offsets" the designer report leaves out

const hero = messages.en.HomeV1.hero;

function heroParts(page: Page) {
  const section = page.locator("main > section").first();
  const stats = section.locator("ul > li");
  return {
    section,
    h1: section.locator("h1"),
    accent: section.locator("h1 > span"),
    description: section.locator("h1 + p"),
    primary: section.locator("a").nth(0),
    secondary: section.locator("a").nth(1),
    band: section.locator("ul").locator("xpath=.."),
    stats,
    figures: stats.locator(":scope > p:first-child > span:first-child"),
    labels: stats.locator(":scope > p:nth-of-type(2)"),
  };
}

type Rect = { x: number; y: number; width: number; height: number; right: number };

/**
 * Element box relative to the section's top-left (the Figma frame origin).
 * `content: true` returns the content box (padding excluded) — the equivalent
 * of a Figma text node; buttons use the border box (the Figma button frame).
 */
async function rectIn(section: Locator, el: Locator, content = false): Promise<Rect> {
  const s = await section.boundingBox();
  if (!s) throw new Error("section not rendered");
  const e = await el.evaluate((node, content) => {
    const r = node.getBoundingClientRect();
    if (!content) return { x: r.x, y: r.y, width: r.width, height: r.height };
    const cs = getComputedStyle(node);
    const [pt, pr, pb, pl] = ["top", "right", "bottom", "left"].map((k) => parseFloat(cs.getPropertyValue(`padding-${k}`)));
    return { x: r.x + pl, y: r.y + pt, width: r.width - pl - pr, height: r.height - pt - pb };
  }, content);
  const r = (n: number) => Math.round(n * 10) / 10;
  return { x: r(e.x - s.x), y: r(e.y - s.y), width: r(e.width), height: r(e.height), right: r(e.x - s.x + e.width) };
}

const css = (el: Locator, prop: string) =>
  el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), prop);

const px = (token: string) => `${ref.token(token)}px`;
/** "Font(family: …, style: Black, …)" → "Black". */
const figmaStyle = (token: string) => /style: ([^,]+)/.exec(ref.token(token))![1].replace(/\s+/g, "");
const tracking = (v: string) => (v === "normal" ? 0 : parseFloat(v));

/** Rendered face(s) actually used for the element's own text. */
async function faces(page: Page, el: Locator) {
  const used = (await renderedFonts(page, el)).filter((f) => f.glyphCount > 0);
  return used.map((f) => `${f.postScriptName}${f.isCustomFont ? "" : " (system)"}`).join(", ");
}

async function open(page: Page, locale: Locale, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(`/${locale}`);
  const parts = heroParts(page);
  await settle(page, parts.section);
  return parts;
}

test.describe("Gate A — computed styles, fonts and geometry", () => {
  test("EN 1440 — Hero matches Figma 406:3782 tokens and geometry", async ({ page }, testInfo) => {
    const p = await open(page, "en", FRAME);
    const qa = qaLedger(testInfo, "en", "1440×794");

    // H1 — brand typeface actually rendered (not the CSS request).
    const avenir = (style: string) => `Avenir-${style}`;
    qa.match({ id: "H1.1", title: "Headline renders Avenir (Figma heading/Hero/bold)", category: "typography" },
      await faces(page, p.h1), avenir(figmaStyle("heading/Hero/bold")));
    qa.match({ id: "H1.2", title: "Sub-headline renders Avenir (body/lg-plus/regular)", category: "typography" },
      await faces(page, p.description), avenir(figmaStyle("body/lg-plus/regular")));
    for (const [i, cta] of [p.primary, p.secondary].entries()) {
      qa.match({ id: `H1.3.${i + 1}`, title: `CTA ${i + 1} label renders Avenir (action/xl/medium)`, category: "typography" },
        await faces(page, cta), avenir(figmaStyle("action/xl/medium")));
    }
    qa.match({ id: "H1.4", title: "Stat figure renders Avenir (heading/3xl/semibold)", category: "typography" },
      await faces(page, p.figures.first()), avenir(figmaStyle("heading/3xl/semibold")));
    qa.match({ id: "H1.5", title: "Stat label renders Avenir (body/lg-plus/regular)", category: "typography" },
      await faces(page, p.labels.first()), avenir(figmaStyle("body/lg-plus/regular")));

    // H2 — headline 56/70, weight 800, tracking 0.
    qa.match({ id: "H2.1", title: "Headline font-size", category: "typography" }, await css(p.h1, "font-size"), px("font-size/Hero"));
    qa.match({ id: "H2.2", title: "Headline line-height", category: "typography" }, await css(p.h1, "line-height"), px("line-height/leading-70"));
    qa.match({ id: "H2.3", title: "Headline weight", category: "typography" }, await css(p.h1, "font-weight"), ref.token("font-weight/Black"));
    qa.match({ id: "H2.4", title: "Headline letter-spacing", category: "typography" },
      tracking(await css(p.h1, "letter-spacing")), Number(ref.token("Letter Spacing/tracking-normal")));
    qa.match({ id: "H2.5", title: "Headline colour", category: "colour" },
      await css(p.h1, "color"), hexToRgb(ref.token("content/base/inverse")));
    qa.decision({ id: "H2.6", title: "Headline accent colour ('Oman.')", category: "colour",
      note: "Not a Figma variable on this node; designer report gives #3EC1F0. Deferred in PQA-022 item 6." },
      await css(p.accent, "color"), "#3EC1F0 → rgb(62, 193, 240)");

    // H3 — 18/28 on sub-headline, both CTA labels and every stat label.
    const lg = { size: px("font-size/text-lg-plus"), lh: px("line-height/leading-28") };
    const eighteen: [string, Locator][] = [
      ["Sub-headline", p.description],
      ["Primary CTA label", p.primary],
      ["Secondary CTA label", p.secondary],
      ...(await p.labels.all()).map((l, i) => [`Stat label ${i + 1}`, l] as [string, Locator]),
    ];
    for (const [i, [name, el]] of eighteen.entries()) {
      qa.match({ id: `H3.${i + 1}`, title: `${name} size / line-height`, category: "typography" },
        `${await css(el, "font-size")} / ${await css(el, "line-height")}`, `${lg.size} / ${lg.lh}`);
    }
    qa.match({ id: "H3.w", title: "CTA label weight (action/xl/medium)", category: "typography" },
      await css(p.primary, "font-weight"), ref.token("font-weight/Medium"));
    qa.match({ id: "H3.c", title: "Sub-headline colour (content/base/inverse-secondary)", category: "colour" },
      await css(p.description, "color"), hexToRgb(ref.token("content/base/inverse-secondary")));

    // H4 — stat labels #CFD8DC.
    for (const [i, label] of (await p.labels.all()).entries()) {
      qa.match({ id: `H4.${i + 1}`, title: `Stat label ${i + 1} colour (content/base/inverse-secondary)`, category: "colour" },
        await css(label, "color"), hexToRgb(ref.token("content/base/inverse-secondary")));
    }

    // H5 — stat figures 44px weight 900 (Figma heading/3xl/semibold = Heavy 44/48).
    for (const [i, fig] of (await p.figures.all()).entries()) {
      qa.match({ id: `H5.${i + 1}`, title: `Stat figure ${i + 1} size / weight`, category: "typography" },
        `${await css(fig, "font-size")} / ${await css(fig, "font-weight")}`,
        `${px("font-size/size-5xl")} / ${ref.token("font-weight/Heavy")}`);
    }
    qa.match({ id: "H5.lh", title: "Stat figure line-height (heading/3xl/semibold)", category: "typography",
      note: "Cause: `leading-none` compiles to line-height: var(--spacing-none) = 0 (custom --spacing-none token), site-wide." },
      await css(p.figures.first(), "line-height"), px("line-height/leading-48"));
    // Figma 406:3794 sets the "yrs" unit at Avenir Heavy 16/24 (design context; not a variable).
    const unit = p.stats.first().locator(":scope > p:first-child > span:nth-child(2)");
    qa.match({ id: "H5.u", title: "Stat unit 'yrs' size / line-height (Figma 406:3794: 16/24)", category: "typography" },
      `${await css(unit, "font-size")} / ${await css(unit, "line-height")}`, "16px / 24px");
    qa.match({ id: "H5.uf", title: "Stat unit 'yrs' renders Avenir Heavy", category: "typography" },
      await faces(page, unit), "Avenir-Heavy");

    // H6 — white outlined secondary CTA without an icon; 24px primary arrow.
    qa.match({ id: "H6.1", title: "Secondary CTA fill (surface/base/layer-1)", category: "colour" },
      await css(p.secondary, "background-color"), hexToRgb(ref.token("surface/base/layer-1")));
    qa.match({ id: "H6.2", title: "Secondary CTA border (thickness/sm, border/slate/subtlest)", category: "colour" },
      `${await css(p.secondary, "border-top-width")} ${await css(p.secondary, "border-top-color")}`,
      `${px("thickness/sm")} ${hexToRgb(ref.token("border/slate/subtlest"))}`);
    qa.match({ id: "H6.3", title: "Secondary CTA label colour (content/base/secondary)", category: "colour" },
      await css(p.secondary, "color"), hexToRgb(ref.token("content/base/secondary")));
    qa.match({ id: "H6.4", title: "Secondary CTA has no icon", category: "assets" }, await p.secondary.locator("svg").count(), 0);
    const arrow = await p.primary.locator("svg").boundingBox();
    qa.match({ id: "H6.5", title: "Primary CTA arrow size (size/icon/lg)", category: "assets" },
      `${arrow?.width}×${arrow?.height}`, `${ref.token("size/icon/lg")}×${ref.token("size/icon/lg")}`);
    qa.match({ id: "H6.6", title: "Primary CTA fill (surface/brand/default)", category: "colour" },
      await css(p.primary, "background-color"), hexToRgb(ref.token("surface/brand/default")));
    for (const [i, cta] of [p.primary, p.secondary].entries()) {
      // The visible "Base" layer uses radius/lg; radius/md is its invisible wrapper (design context).
      qa.match({ id: `H6.7.${i + 1}`, title: `CTA ${i + 1} height / radius (size/3xl, radius/lg)`, category: "layout" },
        `${(await cta.boundingBox())?.height}px / ${await css(cta, "border-top-left-radius")}`,
        `${px("size/3xl")} / ${px("radius/lg")}`);
    }
    qa.decision({ id: "H6.8", title: "CTA horizontal padding", category: "layout",
      note: "Designer report asks for 24px (spacing/2xl); deferred in PQA-022 item 6." },
      await css(p.primary, "padding-inline-start"), px("spacing/2xl"));
    const [b1, b2] = [ref.node("406:3790"), ref.node("406:3791")];
    qa.decision({ id: "H6.9", title: "CTA widths (follow from the padding above)", category: "layout",
      note: "PQA-022 item 6 (padding)." },
      `${(await p.primary.boundingBox())?.width} / ${(await p.secondary.boundingBox())?.width}`, `${b1.width} / ${b2.width}`);
    qa.decision({ id: "H6.10", title: "Primary CTA shadow", category: "colour",
      note: "Figma: drop-shadow 0 8px 12px rgba(28,151,212,.5). Deferred in PQA-022 item 6." },
      (await css(p.primary, "box-shadow")).replace(/rgba\(0, 0, 0, 0\) 0px 0px 0px 0px, /g, ""),
      "rgba(28, 151, 212, 0.5) 0px 8px 12px");
    qa.decision({ id: "H6.11", title: "Top-start glow blur / opacity (Figma 406:3784)", category: "visual",
      note: "Figma: blur 12px, opacity 0.6. Deferred in PQA-022 item 6 ('glow blur 12px')." },
      `${await css(p.section.locator("[class*='radial-gradient']"), "filter")} / ${await css(p.section.locator("[class*='radial-gradient']"), "opacity")}`,
      "blur(12px) / 0.6");

    // H7 — stats band: Figma 406:3792 = gradient to top, rgba(4,29,42,.54) → rgba(4,29,42,0); no flat fill.
    // Colour stops are resolved through a canvas, because Tailwind emits lab() for `#041d2a/54`.
    const stops = await p.band.evaluate((el) => {
      const image = getComputedStyle(el).backgroundImage;
      const colours = image.match(/(?:rgba?|lab|oklab|lch|oklch|color)\([^)]*\)|transparent/g) ?? [];
      const ctx = new OffscreenCanvas(1, 1).getContext("2d")!;
      const rgba = colours.map((c) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: Math.round((a / 255) * 100) / 100 };
      });
      return { direction: /linear-gradient\((to top)/.exec(image)?.[1] ?? image.slice(0, 40), rgba };
    });
    const first = stops.rgba[0];
    const last = stops.rgba.at(-1);
    qa.match({ id: "H7.1", title: "Stats band gradient: to top, from rgba(4,29,42,.54) to transparent", category: "colour" },
      `${stops.direction}, ${first ? `rgba(${first.r}, ${first.g}, ${first.b}, ${first.a})` : "none"} → alpha ${last?.a}`,
      "to top, rgba(4, 29, 42, 0.54) → alpha 0",
      (a, e) => {
        const ok = first && last && stops.direction === "to top" &&
          Math.abs(first.r - 4) <= 2 && Math.abs(first.g - 29) <= 2 && Math.abs(first.b - 42) <= 2 &&
          Math.abs(first.a - 0.54) <= 0.01 && last.a === 0;
        return Boolean(ok) || a === e;
      });
    qa.match({ id: "H7.2", title: "Stats band has no flat fill", category: "colour" },
      await css(p.band, "background-color"), "rgba(0, 0, 0, 0)");
    qa.decision({ id: "H7.3", title: "Band backdrop blur ends at a hard edge", category: "visual",
      note: "PQA-020 item 4: Figma dissolves the blur into the photo; Designer to confirm a masked fade." },
      await css(p.band, "backdrop-filter"), "blur(8px), fading in");

    // H8 — no eyebrow badge above the headline (Figma has none).
    qa.match({ id: "H8", title: "No 'Part of Omantel group' badge in the Hero", category: "content" },
      (await p.section.innerText()).includes(hero.badge), false);

    // H9 — stats: Figma has four, the build five with two reworded labels.
    qa.decision({ id: "H9.1", title: "Number of statistics", category: "content",
      note: "PQA-019 item 7 / PQA-022 item 6: fifth 1,400+ stat not in Figma." },
      await p.stats.count(), 4);
    qa.decision({ id: "H9.2", title: "Stat labels wording", category: "content",
      note: "PQA-019 item 7: Figma 'omani agents ready to assist you', 'Customer transaction a year' look like Figma typos." },
      (await p.labels.allInnerTexts()).join(" · "),
      [3795, 3798, 3801, 3804].map((n) => ref.node(`406:${n}`).name).join(" · "));

    // Geometry against Figma node boxes (frame-relative, ±2px).
    const geo = async (id: string, title: string, el: Locator, figmaId: string, keys: (keyof Rect)[], content = true) => {
      const a = await rectIn(p.section, el, content);
      const f = ref.node(figmaId);
      const fr = { ...f, right: f.x + f.width };
      for (const k of keys) {
        qa.match({ id: `${id}.${k}`, title: `${title} ${k} (Figma ${figmaId})`, category: "layout" }, a[k], fr[k], within(GEO_TOLERANCE));
      }
    };
    await geo("G1", "Headline", p.h1, "406:3787", ["x", "y", "width", "height"]);
    await geo("G2", "Sub-headline", p.description, "406:3788", ["x", "y", "width", "height"]);
    await geo("G3", "Primary CTA", p.primary, "406:3790", ["x", "y"], false);
    await geo("G4", "Secondary CTA", p.secondary, "406:3791", ["y"], false);
    await geo("G5", "Stats band", p.band, "406:3792", ["y", "height"], false);
    await geo("G6", "First stat figure", p.figures.first(), "406:3794", ["x", "y"]);
    await geo("G7", "First stat label", p.labels.first(), "406:3795", ["x", "y"]);
    qa.match({ id: "G8", title: "Section height (Figma frame 406:3782)", category: "layout",
      note: "`lg:min-h-[760px]` overrides `min-h-svh` from 1024px, so the height is 760 at any viewport height." },
      (await p.section.boundingBox())!.height, FRAME.height, within(GEO_TOLERANCE));

    await qa.attach();
  });

  test("AR 1440 — RTL mirror, Tajawal and type scale (no Arabic Figma frame)", async ({ page }, testInfo) => {
    const p = await open(page, "ar", FRAME);
    const qa = qaLedger(testInfo, "ar", "1440×794");
    qa.unavailable({ id: "AR.ref", title: "Arabic Hero frame", category: "rtl", note: ref.unavailableReason("ar") ?? "" });

    qa.match({ id: "AR.1", title: "Document direction", category: "rtl" }, await page.locator("html").getAttribute("dir"), "rtl");
    for (const [name, el] of [["Headline", p.h1], ["Sub-headline", p.description], ["Primary CTA", p.primary],
      ["Secondary CTA", p.secondary], ["Stat figure", p.figures.first()], ["Stat label", p.labels.first()]] as [string, Locator][]) {
      const used = await faces(page, el);
      qa.match({ id: `AR.2 ${name}`, title: `${name} renders Tajawal only`, category: "typography" },
        /^(Tajawal-[A-Za-z]+)(, Tajawal-[A-Za-z]+)*$/.test(used) ? "Tajawal" : used, "Tajawal");
    }
    // Sizes follow the EN frame (shared classes); the Arabic scale is an open decision.
    qa.match({ id: "AR.3", title: "Headline size (EN token, shared class)", category: "typography" }, await css(p.h1, "font-size"), px("font-size/Hero"));
    qa.decision({ id: "AR.4", title: "Headline line-height 1.32 in RTL", category: "typography",
      note: "PQA-025 (provisional, awaiting Designer): Arabic h1/h2 use line-height 1.32." },
      await css(p.h1, "line-height"), px("line-height/leading-70"));
    qa.decision({ id: "AR.5", title: "Stat figure weight 900 renders Tajawal ExtraBold", category: "typography",
      note: "PQA-025: Tajawal loads 400/500/700/800 only, so 900 renders 800." },
      await faces(page, p.figures.first()), "Heavy (900)");

    // Mirrored geometry: start edge = right edge in RTL.
    const mirror = (figmaId: string) => FRAME.width - ref.node(figmaId).x;
    const right = async (el: Locator) => (await rectIn(p.section, el)).right;
    qa.match({ id: "AR.6", title: "Headline starts at the mirrored Figma inset", category: "rtl" },
      await right(p.h1), mirror("406:3787"), within(GEO_TOLERANCE));
    qa.match({ id: "AR.7", title: "Primary CTA starts at the mirrored Figma inset", category: "rtl" },
      await right(p.primary), mirror("406:3790"), within(GEO_TOLERANCE));
    qa.match({ id: "AR.8", title: "Primary CTA arrow points to the reading end (rotated 180°)", category: "rtl" },
      await css(p.primary.locator("svg"), "rotate"), "180deg");
    qa.match({ id: "AR.9", title: "CTAs flow from the reading start (primary right of secondary)", category: "rtl" },
      (await rectIn(p.section, p.primary)).x > (await rectIn(p.section, p.secondary)).x, true);

    await qa.attach();
  });
});

test.describe("Gate B — Figma reference vs browser capture", () => {
  // Frame-level regions (fixed Figma coordinates): mismatch here mixes layout
  // drift with rendering, so it is evidence for designers, not a gate.
  const regions: Region[] = [
    { ...ref.node("406:3787"), name: "headline" },
    { ...ref.node("406:3788"), name: "sub-headline" },
    { ...ref.node("406:3789"), name: "ctas" },
    { ...ref.node("406:3792"), name: "stats band" },
  ];
  // Element-aligned crops: the Figma node box against the same-size box at the
  // element's rendered position, so position (Gate A) and rendering (here) are
  // judged independently.
  //
  // Budget = share of pixels over the YIQ threshold 0.1, or null = advisory.
  // Set 2026-11-03 at the midpoint between the measured build and the negative
  // control (text hidden) — headline 8.7% vs 25.5% → 17%; CTAs ~14% vs ~99%
  // → 50%. Thin 18px text over the photo does not discriminate (sub-headline
  // 14.9% vs 20.2%, stat label 6.9% vs 10.6%), so it is advisory only and its
  // fidelity is gated by Gate A (rendered face H1, size H3, colour H4, G2/G7).
  const elements = (p: ReturnType<typeof heroParts>): [string, string, Locator, boolean, number | null][] => [
    ["headline", "406:3787", p.h1, true, 0.17],
    ["sub-headline", "406:3788", p.description, true, null],
    ["primary CTA", "406:3790", p.primary, false, 0.5],
    ["secondary CTA", "406:3791", p.secondary, false, 0.5],
    ["first stat label", "406:3795", p.labels.first(), true, null],
  ];

  test("EN 1440 — Hero capture against 406-3782.en.1440.png", async ({ page, browser }, testInfo) => {
    const figma = ref.screenshot("en")!;
    const reference = readFileSync(figma.path);
    const p = await open(page, "en", FRAME);
    await hideOverlays(page);
    const actual = await p.section.screenshot({ animations: "disabled", caret: "hide" });
    const frame = await compareImages(browser, reference, actual, regions);

    const aligned: { name: string; node: string; budget: number | null; mismatchRatio: number; diff: Buffer }[] = [];
    for (const [name, node, el, content, budget] of elements(p)) {
      const box = ref.node(node);
      const at = await rectIn(p.section, el, content);
      const r = await compareImages(browser, reference, actual, [], {
        crop: { reference: box, actual: { ...box, x: at.x, y: at.y } },
      });
      aligned.push({ name, node, budget, mismatchRatio: r.mismatchRatio, diff: r.diffPng });
    }

    // Negative control: copy hidden → every gated element must exceed its budget.
    await p.section.locator("h1, h1 + p, a, li p").evaluateAll((els) =>
      els.forEach((e) => ((e as HTMLElement).style.visibility = "hidden")),
    );
    const broken = await p.section.screenshot({ animations: "disabled", caret: "hide" });
    const control: { name: string; budget: number | null; mismatchRatio: number }[] = [];
    for (const [name, node, el, content, budget] of elements(p)) {
      const box = ref.node(node);
      const at = await rectIn(p.section, el, content);
      const r = await compareImages(browser, reference, broken, [], { crop: { reference: box, actual: { ...box, x: at.x, y: at.y } } });
      control.push({ name, budget, mismatchRatio: r.mismatchRatio });
    }
    const self = await compareImages(browser, reference, reference, regions);

    const metrics = {
      reference: { file: figma.file, nodeId: figma.nodeId, sha256: figma.sha256 },
      threshold: 0.1,
      frame: { referenceSize: frame.referenceSize, actualSize: frame.actualSize, mismatchRatio: frame.mismatchRatio, regions: frame.regions },
      aligned: aligned.map(({ name, node, budget, mismatchRatio }) => ({ name, node, budget, mismatchRatio })),
      negativeControl: control,
      selfCompare: self.mismatchRatio,
    };
    const images: [string, Buffer][] = [
      ["figma-reference.png", reference],
      ["browser-actual.png", actual],
      ["diff.png", frame.diffPng],
      ["overlay.png", frame.overlayPng],
      ...aligned.map((a) => [`diff-${a.name.replace(/\s+/g, "-")}.png`, a.diff] as [string, Buffer]),
    ];
    for (const [name, body] of images) {
      writeFileSync(testInfo.outputPath(name), body);
      await testInfo.attach(name, { body, contentType: "image/png" });
    }
    writeFileSync(testInfo.outputPath("metrics.json"), JSON.stringify(metrics, null, 2));
    await testInfo.attach("metrics.json", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });

    const qa = qaLedger(testInfo, "en", "1440×794");
    const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
    qa.match({ id: "B.size", title: "Capture size equals the Figma frame (see G8)", category: "visual" },
      `${frame.actualSize.width}×${frame.actualSize.height}`, `${frame.referenceSize.width}×${frame.referenceSize.height}`);
    qa.advisory({ id: "B.frame", title: "Frame-level mismatch (layout drift + rendering)", category: "visual",
      note: "Fixed Figma coordinates, so dominated by the G-row offsets and the photo crop. Review diff.png / overlay.png." },
      `${pct(frame.mismatchRatio)} overall; ${frame.regions.map((r) => `${r.name} ${pct(r.mismatchRatio)}`).join(", ")}`);
    for (const a of aligned) {
      const c = control.find((x) => x.name === a.name)!;
      if (a.budget === null) {
        qa.advisory({ id: `B.${a.name}`, title: `${a.name} rendering vs Figma ${a.node} (aligned)`, category: "visual",
          note: `Not discriminative: text hidden scores ${pct(c.mismatchRatio)}. Covered by Gate A (face, size, colour, position). Review diff-${a.name.replace(/\s+/g, "-")}.png.` },
          pct(a.mismatchRatio));
        continue;
      }
      qa.match({ id: `B.${a.name}`, title: `${a.name} rendering vs Figma ${a.node} (aligned) ≤ ${pct(a.budget)}`, category: "visual",
        note: `Negative control ${pct(c.mismatchRatio)}.` },
        a.mismatchRatio <= a.budget ? `within budget (${pct(a.mismatchRatio)})` : pct(a.mismatchRatio),
        `within budget (${pct(a.mismatchRatio)})`);
    }
    await qa.attach();

    expect(self.mismatchRatio, "comparator self-check").toBe(0);
    for (const c of control.filter((x) => x.budget !== null)) {
      expect.soft(c.mismatchRatio, `negative control (${c.name} hidden) must exceed its budget`).toBeGreaterThan(c.budget!);
    }
  });

  test("AR 1440 — capture recorded, no Figma reference to compare", async ({ page }, testInfo) => {
    const p = await open(page, "ar", FRAME);
    await hideOverlays(page);
    const actual = await p.section.screenshot({ animations: "disabled", caret: "hide" });
    writeFileSync(testInfo.outputPath("browser-actual.png"), actual);
    await testInfo.attach("browser-actual.png", { body: actual, contentType: "image/png" });
    const qa = qaLedger(testInfo, "ar", "1440×794");
    qa.unavailable({ id: "B.ar", title: "Arabic Hero image comparison", category: "visual", note: ref.unavailableReason("ar") ?? "" },
      "capture attached");
    await qa.attach();
    test.skip(true, `reference-unavailable: ${ref.unavailableReason("ar")}`);
  });
});

type Sample = { item: number; opacity: number; translate: number; hidden: number; blur: number; figures: string };

test.describe("Motion — reduced-motion contract", () => {
  // Samples every animation frame from navigation until the reveal settles.
  // `hidden` is the item's server-rendered offset (its pre-reveal translate).
  async function sampleReveal(page: Page) {
    await page.addInitScript(() => {
      const w = window as unknown as { __heroSamples: Sample[] };
      w.__heroSamples = [];
      const hiddenOffset = new Map<Element, number>();
      const tick = () => {
        const section = document.querySelector("main > section");
        if (section) {
          section.querySelectorAll<HTMLElement>("[style*='will-change']").forEach((el, item) => {
            const cs = getComputedStyle(el);
            const m = new DOMMatrix(cs.transform === "none" ? undefined : cs.transform);
            const translate = Math.round(Math.hypot(m.m41, m.m42) * 100) / 100;
            if (!hiddenOffset.has(el)) hiddenOffset.set(el, translate);
            w.__heroSamples.push({
              item,
              opacity: Number(cs.opacity),
              translate,
              hidden: hiddenOffset.get(el)!,
              blur: parseFloat(/blur\(([\d.]+)px\)/.exec(cs.filter)?.[1] ?? "0"),
              figures: [...section.querySelectorAll("ul > li > p:first-child > span:first-child")].map((s) => s.textContent).join("|"),
            });
          });
        }
        if (performance.now() < 4000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  const finalFigures = hero.stats.map((s) => s.value).join("|");
  const read = (page: Page) => page.evaluate(() => (window as unknown as { __heroSamples: Sample[] }).__heroSamples);
  const settledRects = async (p: ReturnType<typeof heroParts>) =>
    JSON.stringify(await Promise.all([p.h1, p.description, p.primary, p.secondary, p.band, p.labels.first()].map((l) => rectIn(p.section, l))));

  test("reduced motion — visible Hero content never travels or blurs; counters show final values", async ({ page }, testInfo) => {
    await sampleReveal(page);
    const p = await open(page, "en", FRAME);
    const samples = (await read(page)).filter((s) => s.opacity > 0.01);
    const qa = qaLedger(testInfo, "en", "1440×794 reduce");
    qa.match({ id: "M1", title: "Frames sampled while content was visible", category: "motion" }, samples.length > 0, true);
    // Travel = any visible frame between the hidden offset and the final position.
    const travel = samples.filter((s) => s.translate > 0 && s.translate < s.hidden);
    qa.match({ id: "M2", title: "No travel: visible frames at an intermediate position", category: "motion" }, travel.length, 0);
    // Snap lag: framer applies the duration-0 x/y on the frame after the fade
    // starts, so an item can show at its hidden offset for one frame at low
    // opacity. Bound: at most one such frame per item (the opacity reached in
    // that frame depends on frame timing, so it is reported, not gated).
    const lag = samples.filter((s) => s.translate > 0 && s.translate === s.hidden);
    const lagPerItem = Math.max(0, ...[...new Set(lag.map((s) => s.item))].map((i) => lag.filter((s) => s.item === i).length));
    const lagOpacity = Math.max(0, ...lag.map((s) => s.opacity));
    qa.match({ id: "M2.lag", title: "Snap lag ≤ 1 frame per item (no travel)", category: "motion",
      note: `Measured: ${lag.length} frame(s) over ${new Set(lag.map((s) => s.item)).size} item(s), max opacity ${lagOpacity.toFixed(3)}.` },
      lagPerItem <= 1, true);
    qa.match({ id: "M3", title: "Max blur of visible content (px)", category: "motion" }, Math.max(0, ...samples.map((s) => s.blur)), 0);
    qa.match({ id: "M4", title: "Counters never show an intermediate value", category: "motion" },
      [...new Set(samples.map((s) => s.figures))].join(" ; "), finalFigures);
    qa.match({ id: "M5", title: "Headline opaque (LCP, never animated)", category: "motion" }, await css(p.h1, "opacity"), "1");
    await qa.attach();
  });

  test.describe("motion allowed", () => {
    test.use({ reducedMotion: "no-preference" });

    test("full motion — the reveal animates, then settles on the same state as reduced motion", async ({ page, context }, testInfo) => {
      await sampleReveal(page);
      const p = await open(page, "en", FRAME);
      await page.waitForFunction(
        (expected) =>
          [...document.querySelectorAll("main > section ul > li > p:first-child > span:first-child")]
            .map((s) => s.textContent)
            .join("|") === expected,
        finalFigures,
      );
      const samples = (await read(page)).filter((s) => s.opacity > 0.01);
      const qa = qaLedger(testInfo, "en", "1440×794 motion");
      qa.match({ id: "M6", title: "Reveal travels with motion allowed (control for M2)", category: "motion" },
        Math.max(0, ...samples.map((s) => s.translate)) > 0, true);
      const settled = await p.section.locator("[style*='will-change']").evaluateAll((els) =>
        els.map((e) => `${getComputedStyle(e).opacity}/${getComputedStyle(e).transform}`),
      );
      qa.match({ id: "M7", title: "Settled: every animated item opaque with no transform", category: "motion" },
        [...new Set(settled)].join(" ; "), "1/none");
      // Same context (same network guard), reduced preference set before load.
      const reduced = await context.newPage();
      await reduced.emulateMedia({ reducedMotion: "reduce" });
      const r = await open(reduced, "en", FRAME);
      qa.match({ id: "M8", title: "Settled geometry identical to reduced motion (copy, CTAs, band, label)", category: "motion" },
        await settledRects(p), await settledRects(r));
      await reduced.close();
      await qa.attach();
    });
  });
});

test.describe("Responsive — horizontal overflow smoke (no Figma frames below 1440)", () => {
  for (const locale of ["en", "ar"] as Locale[]) {
    for (const width of [390, 768, 1024, 1280, 1440]) {
      test(`${locale.toUpperCase()} ${width} — Hero content stays inside the viewport`, async ({ page }, testInfo) => {
        const p = await open(page, locale, { width, height: 900 });
        const qa = qaLedger(testInfo, locale, `${width}×900`);
        const overflow = await p.section.evaluate((section, vw) => {
          const out = [...section.querySelectorAll<HTMLElement>("h1, p, a, li")]
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ r }) => r.width > 0 && (r.left < -0.5 || r.right > vw + 0.5))
            .map(({ el, r }) => `${el.tagName.toLowerCase()} ${Math.round(r.left)}–${Math.round(r.right)}`);
          return { pageWidth: document.documentElement.scrollWidth, out };
        }, width);
        qa.match({ id: "R1", title: "Page scroll width", category: "responsive" }, overflow.pageWidth, width);
        qa.match({ id: "R2", title: "Hero text and CTAs outside the viewport", category: "responsive" }, overflow.out.join(", ") || "none", "none");
        if (width !== FRAME.width) {
          qa.unavailable({ id: "R.ref", title: "Figma frame at this width", category: "responsive", note: ref.unavailableReason("en+ar") ?? "" });
        }
        await qa.attach();
      });
    }
  }
});
