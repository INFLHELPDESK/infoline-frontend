import { describe, expect, it } from "vitest";
import { directionOffset, type RevealDirection } from "@/components/ui/motion/shared";

describe("directionOffset", () => {
  it.each<[RevealDirection, boolean, { x: number; y: number }]>([
    ["up", false, { x: 0, y: 24 }],
    ["up", true, { x: 0, y: 24 }],
    ["down", false, { x: 0, y: -24 }],
    ["down", true, { x: 0, y: -24 }],
    // Logical directions mirror under RTL.
    ["start", false, { x: -24, y: 0 }],
    ["start", true, { x: 24, y: 0 }],
    ["end", false, { x: 24, y: 0 }],
    ["end", true, { x: -24, y: 0 }],
    ["none", false, { x: 0, y: 0 }],
    ["none", true, { x: 0, y: 0 }],
  ])("%s (rtl=%s) -> %o", (direction, isRtl, expected) => {
    // toEqual treats -0 and 0 as different, so normalise before comparing.
    const { x, y } = directionOffset(direction, 24, isRtl);
    expect({ x: x + 0, y: y + 0 }).toEqual(expected);
  });

  it("falls back to no offset for an unknown direction", () => {
    expect(directionOffset("diagonal" as RevealDirection, 24, false)).toEqual({ x: 0, y: 0 });
  });
});
