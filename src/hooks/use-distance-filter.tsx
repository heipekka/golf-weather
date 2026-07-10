import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'golf-weather.distanceRange';
const DEFAULT_MAX_KM = 200;

type DistanceFilterContextValue = {
  maxDistanceKm: number;
  setMaxDistanceKm: (km: number) => void;
};

const DistanceFilterContext = createContext<DistanceFilterContextValue | null>(null);

/**
 * Shares a single max-distance filter across every screen that renders the
 * distance selector. Persists the latest pick under `golf-weather.distanceRange`.
 * Default is 200 km.
 */
export function DistanceFilterProvider({ children }: { children: ReactNode }) {
  const [maxDistanceKm, setMaxDistanceKmState] = useState<number>(DEFAULT_MAX_KM);
  const hasExternalOverrideRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || hasExternalOverrideRef.current || !stored) return;
        const parsed = Number(stored);
        if (Number.isNaN(parsed) || parsed < 30 || parsed > 700) return;
        setMaxDistanceKmState(parsed);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const setMaxDistanceKm = useCallback((km: number) => {
    hasExternalOverrideRef.current = true;
    setMaxDistanceKmState(km);
    AsyncStorage.setItem(STORAGE_KEY, String(km)).catch(() => {});
  }, []);

  const value = useMemo<DistanceFilterContextValue>(
    () => ({ maxDistanceKm, setMaxDistanceKm }),
    [maxDistanceKm, setMaxDistanceKm]
  );

  return <DistanceFilterContext.Provider value={value}>{children}</DistanceFilterContext.Provider>;
}

export function useDistanceFilter(): DistanceFilterContextValue {
  const context = useContext(DistanceFilterContext);
  if (!context) {
    throw new Error('useDistanceFilter must be used within a DistanceFilterProvider');
  }
  return context;
}
