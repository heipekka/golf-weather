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

const STORAGE_KEY = 'golf-weather.darkScoring';

type DarkScoringContextValue = {
  darkScoringEnabled: boolean;
  setDarkScoringEnabled: (enabled: boolean) => void;
};

const DarkScoringContext = createContext<DarkScoringContextValue | null>(null);

/**
 * Shares whether hours with no playable light should be classified `Dark`
 * (and excluded from playability scoring) across every screen. Defaults to
 * `true` (today's behavior) and persists the choice under
 * `golf-weather.darkScoring`, so relaunching the app keeps the last setting.
 */
export function DarkScoringProvider({ children }: { children: ReactNode }) {
  const [darkScoringEnabled, setEnabledState] = useState(true);

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

  const setDarkScoringEnabled = useCallback((enabled: boolean) => {
    setEnabledState(enabled);
    AsyncStorage.setItem(STORAGE_KEY, String(enabled)).catch(() => {});
  }, []);

  const value = useMemo<DarkScoringContextValue>(
    () => ({ darkScoringEnabled, setDarkScoringEnabled }),
    [darkScoringEnabled, setDarkScoringEnabled],
  );

  return <DarkScoringContext.Provider value={value}>{children}</DarkScoringContext.Provider>;
}

export function useDarkScoring(): DarkScoringContextValue {
  const context = useContext(DarkScoringContext);
  if (!context) {
    throw new Error('useDarkScoring must be used within a DarkScoringProvider');
  }
  return context;
}
