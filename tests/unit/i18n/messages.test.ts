import { describe, expect, it } from "vitest";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
import { routing } from "@/i18n/routing";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Every leaf path, e.g. `Header.nav.0.label`. Arrays are indexed. */
function leaves(value: Json, prefix = ""): Map<string, Json> {
  if (value === null || typeof value !== "object") return new Map([[prefix, value]]);
  const out = new Map<string, Json>();
  for (const [key, child] of Object.entries(value)) {
    for (const [path, leaf] of leaves(child, prefix ? `${prefix}.${key}` : key)) {
      out.set(path, leaf);
    }
  }
  return out;
}

/** ICU argument names, e.g. "{email}" -> ["email"]. */
const placeholders = (value: Json) =>
  typeof value === "string"
    ? [...value.matchAll(/\{\s*([A-Za-z0-9_]+)/g)].map((m) => m[1]).sort()
    : [];

const enLeaves = leaves(en as unknown as Json);
const arLeaves = leaves(ar as unknown as Json);

describe("translation parity (en/ar)", () => {
  it("covers every configured locale", () => {
    expect([...routing.locales].sort()).toEqual(["ar", "en"]);
  });

  it("has the same key paths in both locales", () => {
    const missingInAr = [...enLeaves.keys()].filter((k) => !arLeaves.has(k));
    const missingInEn = [...arLeaves.keys()].filter((k) => !enLeaves.has(k));
    expect({ missingInAr, missingInEn }).toEqual({ missingInAr: [], missingInEn: [] });
  });

  it("uses the same leaf types", () => {
    const mismatched = [...enLeaves].filter(
      ([k, v]) => arLeaves.has(k) && typeof v !== typeof arLeaves.get(k),
    );
    expect(mismatched.map(([k]) => k)).toEqual([]);
  });

  it("uses the same ICU placeholders", () => {
    const mismatched = [...enLeaves]
      .filter(([k]) => arLeaves.has(k))
      .filter(([k, v]) => placeholders(v).join() !== placeholders(arLeaves.get(k)!).join())
      .map(([k]) => k);
    expect(mismatched).toEqual([]);
  });

  it("leaves a string empty only when the other locale does too", () => {
    const onlyOneEmpty = [...enLeaves]
      .filter(([k, v]) => arLeaves.has(k) && (v === "") !== (arLeaves.get(k) === ""))
      .map(([k]) => k);
    expect(onlyOneEmpty).toEqual([]);
  });

  // Index-aligned label/key arrays drive the contact form's API mapping.
  it.each(["projectType", "timeline"])("keeps %s labels and API keys index-aligned", (name) => {
    for (const messages of [en, ar]) {
      const form = messages.ContactPage.form as Record<string, unknown>;
      const options = form[`${name}Options`] as string[];
      const keys = form[`${name}Keys`] as string[];
      expect(options).toHaveLength(keys.length);
    }
    expect(ar.ContactPage.form[`${name}Keys` as "projectTypeKeys"]).toEqual(
      en.ContactPage.form[`${name}Keys` as "projectTypeKeys"],
    );
  });
});
