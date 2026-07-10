import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { DistancePicker } from './distance-picker';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useDistanceFilter } from '@/hooks/use-distance-filter';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

/** Button that opens the distance-range picker dialog, meant to sit next to StartTimeButton. */
export function DistanceButton() {
  const { t } = useI18n();
  const theme = useTheme();
  const { maxDistanceKm, setMaxDistanceKm } = useDistanceFilter();
  const [pickerVisible, setPickerVisible] = useState(false);

  const label = t('distance.label').replace('{km}', String(maxDistanceKm));

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('distance.open')}
        onPress={() => setPickerVisible(true)}
        style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
      >
        <ThemedView type="backgroundElement" style={styles.buttonInner}>
          <SymbolView
            name={{ ios: 'ruler', android: 'straighten', web: 'straighten' }}
            size={14}
            tintColor={theme.textSecondary}
          />
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {label}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <DistancePicker
        visible={pickerVisible}
        value={maxDistanceKm}
        onClose={() => setPickerVisible(false)}
        onSelect={setMaxDistanceKm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  openButton: {
    flex: 1,
  },
  buttonInner: {
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
