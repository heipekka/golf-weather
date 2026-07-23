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

const STORAGE_KEY = 'golf-weather.windLabels';

type WindLabelsContextValue = {
  windLabelsEnabled: boolean;
  setWindLabelsEnabled: (enabled: boolean) => void;
};

const WindLabelsContext = createContext<WindLabelsContextValue | null>(null);

/**
 * Shares whether wind-descriptive playability tiers (`Windy`, `Gusty`,
 * `Blustery`, `Gale`) should be used for hourly and main labels across every
 * screen. Defaults to `true` (today's behavior) and persists the choice
 * under `golf-weather.windLabels`, so relaunching the app keeps the last
 * setting.
 */
export function WindLabelsProvider({ children }: { children: ReactNode }) {
  const [windLabelsEnabled, setEnabledState] = useState(true);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || stored === null) return;
        setEnabledState(stored === 'true');
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const setWindLabelsEnabled = useCallback((enabled: boolean) => {
    setEnabledState(enabled);
    AsyncStorage.setItem(STORAGE_KEY, String(enabled)).catch(() => {});
  }, []);

  const value = useMemo<WindLabelsContextValue>(
    () => ({ windLabelsEnabled, setWindLabelsEnabled }),
    [windLabelsEnabled, setWindLabelsEnabled],
  );

  return <WindLabelsContext.Provider value={value}>{children}</WindLabelsContext.Provider>;
}

export function useWindLabels(): WindLabelsContextValue {
  const context = useContext(WindLabelsContext);
  if (!context) {
    throw new Error('useWindLabels must be used within a WindLabelsProvider');
  }
  return context;
}
