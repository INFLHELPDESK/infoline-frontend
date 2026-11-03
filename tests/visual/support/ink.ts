import type { Browser } from "@playwright/test";

/**
 * Ink measurements on two PNGs (Figma reference and browser capture),
 * computed on a canvas in a blank Chromium page — no image dependency.
 *
 * - Ink = pixels whose YIQ distance from the crop's background exceeds
 *   INK_THRESHOLD. The background is the most frequent colour on the crop's
 *   1px border ring, so this assumes a flat background (true for logo slots,
 *   pills and text on solid fills; not for text on photographs).
 * - inkBox: bounding box of the ink (crop-relative). Anti-aliasing moves it by
 *   at most a pixel, so it is a geometry signal that thin text and thin logos
 *   do not destabilise, unlike a pixel-mismatch ratio.
 * - identity: each actual crop's ink, scaled to a common grid, against every
 *   reference crop's ink; distance = 1 − IoU of the binarised ink. The best
 *   match says which reference element the build actually draws, independent
 *   of filenames, alt text or Figma layer names.
 */
export const INK_THRESHOLD = 0.15; // YIQ, same scale as compare.ts (0..1)
const GRID = { w: 96, h: 48 };

export type CropBox = { x: number; y: number; width: number; height: number };
export type InkBox = { x: number; y: number; width: number; height: number; pixels: number; background: string };

export async function measureInk(
  browser: Browser,
  reference: Buffer,
  actual: Buffer,
  refCrops: CropBox[],
  actCrops: CropBox[],
): Promise<{ ref: InkBox[]; act: InkBox[]; distance: number[][] }> {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    return await page.evaluate(
      async ({ refB64, actB64, refCrops, actCrops, threshold, grid }) => {
        const load = async (b64: string) => {
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          await img.decode();
          return img;
        };
        const [ri, ai] = await Promise.all([load(refB64), load(actB64)]);
        const maxDelta = 35215 * threshold * threshold;
        const yiq = (r: number, g: number, b: number) => [
          r * 0.29889531 + g * 0.58662247 + b * 0.11448223,
          r * 0.59597799 - g * 0.2741761 - b * 0.32180189,
          r * 0.21147017 - g * 0.52261711 + b * 0.31114694,
        ];
        const dist = (a: number[], b: number[]) => 0.5053 * (a[0] - b[0]) ** 2 + 0.299 * (a[1] - b[1]) ** 2 + 0.1957 * (a[2] - b[2]) ** 2;

        const analyse = (img: HTMLImageElement, c: { x: number; y: number; width: number; height: number }) => {
          const w = Math.max(1, Math.round(c.width));
          const h = Math.max(1, Math.round(c.height));
          const cv = new OffscreenCanvas(w, h);
          const ctx = cv.getContext("2d")!;
          ctx.drawImage(img, Math.round(c.x), Math.round(c.y), w, h, 0, 0, w, h);
          const d = ctx.getImageData(0, 0, w, h).data;
          // Background: modal colour (quantised to 8 levels) on the border ring.
          const counts = new Map<string, { n: number; rgb: number[] }>();
          const ring = (x: number, y: number) => {
            const o = (y * w + x) * 4;
            const key = `${d[o] >> 5},${d[o + 1] >> 5},${d[o + 2] >> 5}`;
            const e = counts.get(key) ?? { n: 0, rgb: [d[o], d[o + 1], d[o + 2]] };
            e.n++;
            counts.set(key, e);
          };
          for (let x = 0; x < w; x++) { ring(x, 0); ring(x, h - 1); }
          for (let y = 0; y < h; y++) { ring(0, y); ring(w - 1, y); }
          const bg = [...counts.values()].sort((a, b) => b.n - a.n)[0].rgb;
          const bgY = yiq(bg[0], bg[1], bg[2]);
          const mask = new Uint8Array(w * h);
          let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
          for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
              const o = (y * w + x) * 4;
              if (dist(yiq(d[o], d[o + 1], d[o + 2]), bgY) > maxDelta) {
                mask[y * w + x] = 1;
                n++;
                if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
              }
            }
          const box = n ? { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } : { x: 0, y: 0, width: 0, height: 0 };
          // Ink resampled onto a common grid (nearest), for identity matching.
          const g = new Uint8Array(grid.w * grid.h);
          if (n) {
            for (let gy = 0; gy < grid.h; gy++)
              for (let gx = 0; gx < grid.w; gx++) {
                const sx = box.x + Math.min(box.width - 1, Math.floor(((gx + 0.5) * box.width) / grid.w));
                const sy = box.y + Math.min(box.height - 1, Math.floor(((gy + 0.5) * box.height) / grid.h));
                g[gy * grid.w + gx] = mask[sy * w + sx];
              }
          }
          return { box: { ...box, pixels: n, background: `rgb(${bg.join(", ")})` }, grid: g };
        };

        const ref = refCrops.map((c) => analyse(ri, c));
        const act = actCrops.map((c) => analyse(ai, c));
        const distance = act.map((a) =>
          ref.map((r) => {
            let inter = 0, union = 0;
            for (let i = 0; i < a.grid.length; i++) {
              inter += a.grid[i] & r.grid[i];
              union += a.grid[i] | r.grid[i];
            }
            return union ? 1 - inter / union : 1;
          }),
        );
        return { ref: ref.map((r) => r.box), act: act.map((a) => a.box), distance };
      },
      { refB64: reference.toString("base64"), actB64: actual.toString("base64"), refCrops, actCrops, threshold: INK_THRESHOLD, grid: GRID },
    );
  } finally {
    await context.close();
  }
}

/** Predefined ink-geometry constraint: size within max(2px, 5%), centre within 2px. */
export function inkGeometryMatches(a: InkBox, f: InkBox) {
  const sizeOk = (x: number, e: number) => Math.abs(x - e) <= Math.max(2, e * 0.05);
  const cx = (b: InkBox) => b.x + b.width / 2;
  const cy = (b: InkBox) => b.y + b.height / 2;
  return {
    ok: sizeOk(a.width, f.width) && sizeOk(a.height, f.height) && Math.abs(cx(a) - cx(f)) <= 2 && Math.abs(cy(a) - cy(f)) <= 2,
    detail: `ink ${a.width}×${a.height} @ ${(a.x + a.width / 2).toFixed(1)},${(a.y + a.height / 2).toFixed(1)} vs Figma ${f.width}×${f.height} @ ${(f.x + f.width / 2).toFixed(1)},${(f.y + f.height / 2).toFixed(1)}`,
  };
}

/** Predefined identity constraint: the expected reference is the best match by ≥ 0.05; otherwise uncertain. */
export const IDENTITY_MARGIN = 0.05;
export function identityVerdict(row: number[], expected: number) {
  const order = row.map((d, i) => [d, i] as const).sort((a, b) => a[0] - b[0]);
  const [best, second] = order;
  const margin = (second?.[0] ?? 1) - best[0];
  if (margin < IDENTITY_MARGIN) return { status: "uncertain" as const, best: best[1], margin, distance: best[0] };
  return { status: best[1] === expected ? ("match" as const) : ("mismatch" as const), best: best[1], margin, distance: best[0] };
}
