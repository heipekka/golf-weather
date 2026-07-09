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
};

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const hasHydrated = useHasHydrated();

  if (!hasHydrated) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Suspense fallback={null}>
        <LocationPickerMap value={value} onChange={onChange} />
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MAP_HEIGHT,
    width: '100%',
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
});
