import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

const STORAGE_KEY = 'golf-weather.themeMode';

export type ThemeMode = 'system' | 'light' | 'dark';

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

type ThemeModeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

/**
 * Shares the user's preferred theme mode (system/light/dark) across the app,
 * persisted under `golf-weather.themeMode`. Defaults to `system`, i.e.
 * following the OS color scheme, until a stored override is loaded.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || !isThemeMode(stored)) return;
        setThemeModeState(stored);
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

  const value = useMemo<ThemeModeContextValue>(
    () => ({ themeMode, setThemeMode }),
    [themeMode, setThemeMode]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
}

/** Resolves the effective color scheme, honoring an explicit theme mode override over the OS setting. */
export function useResolvedColorScheme(): 'light' | 'dark' {
  const { themeMode } = useThemeMode();
  const systemScheme = useColorScheme();

  if (themeMode === 'light' || themeMode === 'dark') return themeMode;
  return systemScheme === 'dark' ? 'dark' : 'light';
}
