import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
 * About › Company Documents cards and closing band, Designer findings #5 and
 * #6 of Infoline-09-About-Page.pdf (Figma 406:3687 cards, 406:3713 band).
 *
 *   DC  card geometry, typography, chrome and the DOWNLOAD action
 *   DU  honesty of the action: no approved PDF exists, so it must NOT look or
 *       behave like a working download (disabled button, not brand blue, no link)
 *   DB  closing band sits on the page ground, no slate strip of its own
 *
 * Gate A — expected values read from the cached Figma node boxes/variables.
 * Gate B — card stack ink box vs the Figma render (pixel mismatch advisory).
 *
 * The real download path (an actual PDF) cannot be exercised: no approved file
 * exists. It is covered by the unit test tests/unit/components/about-documents.test.tsx.
 */

const ref = loadReferences("about-documents");
const GROUP = ref.node("406:3687"); // 549 × 200
const CARDS = [
  { card: ref.node("406:3688"), icon: ref.node("406:3694"), title: ref.node("406:3696"), meta: ref.node("406:3697"), action: ref.node("406:3698"), figmaMeta: "PDF · 1.0 MB" },
  { card: ref.node("406:3700"), icon: ref.node("406:3706"), title: ref.node("406:3708"), meta: ref.node("406:3709"), action: ref.node("406:3710"), figmaMeta: "PDF · 1.6 MB" },
];
const BAND = ref.node("406:3713"); // 1278 × 242, radius 20
const BAND_RADIUS = 20; // design context
const TOL = 2;
const VIEWPORTS = [
  { width: 1440, height: 1080 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

type Rect = { x: number; y: number; width: number; height: number };
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const css = (el: Locator, prop: string) => el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);
const px = (token: string) => `${ref.token(token)}px`;

async function open(page: Page, locale: Locale, vp: { width: number; height: number }) {
  await setMotionPreference(page, "reduce");
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`/${locale}/about`);
  await waitForHydration(page);
  const docs = page.locator("main > section", { has: page.getByRole("heading", { level: 2, name: messages[locale].AboutPage.documents.title }) });
  const band = page.locator("main > section", { has: page.getByRole("heading", { level: 3, name: messages[locale].AboutPage.cta.title }) });
  await docs.scrollIntoViewIfNeeded();
  await settle(page, docs);
  await band.scrollIntoViewIfNeeded();
  await settle(page, band);
  await hideOverlays(page);
  return { docs, band };
}

async function docRect(el: Locator): Promise<Rect> {
  return el.first().evaluate((n) => {
    const r = n.getBoundingClientRect();
    return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
  });
}

function cardParts(docs: Locator, locale: Locale, i: number) {
  const item = messages[locale].AboutPage.documents.items[i];
  const title = docs.getByText(item.title, { exact: true });
  const card = title.locator('xpath=ancestor-or-self::*[contains(@class,"rounded-2xl")][1]');
  return {
    item,
    title,
    meta: docs.getByText(item.meta, { exact: true }),
    card,
    icon: card.locator("img").first(),
    action: card.locator("button, a[href]"),
    label: card.getByText(item.cta, { exact: true }),
  };
}

/** First background colour found walking up from `el` (transparent layers skipped). */
const groundOf = (el: Locator) =>
  el.evaluate((n) => {
    for (let e: Element | null = n; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
    }
    return "transparent";
  });

test.describe("Gate A — Company Profile cards vs Figma 406:3687", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`${locale.toUpperCase()} 1440 — card geometry, typography, DOWNLOAD action, honest state`, async ({ page }, testInfo) => {
      const { docs } = await open(page, locale, VIEWPORTS[0]);
      const qa = qaLedger(testInfo, locale, "1440×1080");
      const ltr = locale === "en";
      const rects: Rect[] = [];

      for (const [i, F] of CARDS.entries()) {
        const p = cardParts(docs, locale, i);
        const n = `DC${i + 1}`;
        const card = await docRect(p.card);
        rects.push(card);
        qa.match({ id: `${n}.1`, title: `Card ${i + 1} size 549 × 92`, category: "layout" },
          `${round(card.width)},${round(card.height)}`, `${F.card.width},${F.card.height}`,
          (a, e) => a.split(",").every((v, k) => Math.abs(Number(v) - Number(e.split(",")[k])) <= TOL));
        qa.decision({ id: `${n}.2`, title: "Card radius: Figma 16 (radius/xl), site rounded-2xl", category: "visual",
          note: "PQA-032: the brief preserves the existing card radius; the project's rounded-2xl is 20px. Unchanged, for the Designer to decide." },
          await css(p.card, "border-top-left-radius"), px("radius/xl"));
        qa.match({ id: `${n}.3`, title: "Card border 1px #e0e0e0 (border/neutral/muted)", category: "colour" },
          `${await css(p.card, "border-top-width")} ${await css(p.card, "border-top-color")}`, `1px ${hexToRgb(ref.token("border/neutral/muted"))}`);
        qa.match({ id: `${n}.4`, title: "Card background white (surface/base/layer-1)", category: "colour" },
          await css(p.card, "background-color"), hexToRgb(ref.token("surface/base/layer-1")));
        // Tailwind composes box-shadow with empty ring layers; the Figma layer must be one of them.
        qa.match({ id: `${n}.5`, title: "Card shadow layer 0 6px 6px rgba(52,55,70,0.06) present", category: "visual" },
          (await css(p.card, "box-shadow")).replace(/\s+/g, " ").includes("rgba(52, 55, 70, 0.06) 0px 6px 6px"), true);

        // Icon 40 × 40, 24px from the leading edge, vertically centred.
        const icon = await docRect(p.icon);
        qa.match({ id: `${n}.6`, title: "PDF icon 40 × 40", category: "assets" }, `${round(icon.width)},${round(icon.height)}`, `${F.icon.width},${F.icon.height}`,
          (a, e) => a.split(",").every((v, k) => Math.abs(Number(v) - Number(e.split(",")[k])) <= TOL));
        const lead = ltr ? icon.x - card.x : card.x + card.width - (icon.x + icon.width);
        qa.match({ id: `${n}.7`, title: "PDF icon 24px from the leading edge", category: "layout" }, round(lead), F.icon.x, within(TOL));
        qa.match({ id: `${n}.8`, title: "PDF icon vertically centred (Figma top 26)", category: "layout" }, round(icon.y - card.y), F.icon.y - F.card.y, within(TOL));

        // Title 14/20 #263238, meta 13/20.
        qa.match({ id: `${n}.9`, title: "Title 14/20, colour content/base/primary", category: "typography" },
          `${await css(p.title, "font-size")}/${await css(p.title, "line-height")}/${await css(p.title, "color")}`,
          `${px("font-size/text-base")}/${px("line-height/leading-20")}/${hexToRgb(ref.token("content/base/primary"))}`);
        qa.match({ id: `${n}.10`, title: "Meta 13/20", category: "typography" },
          `${await css(p.meta, "font-size")}/${await css(p.meta, "line-height")}`, `${px("font-size/text-sm")}/${px("line-height/leading-20")}`);
        qa.advisory({ id: `${n}.11`, title: "Title weight (Figma Avenir Heavy 900; site bold 700) and meta text", category: "typography",
          note: "Heading/body weight mapping is site-wide (PQA-020). The site shows PDF sizes 5.2 / 5.4 MB, Figma 1.0 / 1.6 MB: unverifiable without the PDFs (PQA-032)." },
          `${await css(p.title, "font-weight")}; meta "${p.item.meta}" vs Figma "${F.figmaMeta}"`);

        // DOWNLOAD action (finding #5).
        const count = await p.action.count();
        qa.match({ id: `${n}.12`, title: "Card has the DOWNLOAD action (one control)", category: "layout" }, count, 1);
        if (count === 1) {
          const a = await docRect(p.action);
          const trail = ltr ? card.x + card.width - (a.x + a.width) : a.x - card.x;
          qa.match({ id: `${n}.13`, title: "Action 24px from the trailing edge (opposite end from the icon)", category: "layout" }, round(trail), F.card.width - (F.action.x + F.action.width), within(TOL));
          qa.match({ id: `${n}.14`, title: "Action vertically centred on the card", category: "layout" },
            round(a.y + a.height / 2 - (card.y + card.height / 2)), 0, within(TOL));
          qa.match({ id: `${n}.15`, title: "Action height 16 (overline/sm/medium line-height)", category: "typography" }, round(a.height), Number(ref.token("line-height/leading-16")), within(TOL));
          qa.match({ id: `${n}.16`, title: "Action typography 13px, weight 500, uppercase", category: "typography" },
            `${await css(p.label, "font-size")}/${await css(p.label, "font-weight")}/${await css(p.label, "text-transform")}`,
            `${px("font-size/text-sm")}/${ref.token("font-weight/Medium")}/uppercase`);
          qa.match({ id: `${n}.17`, title: ltr ? "Action letter-spacing 1.5px (tracking-wider)" : "Action letter-spacing 0 (site rule: Arabic is never tracked)", category: "typography" },
            await css(p.label, "letter-spacing"), ltr ? `${ref.token("Letter Spacing/tracking-wider")}px` : "normal");
          // Tailwind v4's rotate-180 sets the individual `rotate` property (transform stays "none").
          const arrow = await p.action.locator("svg").evaluateAll((els) => els.map((e) => { const cs = getComputedStyle(e); return { rotate: cs.rotate, transform: cs.transform }; }));
          const rotated = (a: { rotate: string; transform: string }) => a.rotate === "180deg" || /^matrix\(-1,/.test(a.transform);
          qa.match({ id: `${n}.18`, title: ltr ? "Arrow icon present, pointing inline-end" : "Arrow icon present and rotated for RTL", category: "assets" },
            arrow.length === 1 && (ltr ? !rotated(arrow[0]) : rotated(arrow[0])), true);

          // DU — honesty: no approved PDF exists, so nothing here may look or act like a working download.
          const state = await p.action.evaluate((el) => ({
            tag: el.tagName, disabled: (el as HTMLButtonElement).disabled === true, href: el.getAttribute("href"), tabbable: el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled,
          }));
          qa.match({ id: `DU${i + 1}.1`, title: "Unavailable action is a disabled button (no link, no download target)", category: "assets" },
            `${state.tag}|${state.disabled}|${state.href}`, "BUTTON|true|null");
          qa.match({ id: `DU${i + 1}.2`, title: "Unavailable action is not reachable by keyboard", category: "assets" }, state.tabbable, false);
          qa.match({ id: `DU${i + 1}.3`, title: "Unavailable action is not brand blue (does not look like a working download)", category: "colour" },
            (await css(p.label, "color")) !== hexToRgb(ref.token("content/brand/default")), true);
        }
        qa.match({ id: `DU${i + 1}.4`, title: "Card is not a link (no anchor, no '#' target)", category: "assets" }, await p.card.locator("a").count(), 0);
        qa.advisory({ id: `DU${i + 1}.5`, title: "Brand blue (#1c97d4) when the PDF becomes available", category: "colour",
          note: "Figma colour for the live state; shown automatically once the document href is real (unit-tested). Not testable here: no PDF exists (PQA-032)." },
          `Figma ${ref.token("content/brand/default")}`);
      }
      qa.match({ id: "DC3.1", title: "Gap between the two cards 16 (Figma 108 − 92)", category: "layout" },
        round(rects[1].y - (rects[0].y + rects[0].height)), CARDS[1].card.y - (CARDS[0].card.y + CARDS[0].card.height), within(TOL));
      await qa.attach();
    });
  }
});

test.describe("Gate A — closing band vs Figma 406:3713", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`${locale.toUpperCase()} 1440 — page ground, no slate strip, buttons`, async ({ page }, testInfo) => {
      const { docs, band } = await open(page, locale, VIEWPORTS[0]);
      const qa = qaLedger(testInfo, locale, "1440×1080");
      qa.match({ id: "DB1", title: "Closing band section has no background of its own (no slate strip)", category: "colour" },
        await css(band, "background-color"), "rgba(0, 0, 0, 0)");
      const ground = await groundOf(band);
      qa.match({ id: "DB2", title: "Band sits on the same page ground as the Documents section above (white body)", category: "colour" },
        ground, await groundOf(docs));
      qa.match({ id: "DB3", title: "Page ground is white (surface/base/layer-1)", category: "colour" }, ground, hexToRgb(ref.token("surface/base/layer-1")));

      const panel = band.locator("div.rounded-2xl").first();
      const box = await docRect(panel);
      const sec = await docRect(band);
      qa.decision({ id: "DB4", title: "Band panel inset, width and radius vs Figma (81 / 1278 / r20)", category: "layout",
        note: "PQA-032: the designer confirmed the band layout is correct; the site uses the 40px container inset and radius 16. Unchanged." },
        `${round(box.x)} / ${round(box.width)} / ${await css(panel, "border-top-left-radius")}`, `${81} / ${BAND.width} / ${BAND_RADIUS}px`);
      qa.advisory({ id: "DB5", title: "Band panel height and section box (regression evidence)", category: "layout", note: "Section padding is unchanged by this fix." },
        `panel ${round(box.height)} (Figma ${BAND.height}); section ${round(sec.width)}×${round(sec.height)}`);

      // Both buttons keep their locale-aware targets.
      const copy = messages[locale].AboutPage.cta;
      const hrefs = await band.locator("a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
      qa.match({ id: "DB6", title: "Both CTA buttons keep their localised routes", category: "layout" },
        hrefs.join("|"), `/${locale}${copy.button.href}|/${locale}${copy.secondaryButton.href}`);
      qa.match({ id: "DB7", title: "Both CTA buttons visible", category: "layout" },
        (await band.getByRole("link", { name: copy.button.label }).isVisible()) && (await band.getByRole("link", { name: copy.secondaryButton.label }).isVisible()), true);

      if (process.env.QA_EVIDENCE_DIR && locale === "en") {
        mkdirSync(process.env.QA_EVIDENCE_DIR, { recursive: true });
        const top = Math.max(0, sec.y - 60);
        writeFileSync(`${process.env.QA_EVIDENCE_DIR}/band-surround.png`,
          await page.screenshot({ fullPage: true, animations: "disabled", clip: { x: 0, y: top, width: 1440, height: sec.height + 120 } }));
      }
      await qa.attach();
    });
  }
});

/** Row of the first pixel that is clearly darker than white in column `x` (the top card border). */
async function firstInkRow(browser: Browser, png: Buffer, x: number) {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    return await page.evaluate(async ({ b64, x }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
      const g = c.getContext("2d")!;
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      for (let y = 0; y < c.height; y++) if (255 - d[(y * c.width + x) * 4] > 25) return y;
      return -1;
    }, { b64: png.toString("base64"), x });
  } finally {
    await context.close();
  }
}

test.describe("Gate B — card stack vs the Figma render", () => {
  test("EN 1440 — ink box of the two cards", async ({ page, browser }, testInfo) => {
    const { docs } = await open(page, "en", VIEWPORTS[0]);
    const qa = qaLedger(testInfo, "en", "1440×1080");
    const reference = readFileSync(join(process.cwd(), "tests/visual/figma/about-documents", "406-3687.en.573.png"));
    const self = await compareImages(browser, reference, reference, []);
    qa.match({ id: "DG.0", title: "Self-compare (Figma vs itself) mismatch = 0", category: "visual" }, self.mismatchRatio, 0);

    const c1 = await docRect(cardParts(docs, "en", 0).card);
    const c2 = await docRect(cardParts(docs, "en", 1).card);
    // The Figma render includes the drop shadow: 12px of bleed on the left/right, the top border at `offY`.
    const offX = Math.round((573 - GROUP.width) / 2);
    const offY = await firstInkRow(browser, reference, Math.round(573 / 2));
    const W = 573, H = 224;
    const actual = await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide", clip: { x: c1.x - offX, y: c1.y - offY, width: W, height: H } });
    const box = { x: offX - 2, y: offY - 2, width: GROUP.width + 4, height: GROUP.height + 4 };
    const ink = await measureInk(browser, reference, actual, [box], [box]);
    const geo = inkGeometryMatches(ink.act[0], ink.ref[0]);
    qa.match({ id: "DG.1", title: "Card stack ink bounding box (size within max(2px,5%), centre within 2px)", category: "visual" }, geo.ok ? "match" : geo.detail, "match");
    qa.match({ id: "DG.2", title: "Cards stacked with the Figma gap (second card top − first card bottom = 16)", category: "layout" },
      round(c2.y - (c1.y + c1.height)), 16, within(TOL));
    const cmp = await compareImages(browser, reference, actual, [{ name: "Cards", x: 0, y: 0, width: W, height: H }]);
    qa.advisory({ id: "DG.3", title: "Pixel mismatch, card stack", category: "visual",
      note: "Evidence only: the action is disabled (grey) here, Figma shows it brand blue; PDF sizes differ (5.2/5.4 vs 1.0/1.6 MB)." },
      `${(cmp.regions[0].mismatchRatio * 100).toFixed(2)}%`);
    if (process.env.QA_EVIDENCE_DIR) {
      mkdirSync(process.env.QA_EVIDENCE_DIR, { recursive: true });
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/cards-build.png`, actual);
      writeFileSync(`${process.env.QA_EVIDENCE_DIR}/cards-overlay.png`, cmp.overlayPng);
    }
    await testInfo.attach("cards-build.png", { body: actual, contentType: "image/png" });
    await qa.attach();
  });
});

test.describe("Responsive and RTL", () => {
  for (const locale of ["en", "ar"] as const) {
    for (const vp of VIEWPORTS) {
      test(`${locale.toUpperCase()} ${vp.width}×${vp.height} — cards, action, band`, async ({ page }, testInfo) => {
        const { docs, band } = await open(page, locale, vp);
        const qa = qaLedger(testInfo, locale, `${vp.width}×${vp.height}`);
        qa.match({ id: "DR.1", title: "No horizontal overflow", category: "responsive" },
          await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        for (const i of [0, 1]) {
          const p = cardParts(docs, locale, i);
          const card = await docRect(p.card);
          qa.match({ id: `DR.2.${i + 1}`, title: `Card ${i + 1} inside the viewport`, category: "responsive" }, card.x >= -0.5 && card.x + card.width <= vp.width + 0.5, true);
          if ((await p.action.count()) === 1) {
            const a = await docRect(p.action);
            const text = await docRect(p.title);
            const meta = await docRect(p.meta);
            const inside = a.x >= card.x - 0.5 && a.x + a.width <= card.x + card.width + 0.5 && a.y >= card.y && a.y + a.height <= card.y + card.height;
            qa.match({ id: `DR.3.${i + 1}`, title: `Card ${i + 1} action fully inside its card`, category: "responsive" }, inside, true);
            const overlaps = [text, meta].some((t) => a.x < t.x + t.width && a.x + a.width > t.x && a.y < t.y + t.height && a.y + a.height > t.y);
            qa.match({ id: `DR.4.${i + 1}`, title: `Card ${i + 1} action does not overlap the title or size text`, category: "responsive" }, overlaps, false);
            const trailing = locale === "en" ? a.x > text.x : a.x < text.x;
            qa.match({ id: `DR.5.${i + 1}`, title: `Card ${i + 1} action at the trailing end (RTL-aware)`, category: "rtl" }, trailing, true);
          }
          qa.match({ id: `DR.6.${i + 1}`, title: `Card ${i + 1} title and size text not clipped by the card`, category: "responsive" },
            await p.card.evaluate((el) => [...el.querySelectorAll("span")].every((s) => s.scrollWidth <= s.clientWidth + 1 || getComputedStyle(s).display === "inline")), true);
        }
        qa.match({ id: "DR.7", title: "Closing band section has no background of its own", category: "colour" }, await css(band, "background-color"), "rgba(0, 0, 0, 0)");
        const copy = messages[locale].AboutPage.cta;
        const links = [band.getByRole("link", { name: copy.button.label }), band.getByRole("link", { name: copy.secondaryButton.label })];
        qa.match({ id: "DR.8", title: "Both CTA buttons visible and inside the viewport", category: "responsive" },
          (await Promise.all(links.map(async (l) => { const r = await docRect(l); return (await l.isVisible()) && r.x >= 0 && r.x + r.width <= vp.width + 0.5; }))).every(Boolean), true);
        qa.match({ id: "DR.9", title: "Document direction", category: "rtl" }, await page.evaluate(() => document.documentElement.dir), locale === "ar" ? "rtl" : "ltr");
        if (vp.width !== 1440) {
          qa.unavailable({ id: "DR.10", title: "Figma frame at this width", category: "responsive", note: "Only 1440 frames exist (PQA-032)." });
        }
        await qa.attach();
      });
    }
  }
});
