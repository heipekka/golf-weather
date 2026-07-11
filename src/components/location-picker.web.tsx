import { lazy, Suspense } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useHasHydrated } from '@/hooks/use-color-scheme';
import type { Coordinates } from '@/lib/geo';

const MAP_HEIGHT = 260;

// Leaflet touches `window` at import time, which crashes Expo Router's
// static server rendering. Loading the map lazily means `import()` only
// resolves in the browser, after `useHasHydrated()` confirms we're mounted
// on the client, so it never runs during SSR.
const LocationPickerMap = lazy(() => import('./location-picker-map'));

export type LocationPickerProps = {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
  /** Map height in pixels. Defaults to 260. */
  height?: number;
};

export function LocationPicker({ value, onChange, height = MAP_HEIGHT }: LocationPickerProps) {
  const hasHydrated = useHasHydrated();

  if (!hasHydrated) {
    return <View style={[styles.container, { height }]} />;
  }

  return (
    <View style={[styles.container, { height }]}>
      <Suspense fallback={null}>
        <LocationPickerMap value={value} onChange={onChange} height={height} />
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
});
