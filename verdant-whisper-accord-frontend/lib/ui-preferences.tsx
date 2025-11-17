"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyDesignTokens,
  DensityMode,
  ThemeMode,
} from "../design-tokens";

type UiPreferencesContextValue = {
  themeMode: ThemeMode;
  densityMode: DensityMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setDensityMode: (mode: DensityMode) => void;
  toggleDensityMode: () => void;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | undefined>(
  undefined,
);

const THEME_STORAGE_KEY = "ui.themeMode";
const DENSITY_STORAGE_KEY = "ui.densityMode";

export const UiPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [densityMode, setDensityModeState] =
    useState<DensityMode>("comfortable");

  useEffect(() => {
    applyDesignTokens(themeMode, densityMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
      window.localStorage.setItem(DENSITY_STORAGE_KEY, densityMode);
    }
  }, [themeMode, densityMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as
      | ThemeMode
      | null;
    const storedDensity = window.localStorage.getItem(DENSITY_STORAGE_KEY) as
      | DensityMode
      | null;

    const resolvedTheme =
      storedTheme ??
      (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    const resolvedDensity = storedDensity ?? "comfortable";

    setThemeModeState(resolvedTheme);
    setDensityModeState(resolvedDensity);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setThemeModeState(event.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const value = useMemo<UiPreferencesContextValue>(
    () => ({
      themeMode,
      densityMode,
      setThemeMode: (mode) => setThemeModeState(mode),
      toggleThemeMode: () =>
        setThemeModeState((prev) => (prev === "light" ? "dark" : "light")),
      setDensityMode: (mode) => setDensityModeState(mode),
      toggleDensityMode: () =>
        setDensityModeState((prev) =>
          prev === "comfortable" ? "compact" : "comfortable",
        ),
    }),
    [themeMode, densityMode],
  );

  return (
    <UiPreferencesContext.Provider value={value}>
      {children}
    </UiPreferencesContext.Provider>
  );
};

export const useUiPreferences = () => {
  const context = useContext(UiPreferencesContext);
  if (!context) {
    throw new Error(
      "useUiPreferences must be used within UiPreferencesProvider",
    );
  }
  return context;
};

