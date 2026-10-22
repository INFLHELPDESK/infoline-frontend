"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Dial, type DialState } from "./what-changes-dial";

type Props = {
  labels: Record<DialState, string>;
  without: string[];
  withLeft: string[];
  withRight: string[];
};

const STATES: DialState[] = ["without", "with"];

// Figma pill offsets (px) away from the dial edge, per row, top to bottom.
const WITH_LEFT_SHIFT = [0, 23, 14, 1];
const WITH_RIGHT_SHIFT = [0, 24, 29, 0];

export default function ChangesToggle({ labels, without, withLeft, withRight }: Props) {
  const [state, setState] = useState<DialState>("without");
  const id = useId();
  const tabs = useRef<Record<DialState, HTMLButtonElement | null>>({ without: null, with: null });

  const select = (next: DialState, focus = false) => {
    setState(next);
    if (focus) tabs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      select(state === "without" ? "with" : "without", true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      select(e.key === "Home" ? "without" : "with", true);
    }
  };

  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="mx-auto flex w-full max-w-[456px] items-center rounded-2xl bg-[#e5e9ec] p-2"
      >
        {STATES.map((s) => (
          <button
            key={s}
            ref={(el) => {
              tabs.current[s] = el;
            }}
            id={`${id}-tab-${s}`}
            role="tab"
            type="button"
            aria-selected={state === s}
            aria-controls={`${id}-panel-${s}`}
            tabIndex={state === s ? 0 : -1}
            onClick={() => select(s)}
            onKeyDown={onKeyDown}
            className={`h-11 flex-1 rounded-xl px-3 text-[16px] leading-6 font-medium text-[#263238] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandblue-400 motion-reduce:transition-none ${
              state === s ? "bg-white" : "hover:bg-white/50"
            }`}
          >
            {labels[s]}
          </button>
        ))}
      </div>

      {STATES.map((s) => (
        <div
          key={s}
          id={`${id}-panel-${s}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${s}`}
          hidden={state !== s}
          className="mt-10 lg:mt-14"
        >
          <div className="flex flex-col items-center gap-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8">
            <ul className="order-2 flex w-full max-w-[448px] flex-col gap-4 lg:order-1 lg:max-w-[none] lg:items-end">
              {(s === "without" ? without : withLeft).map((text, i) => (
                <Pill key={text} state={s} shift={s === "with" ? WITH_LEFT_SHIFT[i] : 0} side="left">
                  {text}
                </Pill>
              ))}
            </ul>
            <div className="order-1 lg:order-2">
              <Dial state={s} />
            </div>
            <ul className="order-3 flex w-full max-w-[448px] flex-col gap-4 lg:max-w-[none] lg:items-start">
              {s === "with" &&
                withRight.map((text, i) => (
                  <Pill key={text} state={s} shift={WITH_RIGHT_SHIFT[i]} side="right">
                    {text}
                  </Pill>
                ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function Pill({
  state,
  shift,
  side,
  children,
}: {
  state: DialState;
  shift: number;
  side: "left" | "right";
  children: string;
}) {
  const mark = state === "with" ? "check" : "x";
  // Logical margins, so the offsets mirror with `dir`.
  const style = shift
    ? side === "left"
      ? { marginInlineEnd: shift }
      : { marginInlineStart: shift }
    : undefined;
  return (
    <li
      style={style}
      className={`inline-flex items-center gap-2 rounded-full py-2 ps-2 pe-4 text-[14px] leading-5 shadow-[0_4px_8px_rgba(0,0,0,0.11)] ${
        state === "with" ? "bg-white text-[#263238]" : "bg-[#e5e9ec] text-[#455a64]"
      }`}
    >
      <span
        aria-hidden
        className={`grid size-6 shrink-0 place-items-center rounded-full ${
          state === "with" ? "bg-brandblue-500" : "bg-[#78909c]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/assets/home-1/changes/mark-${mark}.svg`} alt="" width={16} height={16} />
      </span>
      <span>{children}</span>
    </li>
  );
}
