"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type HeaderTheme = { forceLight: boolean; setForceLight: (v: boolean) => void };

const HeaderThemeContext = createContext<HeaderTheme>({
  forceLight: false,
  setForceLight: () => {},
});

/**
 * Lets a page ask the header for its light theme without the header knowing
 * the page's route (used by the error pages, which can render at any path).
 * Server-rendered children stay server components: the provider only passes
 * them through.
 */
export function HeaderThemeProvider({ children }: { children: ReactNode }) {
  const [forceLight, setForceLight] = useState(false);
  return (
    <HeaderThemeContext.Provider value={{ forceLight, setForceLight }}>
      {children}
    </HeaderThemeContext.Provider>
  );
}

/** Header side: has a page requested the light theme? */
export const useHeaderForceLight = () => useContext(HeaderThemeContext).forceLight;

/** Page side: request the light header while this component is mounted. */
export function useForceLightHeader() {
  const { setForceLight } = useContext(HeaderThemeContext);
  useEffect(() => {
    setForceLight(true);
    return () => setForceLight(false);
  }, [setForceLight]);
}
