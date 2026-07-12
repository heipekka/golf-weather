import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { useEffect } from 'react';

const STORAGE_KEY = 'golf-weather.lastRoute';

// The first real (non-`/`) pathname visited this session, captured once and
// never overwritten. Used to tell whether a screen is the session's actual
// entry point (no genuine previous page to go back to) versus a screen the
// user navigated to from elsewhere in-app, since `router.canGoBack()` alone
// isn't reliable here (e.g. the `/` redirect to a stored route can leave a
// history entry that makes `canGoBack()` true even with nothing meaningful
// behind it).
let sessionEntryPath: string | null = null;

/**
 * Persists the current pathname on every navigation, so the app can reopen
 * on the last visited screen instead of always redirecting to `/courses`.
 */
export function useTrackLastRoute() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === '/') return;
    if (sessionEntryPath === null) sessionEntryPath = pathname;
    AsyncStorage.setItem(STORAGE_KEY, pathname).catch(() => {});
  }, [pathname]);
}

/** Reads the last persisted pathname, or `null` if none is stored. */
export function getStoredRoute(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
}

/** Returns the first real pathname visited this session, or `null` if none yet. */
export function getSessionEntryPath(): string | null {
  return sessionEntryPath;
}
