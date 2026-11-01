import { describe, expect, it, vi } from "vitest";
import { isHomeVariantPreviewEnabled, resolveHomeVariant } from "@/lib/home-variant";

describe("resolveHomeVariant", () => {
  it("defaults to the current design", () => {
    expect(resolveHomeVariant(undefined, true)).toBe("current");
  });

  it("honours an explicit current", () => {
    expect(resolveHomeVariant("current", true)).toBe("current");
  });

  it("selects the new design only for an exact `new`", () => {
    expect(resolveHomeVariant("new", true)).toBe("new");
  });

  it.each(["", "NEW", "New", "alt", "true", "1", " new"])("falls back safely for %j", (raw) => {
    expect(resolveHomeVariant(raw, true)).toBe("current");
  });

  it("falls back when the parameter is repeated", () => {
    expect(resolveHomeVariant(["new", "current"], true)).toBe("current");
  });

  it("never selects the new design when the preview switch is off", () => {
    expect(resolveHomeVariant("new", false)).toBe("current");
  });
});

describe("isHomeVariantPreviewEnabled", () => {
  it("is off without the opt-in variable, in every environment", () => {
    for (const env of [undefined, "development", "preview", "production"]) {
      expect(isHomeVariantPreviewEnabled(env, undefined)).toBe(false);
    }
  });

  it("is off for any opt-in value other than 1", () => {
    for (const value of ["", "0", "true", "yes", "1 "]) {
      expect(isHomeVariantPreviewEnabled("preview", value)).toBe(false);
    }
  });

  it("is on with the opt-in outside Production (local, preview, self-hosted)", () => {
    expect(isHomeVariantPreviewEnabled(undefined, "1")).toBe(true);
    expect(isHomeVariantPreviewEnabled("development", "1")).toBe(true);
    expect(isHomeVariantPreviewEnabled("preview", "1")).toBe(true);
  });

  it("stays off on Vercel Production even with the opt-in", () => {
    expect(isHomeVariantPreviewEnabled("production", "1")).toBe(false);
  });

  it("reads both variables from the environment by default", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("ENABLE_HOME_VARIANT_PREVIEW", "1");
    expect(isHomeVariantPreviewEnabled()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isHomeVariantPreviewEnabled()).toBe(false);
  });
});
