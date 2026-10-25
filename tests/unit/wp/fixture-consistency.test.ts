import { describe, expect, it } from "vitest";
import { KNOWN_OPERATIONS, VARIANTS, resolve, uris } from "../../support/cms-stub/fixtures.mjs";

/**
 * EN and AR fixtures must be structurally identical: the same keys, the same
 * null-ness, the same array lengths. A fixture that exists only in one locale
 * would let a contract test pass for English and silently skip Arabic.
 */


function signature(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return { array: value.length, items: value.map(signature) };
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, signature(v)]),
    );
  }
  return typeof value;
}

const BY_URI: Record<string, "service" | "caseStudy" | "solution" | "industry" | "insight"> = {
  ServiceByUri: "service",
  CaseStudyByUri: "caseStudy",
  SolutionByUri: "solution",
  IndustryByUri: "industry",
  InsightByUri: "insight",
};

function variablesFor(operation: string, locale: "en" | "ar") {
  if (operation in BY_URI) return { uri: uris(locale)[BY_URI[operation]] };
  if (operation === "PostBySlug") return { id: uris(locale).postSlug };
  // Term-side operations take no language: both locales ask the same question.
  if (operation === "InsightTypeInsights") return { slug: "article" };
  if (operation === "InsightTopicInsights") return { slug: "clarity-speed" };
  return { language: locale === "ar" ? "AR" : "EN" };
}

const ARABIC = /[؀-ۿ]/;

describe("EN/AR fixture consistency", () => {
  it("covers every operation the stub knows", () => {
    // 14 original operations + 6 Insight operations.
    expect(KNOWN_OPERATIONS).toHaveLength(20);
  });

  describe.each(KNOWN_OPERATIONS)("%s", (operation) => {
    it.each(VARIANTS)("has the same structure in EN and AR (%s)", (variant) => {
      const en = resolve(operation, variablesFor(operation, "en"), variant);
      const ar = resolve(operation, variablesFor(operation, "ar"), variant);
      expect(en).toBeDefined();
      expect(signature(ar)).toEqual(signature(en));
    });
  });

  it("by-URI fixtures resolve for each locale's own URI and miss the other's", () => {
    for (const [operation, key] of Object.entries(BY_URI)) {
      const root = Object.keys(resolve(operation, variablesFor(operation, "en"), "full") as object)[0];
      for (const locale of ["en", "ar"] as const) {
        const hit = resolve(operation, { uri: uris(locale)[key] }, "full") as Record<string, { uri: string }>;
        expect(hit[root].uri).toBe(uris(locale)[key]);
      }
      const miss = resolve(operation, { uri: "/nope/" }, "full") as Record<string, unknown>;
      expect(miss[root]).toBeNull();
    }
  });

  it("AR titles are Arabic and EN titles are not (language isolation)", () => {
    const titles = (locale: "en" | "ar") => {
      const out: string[] = [];
      for (const operation of ["Services", "CaseStudies", "Solutions", "Industries", "Clients", "Careers", "Posts", "Insights"]) {
        const data = resolve(operation, variablesFor(operation, locale), "full") as Record<
          string,
          { nodes: { title: string }[] }
        >;
        out.push(...Object.values(data)[0].nodes.map((n) => n.title));
      }
      return out;
    };
    expect(titles("en").length).toBeGreaterThan(0);
    expect(titles("en").every((t) => !ARABIC.test(t))).toBe(true);
    expect(titles("ar").every((t) => ARABIC.test(t))).toBe(true);
  });

  it("each locale's entities have distinct identities (no id collisions)", () => {
    const ids = (locale: "en" | "ar") => {
      const clients = resolve("Clients", variablesFor("Clients", locale), "full") as {
        clients: { nodes: { databaseId: number; slug: string }[] };
      };
      const careers = resolve("Careers", variablesFor("Careers", locale), "full") as {
        careers: { nodes: { databaseId: number; slug: string }[] };
      };
      return [...clients.clients.nodes, ...careers.careers.nodes].map((n) => n.databaseId);
    };
    expect(new Set([...ids("en"), ...ids("ar")]).size).toBe(ids("en").length + ids("ar").length);
  });

  it("is deterministic: repeated resolution yields identical data", () => {
    for (const operation of KNOWN_OPERATIONS) {
      const a = JSON.stringify(resolve(operation, variablesFor(operation, "ar"), "full"));
      const b = JSON.stringify(resolve(operation, variablesFor(operation, "ar"), "full"));
      expect(a).toBe(b);
    }
  });
});
