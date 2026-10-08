"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type RouteId = "service" | "project" | "vendor" | "careers";

type RouteContextValue = {
  route: RouteId;
  setRoute: (r: RouteId) => void;
};

/**
 * Shared selection state between the route cards (above the trust strip) and
 * the adaptive form (below it). Choosing a card scrolls to the form with the
 * right field set already mounted.
 */
const RouteContext = createContext<RouteContextValue | null>(null);

export function RouteProvider({
  children,
  initialRoute = "service",
}: {
  children: ReactNode;
  initialRoute?: RouteId;
}) {
  const [route, setRoute] = useState<RouteId>(initialRoute);
  return (
    <RouteContext.Provider value={{ route, setRoute }}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRouteSelection(): RouteContextValue {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useRouteSelection must be used inside RouteProvider");
  return ctx;
}
