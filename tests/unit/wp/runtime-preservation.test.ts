import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", ".json"];

/** WordPress infrastructure that no running code may reach yet. */
const WP_ENTRY = /^(lib\/wp\/|providers\/|lib\/content-adapters\.)/;

/** Everything the running app can start from. */
const ROOT_DIRS = ["app", "components", "hooks", "i18n", "lib"];
const ROOT_FILES = ["proxy.ts", "next.config.ts"];

function walk(dir: string): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((name) => {
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) return walk(rel);
    return /\.(ts|tsx|mts|js|jsx|mjs)$/.test(name) ? [rel.replaceAll("\\", "/")] : [];
  });
}

/**
 * Every module specifier in a file: static, side-effect, re-export, dynamic
 * `import()` and `require()` forms, plus `import type` (conservative).
 */
function specifiers(src: string): string[] {
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  return patterns.flatMap((re) => [...src.matchAll(re)].map((m) => m[1]));
}

function resolveModule(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = resolve(root, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(root, dirname(from), spec);
  else return null; // package import
  for (const candidate of [
    ...EXTENSIONS.map((ext) => base + ext),
    ...EXTENSIONS.map((ext) => join(base, "index" + ext)),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return relative(root, candidate).replaceAll("\\", "/");
    }
  }
  return null;
}

/** WP module -> the import chain from an entry that reaches it. */
function findWpReach(entries: string[]): Map<string, string> {
  const parent = new Map<string, string>();
  const queue = [...entries];
  const seen = new Set(entries);
  const hits = new Map<string, string>();
  while (queue.length) {
    const file = queue.shift()!;
    const src = readFileSync(join(root, file), "utf8");
    for (const spec of specifiers(src)) {
      const target = resolveModule(file, spec);
      if (!target || seen.has(target)) continue;
      seen.add(target);
      parent.set(target, file);
      if (WP_ENTRY.test(target)) {
        const chain = [target];
        for (let p = parent.get(target); p; p = parent.get(p)) chain.unshift(p);
        hits.set(target, chain.join(" -> "));
        continue; // do not traverse the WP layer itself
      }
      queue.push(target);
    }
  }
  return hits;
}

/**
 * This slice only lands WordPress infrastructure. Nothing the app can run
 * (routes, components, hooks, i18n, proxy, config, other lib code) may import
 * it, directly or transitively, so no existing page can start fetching CMS
 * data. Remove or relax this guard in the slice that deliberately wires a
 * page.
 */
describe("WordPress infrastructure is not reachable from the running app", () => {
  const entries = [
    ...ROOT_DIRS.flatMap(walk).filter((f) => !WP_ENTRY.test(f)),
    ...ROOT_FILES.filter((f) => existsSync(join(root, f))),
  ];

  it("scans a non-trivial set of modules", () => {
    expect(entries.length).toBeGreaterThan(100);
  });

  it("has no import path (static, dynamic, re-export, relative or transitive) into the WP layer", () => {
    expect([...findWpReach(entries).values()]).toEqual([]);
  });

  describe("the detector itself", () => {
    it("resolves aliases and relative paths to real modules", () => {
      expect(resolveModule("app/[locale]/page.tsx", "@/lib/site")).toBe("lib/site.ts");
      expect(resolveModule("lib/forms/index.ts", "../site")).toBe("lib/site.ts");
      expect(resolveModule("lib/wp/api.ts", "./client")).toBe("lib/wp/client.ts");
      expect(resolveModule("x.ts", "react")).toBeNull();
    });

    it("recognises every import form", () => {
      const src = [
        'import a from "@/lib/wp";',
        'import "@/providers";',
        'export { b } from "../../lib/wp/api";',
        'const c = await import("@/lib/content-adapters");',
        'const d = require("@/lib/wp/hooks");',
      ].join("\n");
      expect(specifiers(src).sort()).toEqual(
        ["@/lib/wp", "../../lib/wp/api", "@/providers", "@/lib/content-adapters", "@/lib/wp/hooks"].sort(),
      );
    });

    it("reports a chain when a module outside the WP layer reaches it", () => {
      // lib/wp/index.ts is itself WP, so seed with a synthetic non-WP entry:
      // any real module importing it would be reported. Prove the walk fires
      // by treating lib/wp/server.ts's dependency edge as the entry point.
      const hits = findWpReach(["lib/wp/server.ts"]);
      expect(hits.get("lib/wp/api.ts")).toBe("lib/wp/server.ts -> lib/wp/api.ts");
    });
  });
});
