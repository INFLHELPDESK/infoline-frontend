import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Figma reference store (tests/visual/figma/<section>/). The PNG, variables and
 * geometry were fetched from the Figma MCP server and are recorded with SHA-256
 * in manifest.json. Loading verifies every hash first, so a reference that was
 * edited, regenerated from the browser or swapped stops the run instead of
 * quietly becoming the new "truth".
 */

type Viewport = { width: number | string; height?: number };

/**
 * Designer closure report (7 Nov 2026): the Latin font-weight variables were inverted in the
 * design system and are being corrected in the Figma file. The cached reference files below
 * keep the values captured at the time (Black 800, Heavy 900) so their SHA-256 provenance
 * stays valid; token() answers with the corrected values until the references are re-captured.
 * Avenir Black sits above Heavy, so Black carries the higher number.
 */
const CORRECTED_VARIABLES: Record<string, string> = {
  "font-weight/Black": "900",
  "font-weight/Heavy": "800",
};

export type ReferenceEntry = {
  kind: "screenshot" | "variables" | "geometry" | "design-context" | "asset";
  file: string;
  nodeId: string;
  language: string;
  viewport?: Viewport;
  sha256: string;
};

export type Manifest = {
  section: string;
  component: string;
  figma: { fileKey: string; url: string };
  fetchedAt: string;
  references: ReferenceEntry[];
  unavailable: { language: string; viewport: Viewport; reason: string }[];
};

/** Absolute frame of a Figma node, in frame-local CSS px (1x). */
export type Box = { id: string; name: string; x: number; y: number; width: number; height: number };

const FIGMA_DIR = join(__dirname, "..", "figma");

const sha256 = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

/**
 * Figma metadata nests child coordinates relative to their parent; resolve
 * them to the root frame so they compare with `getBoundingClientRect()`.
 */
function parseGeometry(xml: string): Map<string, Box> {
  const boxes = new Map<string, Box>();
  const stack: { x: number; y: number }[] = [];
  const tag = /<(\/)?([\w-]+)([^>]*?)(\/)?>/g;
  const attr = (attrs: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1];
  for (const [, closing, , attrs, selfClosing] of xml.matchAll(tag)) {
    if (closing) {
      stack.pop();
      continue;
    }
    const origin = stack.at(-1) ?? { x: 0, y: 0 };
    const id = attr(attrs, "id");
    const box = {
      id: id ?? "",
      name: attr(attrs, "name") ?? "",
      x: origin.x + Number(attr(attrs, "x") ?? 0),
      y: origin.y + Number(attr(attrs, "y") ?? 0),
      width: Number(attr(attrs, "width") ?? 0),
      height: Number(attr(attrs, "height") ?? 0),
    };
    // The root frame defines the origin (0,0) everything is measured from.
    if (stack.length === 0) {
      box.x = 0;
      box.y = 0;
    }
    if (id) boxes.set(id, box);
    if (!selfClosing) stack.push({ x: box.x, y: box.y });
  }
  return boxes;
}

export function loadReferences(section: string) {
  const dir = join(FIGMA_DIR, section);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as Manifest;

  for (const ref of manifest.references) {
    const actual = sha256(join(dir, ref.file));
    if (actual !== ref.sha256) {
      throw new Error(
        `Figma reference ${section}/${ref.file} does not match manifest.json ` +
          `(expected sha256 ${ref.sha256}, found ${actual}). References are never ` +
          "regenerated from the browser: re-fetch the node from Figma, then update the manifest.",
      );
    }
  }

  const find = (kind: ReferenceEntry["kind"], language: string) =>
    manifest.references.find((r) => r.kind === kind && r.language === language);

  const variablesRef = find("variables", "en");
  const geometryRef = find("geometry", "en");
  if (!variablesRef || !geometryRef) throw new Error(`${section}: manifest lacks variables or geometry`);

  const variables = JSON.parse(readFileSync(join(dir, variablesRef.file), "utf8")) as Record<string, string>;
  const geometry = parseGeometry(readFileSync(join(dir, geometryRef.file), "utf8"));

  return {
    manifest,
    /** Figma variable value by token name; throws on unknown tokens (no guessing).
     *  The two Latin weight variables use the Designer-corrected values (see CORRECTED_VARIABLES). */
    token(name: string): string {
      const value = CORRECTED_VARIABLES[name] ?? variables[name];
      if (value === undefined) throw new Error(`${section}: Figma variable "${name}" is not in the reference`);
      return value;
    },
    /** Absolute geometry of a Figma node; throws on unknown ids. */
    node(id: string): Box {
      const box = geometry.get(id);
      if (!box) throw new Error(`${section}: Figma node ${id} is not in the reference geometry`);
      return box;
    },
    /** Path of the screenshot reference, or undefined when no frame exists. */
    screenshot(language: string) {
      const ref = find("screenshot", language);
      return ref ? { ...ref, path: join(dir, ref.file) } : undefined;
    },
    unavailableReason(language: string) {
      return manifest.unavailable.find((u) => u.language === language)?.reason;
    },
  };
}

/** "#cfd8dc" → "rgb(207, 216, 220)", the form `getComputedStyle` reports. */
export function hexToRgb(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
