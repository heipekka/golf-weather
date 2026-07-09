import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useI18n } from '@/i18n';
import type { Coordinates } from '@/lib/geo';

// Used when permission is denied/unavailable and no location has been saved
// in settings, so the app still has something sensible to show.
const KUOPIO_FALLBACK: Coordinates = { lat: 62.8924, lon: 27.677 };

const STORAGE_KEY = 'golf-weather.location';

export type LocationSource = 'device' | 'saved' | 'fallback';

function isCoordinates(value: unknown): value is Coordinates {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Coordinates).lat === 'number' &&
    typeof (value as Coordinates).lon === 'number'
  );
}

export type LocationContextValue = {
  coords: Coordinates;
  loading: boolean;
  permissionDenied: boolean;
  error: string | null;
  isFallback: boolean;
  source: LocationSource;
  savedLocation: Coordinates | null;
  refresh: () => void;
  setSavedLocation: (coords: Coordinates) => void;
  clearSavedLocation: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [deviceCoords, setDeviceCoords] = useState<Coordinates | null>(null);
  const [savedLocation, setSavedLocationState] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || !stored) return;
        const parsed = JSON.parse(stored);
        if (isCoordinates(parsed)) setSavedLocationState(parsed);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function locate() {
      setLoading(true);
      setError(null);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setPermissionDenied(true);
            setDeviceCoords(null);
          }
          return;
        }

        if (!cancelled) setPermissionDenied(false);

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled) {
          setDeviceCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('errors.failedToGetLocation'));
          setDeviceCoords(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    locate();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` intentionally excluded so a language change doesn't re-trigger a location request.
  }, [refreshToken]);

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  const setSavedLocation = useCallback((coords: Coordinates) => {
    setSavedLocationState(coords);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(coords)).catch(() => {});
  }, []);

  const clearSavedLocation = useCallback(() => {
    setSavedLocationState(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const source: LocationSource = deviceCoords ? 'device' : savedLocation ? 'saved' : 'fallback';
  const coords = deviceCoords ?? savedLocation ?? KUOPIO_FALLBACK;

  const value = useMemo<LocationContextValue>(
    () => ({
      coords,
      loading,
      permissionDenied,
      error,
      isFallback: source !== 'device',
      source,
      savedLocation,
      refresh,
      setSavedLocation,
      clearSavedLocation,
    }),
    [coords, loading, permissionDenied, error, source, savedLocation, refresh, setSavedLocation, clearSavedLocation]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
