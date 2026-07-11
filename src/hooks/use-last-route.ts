import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { useEffect } from 'react';

const STORAGE_KEY = 'golf-weather.lastRoute';

/**
 * Persists the current pathname on every navigation, so the app can reopen
 * on the last visited screen instead of always redirecting to `/courses`.
 */
export function useTrackLastRoute() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === '/') return;
    AsyncStorage.setItem(STORAGE_KEY, pathname).catch(() => {});
  }, [pathname]);
}

/** Reads the last persisted pathname, or `null` if none is stored. */
export function getStoredRoute(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
}
