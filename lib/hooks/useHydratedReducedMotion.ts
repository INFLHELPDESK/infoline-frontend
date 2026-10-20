"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * `prefers-reduced-motion` for components whose rendered markup depends on it.
 * The server snapshot is always `false`, so hydration matches the server HTML;
 * a reduced-motion visitor then switches over on the first client update
 * (framer-motion's `useReducedMotion` reads the preference during hydration and
 * raises React #418 for those visitors).
 */
export function useHydratedReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
