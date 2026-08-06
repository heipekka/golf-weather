import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";

// Bumped to `.v2` so the new default (glass) applies to everyone once,
// including users with a previously saved system/light/dark preference
// under the old key — that key is simply abandoned. Choosing a theme again
// after this persists normally under the new key.
const STORAGE_KEY = "golf-weather.themeMode.v2";
const BACKGROUND_STORAGE_KEY = "golf-weather.glassBackground";

export type ThemeMode = "system" | "light" | "dark" | "glass";
export type GlassBackground = "photo" | "illustration";

function isThemeMode(value: unknown): value is ThemeMode {
  return (
    value === "system" ||
    value === "light" ||
    value === "dark" ||
    value === "glass"
  );
}

function isGlassBackground(value: unknown): value is GlassBackground {
  return value === "photo" || value === "illustration";
}

type ThemeModeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  glassBackground: GlassBackground;
  setGlassBackground: (background: GlassBackground) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

/**
 * Shares the user's preferred theme mode (system/light/dark/glass) and, for
 * the glass theme, which background image to show, persisted under
 * `golf-weather.themeMode.v2` and `golf-weather.glassBackground`. Defaults
 * to `glass` until a stored override under the new key is loaded.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("glass");
  const [glassBackground, setGlassBackgroundState] =
    useState<GlassBackground>("photo");

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || !isThemeMode(stored)) return;
        setThemeModeState(stored);
      })
      .catch(() => {});

    AsyncStorage.getItem(BACKGROUND_STORAGE_KEY)
      .then((stored) => {
        if (cancelled || !isGlassBackground(stored)) return;
        setGlassBackgroundState(stored);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  }, []);

  const setGlassBackground = useCallback((background: GlassBackground) => {
    setGlassBackgroundState(background);
    AsyncStorage.setItem(BACKGROUND_STORAGE_KEY, background).catch(() => {});
  }, []);

  const value = useMemo<ThemeModeContextValue>(
    () => ({ themeMode, setThemeMode, glassBackground, setGlassBackground }),
    [themeMode, setThemeMode, glassBackground, setGlassBackground],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }
  return context;
}

/** Resolves the effective color scheme, honoring an explicit theme mode override over the OS setting. */
export function useResolvedColorScheme(): "light" | "dark" {
  const { themeMode } = useThemeMode();
  const systemScheme = useColorScheme();

  if (themeMode === "light" || themeMode === "dark") return themeMode;
  // Glass reuses dark navigation chrome/status bar; its own background photo
  // and translucent surfaces are layered on top independently.
  if (themeMode === "glass") return "dark";
  return systemScheme === "dark" ? "dark" : "light";
}

/** Resolves the effective color palette (the `Colors` key), honoring an explicit theme mode override over the OS setting. */
export function useResolvedPalette(): "light" | "dark" | "glass" {
  const { themeMode } = useThemeMode();
  const systemScheme = useColorScheme();

  if (themeMode === "light" || themeMode === "dark" || themeMode === "glass") {
    return themeMode;
  }
  return systemScheme === "dark" ? "dark" : "light";
}
