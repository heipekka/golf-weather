import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { StartTimePicker } from './start-time-picker';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useStartTime } from '@/hooks/use-start-time';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { formatDayLabel, formatHour } from '@/lib/format';

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Full-width button that opens the start-time picker dialog, meant to sit directly above the course listing. */
export function StartTimeButton() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const { startTime, setStartTime } = useStartTime();
  const [pickerVisible, setPickerVisible] = useState(false);

  const startTimeLabel = startTime
    ? isSameDay(startTime, new Date())
      ? formatHour(startTime.toISOString(), locale)
      : `${formatDayLabel(startTime.toISOString(), locale)} ${formatHour(startTime.toISOString(), locale)}`
    : t('startTime.now');

  return (
    <>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('startTime.open')}
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}>
          <ThemedView type="backgroundElement" style={styles.buttonInner}>
            <SymbolView
              name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
              size={14}
              tintColor={theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {startTimeLabel}
            </ThemedText>
          </ThemedView>
        </Pressable>

        {startTime && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('startTime.now')}
            onPress={() => setStartTime(null)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.resetButtonInner}>
              <SymbolView
                name={{ ios: 'arrow.counterclockwise', android: 'history', web: 'history' }}
                size={14}
                tintColor={theme.textSecondary}
              />
              <ThemedText type="small" themeColor="textSecondary">
                {t('startTime.now')}
              </ThemedText>
            </ThemedView>
          </Pressable>
        )}
      </View>

      <StartTimePicker
        visible={pickerVisible}
        value={startTime}
        onClose={() => setPickerVisible(false)}
        onSelect={setStartTime}
        onReset={() => setStartTime(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    width: '100%',
    // The parent header's `gap` spaces every child uniformly; pull this one
    // closer to the sort tabs directly below it without affecting spacing
    // to the sibling above.
    marginBottom: -Spacing.two,
  },
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
  resetButtonInner: {
    flexDirection: 'row',
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
