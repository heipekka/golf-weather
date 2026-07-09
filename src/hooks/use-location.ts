import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { useI18n } from '@/i18n';
import type { Coordinates } from '@/lib/geo';

// Used when permission is denied or location is unavailable, so the app
// still has something sensible to show.
const KUOPIO_FALLBACK: Coordinates = { lat: 62.8924, lon: 27.677 };

export type UseLocationResult = {
  coords: Coordinates;
  loading: boolean;
  permissionDenied: boolean;
  error: string | null;
  isFallback: boolean;
  refresh: () => void;
};

export function useLocation(): UseLocationResult {
  const { t } = useI18n();
  const [coords, setCoords] = useState<Coordinates>(KUOPIO_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

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
            setIsFallback(true);
            setCoords(KUOPIO_FALLBACK);
          }
          return;
        }

        if (!cancelled) setPermissionDenied(false);

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled) {
          setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
          setIsFallback(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('errors.failedToGetLocation'));
          setIsFallback(true);
          setCoords(KUOPIO_FALLBACK);
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

  return { coords, loading, permissionDenied, error, isFallback, refresh };
}
