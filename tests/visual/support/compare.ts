import type { Browser } from "@playwright/test";

/**
 * Figma-vs-browser image comparison, computed on a canvas in a blank Chromium
 * page — no image library dependency. Per pixel it uses the YIQ perceptual
 * colour distance (the metric pixelmatch uses) against `threshold` (0–1).
 *
 * Returns the mismatch ratio overall and per named region, plus a diff image
 * (mismatches red over a faded reference) and a 50/50 overlay for designers.
 */
export type Region = { name: string; x: number; y: number; width: number; height: number };

export type Comparison = {
  width: number;
  height: number;
  sizeMatches: boolean;
  referenceSize: { width: number; height: number };
  actualSize: { width: number; height: number };
  mismatchRatio: number;
  regions: { name: string; mismatchRatio: number }[];
  diffPng: Buffer;
  overlayPng: Buffer;
};

type Crop = { x: number; y: number; width: number; height: number };

/**
 * `crop` compares one element in isolation: `reference` is cut at the Figma
 * node's box and `actual` at the element's rendered box (same size), so the
 * result measures rendering fidelity independent of position — Gate A checks
 * position separately.
 */
export async function compareImages(
  browser: Browser,
  reference: Buffer,
  actual: Buffer,
  regions: Region[],
  options: { threshold?: number; crop?: { reference: Crop; actual: Crop } } = {},
): Promise<Comparison> {
  const threshold = options.threshold ?? 0.1;
  const crop = options.crop ?? null;
  // A fresh context: no site CSS, no network guard needed (data URLs only).
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    const result = await page.evaluate(
      async ({ ref, act, regions, threshold, crop }) => {
        const load = async (b64: string) => {
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          await img.decode();
          return img;
        };
        const [a, b] = await Promise.all([load(ref), load(act)]);
        const width = crop ? Math.round(crop.reference.width) : Math.min(a.naturalWidth, b.naturalWidth);
        const height = crop ? Math.round(crop.reference.height) : Math.min(a.naturalHeight, b.naturalHeight);
        const pixels = (img: HTMLImageElement, box: { x: number; y: number } | null) => {
          const c = new OffscreenCanvas(width, height);
          const ctx = c.getContext("2d")!;
          if (box) ctx.drawImage(img, Math.round(box.x), Math.round(box.y), width, height, 0, 0, width, height);
          else ctx.drawImage(img, 0, 0);
          return ctx.getImageData(0, 0, width, height).data;
        };
        const pa = pixels(a, crop?.reference ?? null);
        const pb = pixels(b, crop?.actual ?? null);

        const maxDelta = 35215 * threshold * threshold;
        const yiq = (r: number, g: number, bl: number) => [
          r * 0.29889531 + g * 0.58662247 + bl * 0.11448223,
          r * 0.59597799 - g * 0.2741761 - bl * 0.32180189,
          r * 0.21147017 - g * 0.52261711 + bl * 0.31114694,
        ];
        const mismatch = new Uint8Array(width * height);
        const diff = new ImageData(width, height);
        const overlay = new ImageData(width, height);
        let total = 0;
        for (let i = 0; i < width * height; i++) {
          const o = i * 4;
          const [y1, i1, q1] = yiq(pa[o], pa[o + 1], pa[o + 2]);
          const [y2, i2, q2] = yiq(pb[o], pb[o + 1], pb[o + 2]);
          const delta = 0.5053 * (y1 - y2) ** 2 + 0.299 * (i1 - i2) ** 2 + 0.1957 * (q1 - q2) ** 2;
          const bad = delta > maxDelta;
          mismatch[i] = bad ? 1 : 0;
          total += mismatch[i];
          // Diff: reference greyed at 25% luminance, mismatches in red.
          const grey = 255 - 0.25 * (255 - y1);
          diff.data[o] = bad ? 230 : grey;
          diff.data[o + 1] = bad ? 30 : grey;
          diff.data[o + 2] = bad ? 50 : grey;
          diff.data[o + 3] = 255;
          for (let k = 0; k < 3; k++) overlay.data[o + k] = (pa[o + k] + pb[o + k]) / 2;
          overlay.data[o + 3] = 255;
        }

        const regionRatios = regions.map((r) => {
          const x0 = Math.max(0, Math.round(r.x));
          const y0 = Math.max(0, Math.round(r.y));
          const x1 = Math.min(width, Math.round(r.x + r.width));
          const y1 = Math.min(height, Math.round(r.y + r.height));
          let bad = 0;
          let count = 0;
          for (let y = y0; y < y1; y++)
            for (let x = x0; x < x1; x++) {
              bad += mismatch[y * width + x];
              count++;
            }
          return { name: r.name, mismatchRatio: count ? bad / count : 0 };
        });

        const encode = async (data: ImageData) => {
          const c = new OffscreenCanvas(width, height);
          c.getContext("2d")!.putImageData(data, 0, 0);
          const blob = await c.convertToBlob({ type: "image/png" });
          const bytes = new Uint8Array(await blob.arrayBuffer());
          let s = "";
          for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(s);
        };

        return {
          width,
          height,
          referenceSize: { width: a.naturalWidth, height: a.naturalHeight },
          actualSize: { width: b.naturalWidth, height: b.naturalHeight },
          mismatchRatio: total / (width * height),
          regions: regionRatios,
          diff: await encode(diff),
          overlay: await encode(overlay),
        };
      },
      { ref: reference.toString("base64"), act: actual.toString("base64"), regions, threshold, crop },
    );
    return {
      width: result.width,
      height: result.height,
      referenceSize: result.referenceSize,
      actualSize: result.actualSize,
      sizeMatches:
        crop !== null ||
        (result.referenceSize.width === result.actualSize.width &&
          result.referenceSize.height === result.actualSize.height),
      mismatchRatio: result.mismatchRatio,
      regions: result.regions,
      diffPng: Buffer.from(result.diff, "base64"),
      overlayPng: Buffer.from(result.overlay, "base64"),
    };
  } finally {
    await context.close();
  }
}
