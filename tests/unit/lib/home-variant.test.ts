import { describe, expect, it } from "vitest";
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
  it("is off on Vercel Production only", () => {
    expect(isHomeVariantPreviewEnabled("production")).toBe(false);
    expect(isHomeVariantPreviewEnabled("preview")).toBe(true);
    expect(isHomeVariantPreviewEnabled("development")).toBe(true);
    expect(isHomeVariantPreviewEnabled(undefined)).toBe(true);
  });
});
