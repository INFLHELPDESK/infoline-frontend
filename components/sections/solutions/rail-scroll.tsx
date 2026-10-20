"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * The service rail's list. On narrow screens the rail scrolls horizontally, so
 * on mount we centre the active item (`aria-current="page"`) inside the rail's
 * own scroll container. This sets the container's scroll offset directly (no
 * animation, so reduced-motion is respected, and the page itself never
 * scrolls) and only when the rail actually overflows. The markup is identical
 * on server and client, so hydration is unaffected; keyboard and touch
 * scrolling are untouched.
 */
export default function RailScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const item = list.querySelector<HTMLElement>('[aria-current="page"]')?.closest("li");
    if (!item) return;

    const max = list.scrollWidth - list.clientWidth;
    // Left edge (in left-origin coordinates) that centres the item.
    const left = Math.min(
      max,
      Math.max(0, item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2),
    );
    // In RTL, scrollLeft runs from 0 (start, at the right) down to -max.
    list.scrollLeft = getComputedStyle(list).direction === "rtl" ? left - max : left;
  }, []);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
