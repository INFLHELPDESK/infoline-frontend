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
      "Customer transactions a year", // plural: Designer closure report, 7 Nov 2026
    ]);
  });

  it("About Omanisation promotions year is 2026 in EN and AR, matching Careers", () => {
    expect(JSON.stringify(en)).toContain("Omanis promoted in 2026");
    expect(JSON.stringify(en)).not.toContain("Omanis promoted in 2024");
    expect(JSON.stringify(ar)).not.toContain("تمت ترقيتهم في 2024");
    expect(JSON.stringify(ar)).toContain("تمت ترقيتهم في 2026");
  });

  // Designer review of 2026-11-05 (#7) supersedes the older Figma 406:3795 year.
  it("company founding year is 2004 in every locale and statistic", () => {
    expect(en.HomeV1.hero.stats[0].label).toBe("Operating in Oman since 2004");
    expect(ar.HomeV1.hero.stats[0].label).toBe("نعمل في عُمان منذ 2004");
    expect(en.Proof.stats[0].label).toBe("In continuous operation since 2004.");
    expect(ar.Proof.stats[0].label).toBe("في تشغيل متواصل منذ 2004.");
    expect(JSON.stringify(en)).not.toContain("since 2003");
    expect(JSON.stringify(ar)).not.toContain("منذ 2003");
  });

  it("flags Arabic labels that still need approved translations", () => {
    // Arabic wording for the reworded English labels is not yet supplied; keep it unchanged.
    expect(ar.HomeV1.hero.stats.map((s) => s.label)).toEqual([
      "نعمل في عُمان منذ 2004",
      "عميلاً عبر ستة قطاعات",
      "موظف جاهز لمساعدتك",
      "معاملة عملاء سنويًا",
    ]);
  });
});
