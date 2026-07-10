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
import { AppState } from 'react-native';

import { useI18n } from '@/i18n';
import { haversineKm, type Coordinates } from '@/lib/geo';

// Used when permission is denied/unavailable and no location has been saved
// in settings, so the app still has something sensible to show.
const KUOPIO_FALLBACK: Coordinates = { lat: 62.8924, lon: 27.677 };

const STORAGE_KEY = 'golf-weather.location';

// Distance the device has to drift from the location used for the latest
// data fetch before we prompt the user to refresh.
const MOVE_REFRESH_THRESHOLD_KM = 40;

// How often to silently re-check the live device position while location
// sharing is active, to detect drift without a continuous GPS watch.
const LOCATION_CHECK_INTERVAL_MS = 15 * 60 * 1000;

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
  /** Whether device GPS coordinates are currently available, regardless of whether a saved location is overriding them. */
  deviceAvailable: boolean;
  /** Whether live device GPS has drifted `MOVE_REFRESH_THRESHOLD_KM`+ from the location used for the latest data fetch. */
  deviceMovedFar: boolean;
  refresh: () => void;
  setSavedLocation: (coords: Coordinates) => void;
  clearSavedLocation: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [deviceCoords, setDeviceCoords] = useState<Coordinates | null>(null);
  // Latest live device position from the silent background poll, separate
  // from `deviceCoords` (the position the current data was fetched for), so
  // drift between the two can be measured without disturbing fetched data.
  const [liveDeviceCoords, setLiveDeviceCoords] = useState<Coordinates | null>(null);
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
          const next = { lat: position.coords.latitude, lon: position.coords.longitude };
          setDeviceCoords(next);
          // A fresh fetch/refresh resets the baseline for drift detection.
          setLiveDeviceCoords(next);
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

  // Silently polls the live device position while location sharing is
  // active, without touching `loading`/`deviceCoords`, so a "you've moved"
  // prompt can be surfaced without disturbing the data already fetched.
  useEffect(() => {
    if (permissionDenied) return;
    let cancelled = false;

    async function checkPosition() {
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setLiveDeviceCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        }
      } catch {
        // Ignore; the next scheduled/foreground check will retry.
      }
    }

    const interval = setInterval(checkPosition, LOCATION_CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPosition();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, [permissionDenied, refreshToken]);

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  const setSavedLocation = useCallback((coords: Coordinates) => {
    setSavedLocationState(coords);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(coords)).catch(() => {});
  }, []);

  const clearSavedLocation = useCallback(() => {
    setSavedLocationState(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  // A manually saved location (via the location picker) takes precedence
  // over live device GPS, so picking a spot on the map always overrides
  // active location sharing rather than being silently ignored.
  const deviceAvailable = deviceCoords !== null;
  const source: LocationSource = savedLocation ? 'saved' : deviceCoords ? 'device' : 'fallback';
  const coords = savedLocation ?? deviceCoords ?? KUOPIO_FALLBACK;
  const deviceMovedFar =
    source === 'device' && !!liveDeviceCoords && !!deviceCoords
      ? haversineKm(liveDeviceCoords, deviceCoords) >= MOVE_REFRESH_THRESHOLD_KM
      : false;

  const value = useMemo<LocationContextValue>(
    () => ({
      coords,
      loading,
      permissionDenied,
      error,
      isFallback: source !== 'device',
      source,
      savedLocation,
      deviceAvailable,
      deviceMovedFar,
      refresh,
      setSavedLocation,
      clearSavedLocation,
    }),
    [
      coords,
      loading,
      permissionDenied,
      error,
      source,
      savedLocation,
      deviceAvailable,
      deviceMovedFar,
      refresh,
      setSavedLocation,
      clearSavedLocation,
    ]
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
