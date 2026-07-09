import { useCallback, useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n';
import { fetchAllSources } from '@/lib/weather';
import type { CourseWeather } from '@/lib/weather';

export type UseCourseWeatherResult = {
  weather: CourseWeather | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useCourseWeather(
  lat: number,
  lon: number,
  reloadToken?: number
): UseCourseWeatherResult {
  const { t } = useI18n();
  const [weather, setWeather] = useState<CourseWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const forceRefreshRef = useRef(false);
  const seenReloadTokenRef = useRef(reloadToken);

  // Bypasses the cache and refetches whenever `reloadToken` changes (e.g. at
  // an hourly rollover boundary), so forecasts stay fresh instead of just
  // re-labeling stale data under the new hour.
  useEffect(() => {
    if (reloadToken === undefined || reloadToken === seenReloadTokenRef.current) return;
    seenReloadTokenRef.current = reloadToken;
    forceRefreshRef.current = true;
    setRefreshToken((t) => t + 1);
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const forceRefresh = forceRefreshRef.current;
      forceRefreshRef.current = false;

      try {
        const data = await fetchAllSources(lat, lon, {
          forceRefresh,
          onPartial: (partial) => {
            if (cancelled) return;
            setWeather(partial);
            if (partial.aggregated.length > 0) setLoading(false);
          },
        });
        if (!cancelled) setWeather(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('errors.failedToLoadWeather'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` intentionally excluded so a language change doesn't re-trigger a fetch.
  }, [lat, lon, refreshToken]);

  const refresh = useCallback(() => {
    forceRefreshRef.current = true;
    setRefreshToken((t) => t + 1);
  }, []);

  return { weather, loading, error, refresh };
}
