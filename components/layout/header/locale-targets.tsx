"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Where each OTHER language of the current page lives, for pages whose
 * translated URL cannot be derived from their own path (CMS articles: the
 * translated slug comes from the CMS, not from this one). `null` = the page says
 * nothing and the switcher keeps the same path in the new locale.
 */
export type LocaleTargets = Partial<Record<string, string>>;

type Ctx = { targets: LocaleTargets | null; setTargets: (t: LocaleTargets | null) => void };

const LocaleTargetsContext = createContext<Ctx>({ targets: null, setTargets: () => {} });

export function LocaleTargetsProvider({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState<LocaleTargets | null>(null);
  const value = useMemo(() => ({ targets, setTargets }), [targets]);
  return <LocaleTargetsContext.Provider value={value}>{children}</LocaleTargetsContext.Provider>;
}

/** Switcher side. */
export const useLocaleTargets = () => useContext(LocaleTargetsContext).targets;

/** Page side: declares the per-locale destinations while mounted; renders nothing. */
export function LocaleTargetsRegistrar({ targets }: { targets: LocaleTargets }) {
  const { setTargets } = useContext(LocaleTargetsContext);
  const key = JSON.stringify(targets);
  useEffect(() => {
    setTargets(JSON.parse(key) as LocaleTargets);
    return () => setTargets(null);
  }, [key, setTargets]);
  return null;
}
