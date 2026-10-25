import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", ".json"];

/** WordPress infrastructure that no running code may reach yet. */
const WP_ENTRY = /^(lib\/wp\/|providers\/|lib\/content-adapters\.)/;

/**
 * The routes wired to WordPress so far (/[locale]/insights, /[locale]/blog, the
 * blog detail destination /[locale]/blog/[slug] and the Insight detail
 * /[locale]/insights/[slug]) and the modules
 * built only for them. These may reach the WP layer; nothing else may reach them
 * (a second page importing one is a second wired route). Adding an entry here
 * is the deliberate act of wiring another route.
 */
const WIRED_ROUTE_FILES = [
  "app/[locale]/(site)/insights/page.tsx",
  "components/sections/insights/formats-live.tsx",
  "lib/insights-feed.ts",
  "lib/blog-post.ts",
  "app/[locale]/blog/[slug]/page.tsx",
  "app/[locale]/(site)/blog/page.tsx",
  "components/sections/blog/updates.tsx",
  "lib/insights-actions.ts",
  "lib/insights-cards.ts",
  "lib/insights-listing.ts",
  "app/[locale]/insights/[slug]/page.tsx",
  "lib/insights-detail.ts",
  // Article SEO: translation verification, hreflang and the sitemap's Insight entries.
  "lib/insights-seo.ts",
  "lib/insights-sitemap.ts",
  "app/sitemap.ts",
];

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
function findWpReach(entries: string[], wired: readonly string[] = []): Map<string, string> {
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
      if (WP_ENTRY.test(target) || wired.includes(target)) {
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
 * Only the selected route (WIRED_ROUTE_FILES) may use WordPress. Nothing else
 * the app can run (other routes, components, hooks, i18n, proxy, config, other
 * lib code) may import the WP layer or a wired-route module, directly or
 * transitively, so no other page can start fetching CMS data.
 */
describe("WordPress infrastructure is reachable only from the wired route", () => {
  const entries = [
    ...ROOT_DIRS.flatMap(walk).filter((f) => !WP_ENTRY.test(f) && !WIRED_ROUTE_FILES.includes(f)),
    ...ROOT_FILES.filter((f) => existsSync(join(root, f))),
  ];

  it("scans a non-trivial set of modules", () => {
    expect(entries.length).toBeGreaterThan(100);
  });

  it("has no import path (static, dynamic, re-export, relative or transitive) into the WP layer or a wired-route module", () => {
    expect([...findWpReach(entries, WIRED_ROUTE_FILES).values()]).toEqual([]);
  });

  describe("the wired route", () => {
    it("lists only files that exist", () => {
      for (const file of WIRED_ROUTE_FILES) expect(existsSync(join(root, file)), file).toBe(true);
    });

    it("is confined to the Insights and Blog routes, the sitemap and their dedicated modules", () => {
      for (const file of WIRED_ROUTE_FILES) expect(file, file).toMatch(/insights|blog|sitemap/);
    });

    it("really reaches the WP layer (the allowance is not stale)", () => {
      const hits = findWpReach(WIRED_ROUTE_FILES);
      expect(hits.has("lib/wp/server.ts")).toBe(true);
      expect(hits.has("lib/wp/hooks.ts")).toBe(true);
      expect(hits.has("providers/query-client/get-query-client.ts")).toBe(true);
      expect(hits.has("lib/content-adapters.ts")).toBe(true);
    });

    it("is the only code (outside tests) with a direct import of the WP layer", () => {
      const direct = [...ROOT_DIRS.flatMap(walk)]
        .filter((f) => !WP_ENTRY.test(f))
        .filter((f) =>
          specifiers(readFileSync(join(root, f), "utf8")).some((spec) => {
            const target = resolveModule(f, spec);
            return !!target && WP_ENTRY.test(target);
          }),
        );
      // These reach the WP layer only through another wired module: the blog
      // detail page through lib/blog-post, the "Load more" grid through the server action.
      // The Insight detail page likewise goes through lib/insights-detail.
      const viaWired = [
        "app/[locale]/blog/[slug]/page.tsx",
        "components/sections/blog/updates.tsx",
        "app/[locale]/insights/[slug]/page.tsx",
        "app/sitemap.ts",
      ];
      expect(direct.sort()).toEqual(WIRED_ROUTE_FILES.filter((f) => !viaWired.includes(f)).sort());
    });
  });

  describe("the detector itself", () => {
    it("resolves aliases and relative paths to real modules", () => {
      expect(resolveModule("app/[locale]/(site)/page.tsx", "@/lib/site")).toBe("lib/site.ts");
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

    it("reports a non-route module that reaches a wired-route module", () => {
      const hits = findWpReach(["app/[locale]/(site)/blog/page.tsx"], ["lib/site.ts"]);
      expect(hits.get("lib/site.ts")).toBe("app/[locale]/(site)/blog/page.tsx -> lib/site.ts");
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
