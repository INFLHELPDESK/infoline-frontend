import { describe, expect, it } from "vitest";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";

// Workstream A (design conformity #6-#8): Figma 406:3782 has four hero stats.
describe("approved statistics content", () => {
  it.each([
    ["en", en],
    ["ar", ar],
  ])("home hero has the four Figma statistics (%s)", (_l, msgs) => {
    expect(msgs.HomeV1.hero.stats.map((s) => s.value)).toEqual(["22", "68", "400+", "6M+"]);
  });

  it("home hero English labels follow Figma 406:3795-3804", () => {
    expect(en.HomeV1.hero.stats.slice(1).map((s) => s.label)).toEqual([
      "Clients across six sectors",
      "Omani agents ready to assist you",
      "Customer transaction a year",
    ]);
  });

  it("About Omanisation promotions year is 2026 in EN and AR, matching Careers", () => {
    expect(JSON.stringify(en)).toContain("Omanis promoted in 2026");
    expect(JSON.stringify(en)).not.toContain("Omanis promoted in 2024");
    expect(JSON.stringify(ar)).not.toContain("تمت ترقيتهم في 2024");
    expect(JSON.stringify(ar)).toContain("تمت ترقيتهم في 2026");
  });
});
