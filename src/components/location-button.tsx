import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { LocationPickerDialog } from './location-picker-dialog';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import type { Coordinates } from '@/lib/geo';
import { reverseGeocode } from '@/lib/geocode';

/** Always-visible location button. Shows "My location" while device GPS is
 * active, or the reverse-geocoded name of the active saved/fallback
 * location otherwise. Opens a map dialog to pick and save a new location,
 * which overrides live device GPS; the dialog also offers reverting back
 * to device GPS when it's available. */
export function LocationButton() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const { coords, source, savedLocation, deviceAvailable, setSavedLocation, clearSavedLocation } = useLocation();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [name, setName] = useState<string | null>(null);

  const usingDevice = source === 'device';

  useEffect(() => {
    if (usingDevice) return;
    let cancelled = false;
    setName(null);
    reverseGeocode(coords, locale)
      .then((result) => {
        if (!cancelled) setName(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lon, locale, usingDevice]);

  const label = usingDevice ? t('locationButton.myLocation') : name ?? t('locationButton.loading');

  function handleSelect(picked: Coordinates) {
    setSavedLocation(picked);
    // Re-geocode immediately so button name updates without waiting for
    // the next effect run.
    reverseGeocode(picked, locale)
      .then((result) => setName(result))
      .catch(() => {});
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('locationButton.open')}
        onPress={() => setDialogVisible(true)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <ThemedView type="backgroundElement" style={styles.inner}>
          <SymbolView
            name={{ ios: 'location', android: 'location-on', web: 'location_on' }}
            size={14}
            tintColor={theme.textSecondary}
          />
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {label}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <LocationPickerDialog
        visible={dialogVisible}
        value={savedLocation ?? coords}
        onClose={() => setDialogVisible(false)}
        onSelect={handleSelect}
        showUseDeviceLocation={deviceAvailable}
        onUseDeviceLocation={clearSavedLocation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
