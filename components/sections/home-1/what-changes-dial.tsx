/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

export type DialState = "without" | "with";

const A = "/assets/home-1/changes";

// Figma 448:1616 — the "With" ring is a blue conic sweep that ends at the needle.
const ARC: CSSProperties = {
  backgroundImage:
    "conic-gradient(from 184deg, #fff 0%, #fff 13%, #c6e5f4 28.2%, #8ecbea 43.5%, #55b1df 58.8%, #38a4d9 66.4%, #1c97d4 74%, #38a4d9 77.3%, #55b1df 80.5%, #8ecbea 87%, #c6e5f4 93.5%, #fff 100%)",
};

/** Decorative gauge (outer 333px). Sizes and offsets are Figma's, in px. */
export function Dial({ state }: { state: DialState }) {
  const isWith = state === "with";
  return (
    <div
      aria-hidden
      data-dial
      className="relative size-[333px] shrink-0 rounded-full bg-gradient-to-b from-[#f8f7f9] to-white p-[19.6px] shadow-[0_6.5px_7.3px_rgba(0,0,0,0.05),0_27.7px_13.9px_rgba(0,0,0,0.04),0_62px_18.8px_rgba(0,0,0,0.02)] max-sm:scale-[.85]"
    >
      <div className="relative size-[293.9px] overflow-clip rounded-full bg-white">
        {isWith && <div className="absolute inset-0 rounded-full opacity-50" style={ARC} />}
        <div className="absolute inset-0 rounded-full shadow-[inset_27.4px_44.8px_32.4px_rgba(22,0,56,0.09),inset_49.8px_79.7px_37.4px_rgba(22,0,56,0.03)]" />
      </div>
      <div className="absolute left-[35.9px] top-[35.1px] size-[262.8px]">
        <img
          src={`${A}/dial-outer.svg`}
          alt=""
          className="absolute block"
          style={{ maxWidth: "none", left: "-9.94%", top: "-1.86%", width: "119.88%", height: "136.64%" }}
        />
        <img
          src={`${A}/dial-mid.svg`}
          alt=""
          className="absolute block"
          style={{ maxWidth: "none", left: 22.9, top: 5.7, width: 217.1, height: 217.1 }}
        />
        <img
          src={`${A}/dial-hub.svg`}
          alt=""
          className="absolute block size-[62px]"
          style={{ maxWidth: "none", left: 101.2, top: 100.4 }}
        />
        <div className="absolute left-[9px] top-[8.5px] h-[148.7px] w-[243.3px] overflow-clip">
          <img
            src={`${A}/dial-ticks.png`}
            alt=""
            width={242.5}
            height={242.5}
            style={{ maxWidth: "none" }}
            className="absolute left-0 top-0 block"
          />
          {isWith && (
            <img
              src={`${A}/needle-with.svg`}
              alt=""
              className="absolute block"
              style={{ maxWidth: "none", left: 110, top: 106.9, width: 120.5, height: 36.2, transform: "scaleX(-1)" }}
            />
          )}
        </div>
        {!isWith && (
          <>
            <img
              src={`${A}/needle-without.svg`}
              alt=""
              className="absolute block"
              style={{ maxWidth: "none", left: 28.8, top: 116.4, width: 120.5, height: 36.2 }}
            />
            <img
              src={`${A}/needle-pin.svg`}
              alt=""
              className="absolute block size-2"
              style={{ maxWidth: "none", left: 127.3, top: 128.2 }}
            />
          </>
        )}
      </div>
    </div>
  );
}
